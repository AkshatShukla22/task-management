
import React, { useState } from 'react';
import { Task } from '@/types/task';
import { useTask } from '@/contexts/TaskContext';
import Header from '@/components/layout/Header';
import TaskStats from '@/components/dashboard/TaskStats';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';

const Dashboard: React.FC = () => {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { filteredTasks, loading } = useTask();

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onCreateTask={handleCreateTask} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onCreateTask={handleCreateTask} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TaskStats />
        <TaskFilters />
        
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              No tasks found
            </div>
            <p className="text-gray-400 mb-6">
              Create your first task to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
              />
            ))}
          </div>
        )}
      </main>

      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={handleCloseForm}
        editingTask={editingTask}
      />
    </div>
  );
};

export default Dashboard;
