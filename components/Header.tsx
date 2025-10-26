// Fix: Switched to a namespace import for React to solve JSX type resolution errors.
import * as React from 'react';
import { Menu, Bell, UserCircle } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, sidebarOpen, title }) => {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-surface border-b border-border flex-shrink-0">
      <div className="flex items-center">
        {!sidebarOpen && (
             <button onClick={toggleSidebar} className="text-text-secondary focus:outline-none focus:text-text-primary">
             <Menu size={24} />
           </button>
        )}
        <h1 className={`text-lg font-semibold text-text-primary ${!sidebarOpen ? 'ml-4' : ''}`}>{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button className="relative text-text-secondary hover:text-text-primary">
          <Bell size={20} />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="w-px h-6 bg-border"></div>
        <div className="flex items-center">
            <UserCircle size={24} className="text-text-secondary"/>
            <span className="ml-2 text-sm font-medium text-text-primary hidden md:block">Utilisateur</span>
        </div>
      </div>
    </header>
  );
};

export default Header;