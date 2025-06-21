
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Task, TaskStatus } from '@/types/task';
import { useTask } from '@/contexts/TaskContext';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const { deleteTask, updateTask } = useTask();

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    updateTask(task.id, { status: newStatus });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
    }
  };

  const isOverdue = new Date(task.deadline) < new Date() && task.status !== TaskStatus.COMPLETED;

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg truncate">{task.title}</h3>
          <Badge className={getStatusColor(task.status)}>
            {task.status}
          </Badge>
        </div>
        {isOverdue && (
          <Badge variant="destructive" className="w-fit">
            Overdue!
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600 text-sm line-clamp-3">{task.description}</p>
        
        <div className="text-sm text-gray-500">
          <p>Deadline: {format(new Date(task.deadline), 'MMM dd, yyyy')}</p>
          <p>Created: {format(new Date(task.createdAt), 'MMM dd, yyyy')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {task.status !== TaskStatus.COMPLETED && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(TaskStatus.COMPLETED)}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              Mark Complete
            </Button>
          )}
          
          {task.status === TaskStatus.PENDING && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              Start Task
            </Button>
          )}

          {task.status === TaskStatus.COMPLETED && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(TaskStatus.PENDING)}
              className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
            >
              Reopen
            </Button>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(task)}
            className="flex-1"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
