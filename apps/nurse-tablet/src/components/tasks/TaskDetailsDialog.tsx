import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, MapPin, Calendar, FileText } from 'lucide-react';
import { formatDateTime, getPriorityColor } from '@/lib/utils';
import type { Task } from '@/types';

interface TaskDetailsDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (id: string, notes?: string) => void;
  onStartTask: (id: string) => void;
}

export function TaskDetailsDialog({
  task,
  open,
  onOpenChange,
  onComplete,
  onStartTask,
}: TaskDetailsDialogProps) {
  const [notes, setNotes] = useState('');

  if (!task) return null;

  const handleComplete = () => {
    onComplete(task.id, notes);
    setNotes('');
    onOpenChange(false);
  };

  const handleStart = () => {
    onStartTask(task.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{task.title}</DialogTitle>
              <DialogDescription className="text-base mt-2">
                {task.description}
              </DialogDescription>
            </div>
            <Badge variant={task.priority} className="text-base px-3 py-1">
              {task.priority.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Patient Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">Patient Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-medium">{task.patientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{task.room}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Task Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">Task Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Time</p>
                  <p className="font-medium">{formatDateTime(task.dueTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">~{task.estimatedDuration} minutes</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Task Type</p>
              <Badge variant="secondary">{task.type}</Badge>
            </div>
            {task.assignedTo && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Assigned To</p>
                <p className="font-medium">{task.assignedTo}</p>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">Status</h4>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  task.status === 'completed'
                    ? 'default'
                    : task.status === 'in_progress'
                    ? 'outline'
                    : 'secondary'
                }
              >
                {task.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {task.completedAt && (
                <span className="text-sm text-muted-foreground">
                  Completed at {formatDateTime(task.completedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Notes Section */}
          {task.status !== 'completed' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Completion Notes</h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this task..."
                className="w-full min-h-[100px] p-3 rounded-lg border border-input bg-background text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Existing Notes */}
          {task.notes && (
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Previous Notes
              </h4>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm">{task.notes}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="lg">
            Close
          </Button>
          {task.status === 'pending' && (
            <Button variant="secondary" onClick={handleStart} size="lg">
              Start Task
            </Button>
          )}
          {task.status !== 'completed' && (
            <Button onClick={handleComplete} size="lg" className="touch-target">
              Mark as Complete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
