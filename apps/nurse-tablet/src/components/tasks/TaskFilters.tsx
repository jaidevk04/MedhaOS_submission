import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  filter: 'all' | 'urgent' | 'soon' | 'routine';
  onFilterChange: (filter: 'all' | 'urgent' | 'soon' | 'routine') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  taskCounts: {
    all: number;
    urgent: number;
    soon: number;
    routine: number;
  };
}

export function TaskFilters({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  taskCounts,
}: TaskFiltersProps) {
  const filters = [
    { value: 'all' as const, label: 'All Tasks', count: taskCounts.all },
    { value: 'urgent' as const, label: 'Urgent', count: taskCounts.urgent, variant: 'urgent' as const },
    { value: 'soon' as const, label: 'Soon', count: taskCounts.soon, variant: 'soon' as const },
    { value: 'routine' as const, label: 'Routine', count: taskCounts.routine, variant: 'routine' as const },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tasks, patients, or rooms..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-12 pl-10 pr-4 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="lg"
            onClick={() => onFilterChange(f.value)}
            className={cn(
              'shrink-0 touch-target',
              filter === f.value && f.variant && `bg-${f.variant} hover:bg-${f.variant}/90`
            )}
          >
            {f.label}
            {f.count > 0 && (
              <Badge
                variant={filter === f.value ? 'secondary' : 'outline'}
                className="ml-2"
              >
                {f.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Active Filters Indicator */}
      {(filter !== 'all' || searchQuery) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>
            {filter !== 'all' && `Showing ${filter} tasks`}
            {filter !== 'all' && searchQuery && ' • '}
            {searchQuery && `Searching for "${searchQuery}"`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onFilterChange('all');
              onSearchChange('');
            }}
            className="ml-auto"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
