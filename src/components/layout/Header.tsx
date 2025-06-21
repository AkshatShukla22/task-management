
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Plus } from 'lucide-react';

interface HeaderProps {
  onCreateTask: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCreateTask }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
            <p className="text-sm text-gray-600">Welcome back, {user?.name}!</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button onClick={onCreateTask} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
            
            <Button
              variant="outline"
              onClick={logout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
