import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn, formatTime, getTimeUntil } from '@/lib/utils';
import { useGesture } from '@/hooks/useGesture';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, onComplete, onSnooze, onClick }: TaskCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { bind } = useGesture({
    onSwipeLeft: () => {
      setSwipeDirection('left');
      setTimeout(() => {
        setIsCompleting(true);
        setTimeout(() => {
          onComplete(task.id);
        }, 300);
      }, 100);
    },
    onSwipeRight: () => {
      setSwipeDirection('right');
      setTimeout(() => {
        onSnooze(task.id);
        setSwipeDirection(null);
      }, 300);
    },
  });

  const priorityColors = {
    urgent: 'border-l-4 border-l-urgent bg-urgent/5',
    soon: 'border-l-4 border-l-soon bg-soon/5',
    routine: 'border-l-4 border-l-routine bg-routine/5',
  };

  const isOverdue = new Date(task.dueTime) < new Date() && task.status !== 'completed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      {...bind()}
      className={cn(
        'relative',
        swipeDirection === 'left' && 'animate-slide-out',
        swipeDirection === 'right' && 'animate-slide-out',
        isCompleting && 'opacity-0 transition-opacity duration-300'
      )}
    >
      <Card
        className={cn(
          'cursor-pointer hover:shadow-md transition-all touch-target',
          priorityColors[task.priority],
          isDragging && 'opacity-50 shadow-lg scale-105',
          isOverdue && 'ring-2 ring-urgent'
        )}
        onClick={() => onClick(task)}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{task.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{task.description}</p>
            </div>
            <Badge variant={task.priority} className="shrink-0">
              {task.priority.toUpperCase()}
            </Badge>
          </div>

          {/* Patient Info */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{task.patientName}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{task.room}</span>
            </div>
          </div>

          {/* Time and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={cn('w-4 h-4', isOverdue && 'text-urgent')} />
              <span className={cn('text-sm font-medium', isOverdue && 'text-urgent')}>
                {isOverdue ? 'Overdue' : getTimeUntil(task.dueTime)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({formatTime(task.dueTime)})
              </span>
            </div>

            {task.status === 'in_progress' && (
              <Badge variant="outline" className="bg-info/10 text-info border-info">
                In Progress
              </Badge>
            )}
          </div>

          {/* Task Type Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {task.type}
            </Badge>
            {task.estimatedDuration && (
              <span className="text-xs text-muted-foreground">
                ~{task.estimatedDuration} min
              </span>
            )}
          </div>

          {/* Quick Actions (visible on hover/touch) */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 touch-target"
              onClick={(e) => {
                e.stopPropagation();
                onComplete(task.id);
              }}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 touch-target"
              onClick={(e) => {
                e.stopPropagation();
                onSnooze(task.id);
              }}
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Snooze
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Swipe Indicators */}
      {swipeDirection === 'left' && (
        <div className="absolute inset-0 bg-success/20 flex items-center justify-end pr-6 rounded-lg">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
      )}
      {swipeDirection === 'right' && (
        <div className="absolute inset-0 bg-warning/20 flex items-center justify-start pl-6 rounded-lg">
          <AlertCircle className="w-8 h-8 text-warning" />
        </div>
      )}
    </div>
  );
}
