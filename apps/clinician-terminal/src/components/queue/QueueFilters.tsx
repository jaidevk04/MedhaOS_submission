import { Badge } from '@/components/ui/badge';
import type { QueueFilter, QueueSortBy, QueuePatient } from '@/types/patient';
import { useQueueStore } from '@/store/queueStore';
import { Search, SlidersHorizontal } from 'lucide-react';

export function QueueFilters() {
  const { filter, sortBy, searchQuery, setFilter, setSortBy, setSearchQuery, patients } =
    useQueueStore();

  const filterOptions: Array<{ value: QueueFilter; label: string }> = [
    { value: 'all', label: 'All Patients' },
    { value: 'waiting', label: 'Waiting' },
    { value: 'critical', label: 'Critical' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'routine', label: 'Routine' },
  ];

  const sortOptions: Array<{ value: QueueSortBy; label: string }> = [
    { value: 'urgency', label: 'Urgency Score' },
    { value: 'wait_time', label: 'Wait Time' },
    { value: 'arrival_time', label: 'Arrival Time' },
  ];

  const getFilterCount = (filterValue: QueueFilter) => {
    switch (filterValue) {
      case 'all':
        return patients.length;
      case 'waiting':
        return patients.filter((p: QueuePatient) => p.status === 'waiting').length;
      case 'critical':
        return patients.filter((p: QueuePatient) => p.urgency_score >= 70).length;
      case 'urgent':
        return patients.filter((p: QueuePatient) => p.urgency_score >= 40 && p.urgency_score < 70).length;
      case 'routine':
        return patients.filter((p: QueuePatient) => p.urgency_score < 40).length;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by patient name, ID, or complaint..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Filters and Sort */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          {filterOptions.map((option) => {
            const count = getFilterCount(option.value);
            return (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
                {count > 0 && (
                  <Badge
                    variant={filter === option.value ? 'default' : 'outline'}
                    className="ml-1.5"
                  >
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as QueueSortBy)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
