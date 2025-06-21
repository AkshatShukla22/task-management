
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, TaskStatus } from '@/types/task';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  filteredTasks: Task[];
  setStatusFilter: (status: TaskStatus | 'All') => void;
  setSearchQuery: (query: string) => void;
  statusFilter: TaskStatus | 'All';
  searchQuery: string;
  loading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTasks();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedTasks: Task[] = data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status as TaskStatus,
        deadline: task.deadline,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      }));

      setTasks(formattedTasks);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: taskData.title,
            description: taskData.description,
            status: taskData.status,
            deadline: taskData.deadline,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status as TaskStatus,
        deadline: data.deadline,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setTasks(prev => [newTask, ...prev]);
      toast({
        title: "Task Created",
        description: "Your task has been added successfully!",
      });
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.status) updateData.status = updates.status;
      if (updates.deadline) updateData.deadline = updates.deadline;

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status as TaskStatus,
        deadline: data.deadline,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));

      toast({
        title: "Task Updated",
        description: "Your task has been updated successfully!",
      });
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setTasks(prev => prev.filter(task => task.id !== id));
      toast({
        title: "Task Deleted",
        description: "Your task has been removed successfully!",
      });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const value: TaskContextType = {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    filteredTasks,
    setStatusFilter,
    setSearchQuery,
    statusFilter,
    searchQuery,
    loading
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
