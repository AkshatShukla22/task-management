
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskStatus } from '@/types/task';
import { useTask } from '@/contexts/TaskContext';
import { Search } from 'lucide-react';

const TaskFilters: React.FC = () => {
  const { statusFilter, setStatusFilter, searchQuery, setSearchQuery } = useTask();

  const filterOptions = [
    { label: 'All Tasks', value: 'All' as const },
    { label: 'Pending', value: TaskStatus.PENDING },
    { label: 'In Progress', value: TaskStatus.IN_PROGRESS },
    { label: 'Completed', value: TaskStatus.COMPLETED },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search tasks by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={statusFilter === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(option.value)}
            className="transition-all duration-200"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TaskFilters;
