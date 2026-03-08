import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskDetailsDialog } from '@/components/tasks/TaskDetailsDialog';
import { useTaskStore } from '@/store/taskStore';
import { useToast } from '@/hooks/useToast';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { Task } from '@/types';

export default function TasksPage() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { toast } = useToast();

  const {
    tasks,
    filteredTasks,
    filter,
    searchQuery,
    setFilter,
    setSearchQuery,
    completeTask,
    updateTask,
    reorderTasks,
    fetchTasks,
  } = useTaskStore();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredTasks.findIndex((task) => task.id === active.id);
      const newIndex = filteredTasks.findIndex((task) => task.id === over.id);

      const newOrder = arrayMove(filteredTasks, oldIndex, newIndex);
      reorderTasks(newOrder);

      toast({
        title: 'Task Reordered',
        description: 'Task priority has been updated',
      });
    }
  };

  const handleCompleteTask = (id: string, notes?: string) => {
    completeTask(id, notes);
    toast({
      title: 'Task Completed',
      description: 'Task has been marked as complete',
    });
  };

  const handleSnoozeTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      const newDueTime = new Date(task.dueTime);
      newDueTime.setMinutes(newDueTime.getMinutes() + 30);
      updateTask(id, { dueTime: newDueTime.toISOString() });
      toast({
        title: 'Task Snoozed',
        description: 'Task has been postponed by 30 minutes',
      });
    }
  };

  const handleStartTask = (id: string) => {
    updateTask(id, { status: 'in_progress' });
    toast({
      title: 'Task Started',
      description: 'Task is now in progress',
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTasks();
    setIsRefreshing(false);
    toast({
      title: 'Tasks Refreshed',
      description: isOnline ? 'Latest tasks loaded' : 'Loaded from offline storage',
    });
  };

  const taskCounts = {
    all: tasks.filter((t: Task) => t.status !== 'completed').length,
    urgent: tasks.filter((t: Task) => t.priority === 'urgent' && t.status !== 'completed').length,
    soon: tasks.filter((t: Task) => t.priority === 'soon' && t.status !== 'completed').length,
    routine: tasks.filter((t: Task) => t.priority === 'routine' && t.status !== 'completed').length,
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="touch-target"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Tasks</h1>
              <p className="text-sm text-muted-foreground">
                {taskCounts.all} active tasks
                {!isOnline && ' (Offline Mode)'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="touch-target"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <TaskFilters
          filter={filter}
          onFilterChange={setFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          taskCounts={taskCounts}
        />
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <span className="text-4xl">✓</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Tasks Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your filters'
                : 'All tasks are complete!'}
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTasks.map((t: Task) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {filteredTasks.map((task: Task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onSnooze={handleSnoozeTask}
                    onClick={handleTaskClick}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={selectedTask}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onComplete={handleCompleteTask}
        onStartTask={handleStartTask}
      />

      {/* Swipe Hint (shown on first visit) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm shadow-lg hidden">
        💡 Swipe left to complete, right to snooze
      </div>
    </div>
  );
}
