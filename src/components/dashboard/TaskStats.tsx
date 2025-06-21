
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTask } from '@/contexts/TaskContext';
import { TaskStatus } from '@/types/task';

const TaskStats: React.FC = () => {
  const { tasks } = useTask();

  const stats = {
    total: tasks.length,
    pending: tasks.filter(task => task.status === TaskStatus.PENDING).length,
    inProgress: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
    completed: tasks.filter(task => task.status === TaskStatus.COMPLETED).length,
    overdue: tasks.filter(task => 
      new Date(task.deadline) < new Date() && task.status !== TaskStatus.COMPLETED
    ).length,
  };

  const statCards = [
    { title: 'Total Tasks', value: stats.total, color: 'text-blue-600' },
    { title: 'Pending', value: stats.pending, color: 'text-yellow-600' },
    { title: 'In Progress', value: stats.inProgress, color: 'text-blue-600' },
    { title: 'Completed', value: stats.completed, color: 'text-green-600' },
    { title: 'Overdue', value: stats.overdue, color: 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TaskStats;
