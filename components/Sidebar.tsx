// Fix: Switched to a namespace import for React to solve JSX type resolution errors.
import * as React from 'react';
import { BarChart2, Phone, Users, Server, Radio, LogOut, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import type { Page } from '../App';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, text, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center p-3 my-1 rounded-lg transition-colors duration-200 w-full text-left ${
      active
        ? 'bg-primary text-white shadow-lg'
        : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {icon}
    <span className="ml-4 font-medium">{text}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, currentPage, setCurrentPage }) => {
  
  if (!isOpen) {
    return (
       <div className="p-3 bg-surface border-r border-border flex flex-col items-center transition-all duration-300">
         <div className="w-full flex justify-center p-3 mb-6">
            <Radio size={28} className="text-primary" />
          </div>
        <button onClick={() => setIsOpen(true)} className="p-2 rounded-full hover:bg-gray-200 text-text-secondary">
          <ChevronRight size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-surface border-r border-border flex flex-col transition-all duration-300">
      <div className="flex items-center justify-between p-4 border-b border-border h-16">
        <div className="flex items-center">
            <Radio size={28} className="text-primary" />
            <h1 className="text-xl font-bold ml-3 text-text-primary">Operator</h1>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-200 text-text-secondary">
          <ChevronLeft size={20} />
        </button>
      </div>
      <nav className="flex-1 px-4 py-4">
        <NavItem icon={<BarChart2 size={20} />} text="Tableau de bord" active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} />
        <NavItem icon={<Phone size={20} />} text="Postes" active={currentPage === 'postes'} onClick={() => setCurrentPage('postes')} />
        <NavItem icon={<Server size={20} />} text="Liaisons externes" active={currentPage === 'liaisons'} onClick={() => setCurrentPage('liaisons')} />
        <NavItem icon={<Users size={20} />} text="Files d'attente" active={currentPage === 'files'} onClick={() => setCurrentPage('files')} />
        <NavItem icon={<BookOpen size={20} />} text="Historique" active={currentPage === 'historique'} onClick={() => setCurrentPage('historique')} />
      </nav>
      <div className="px-4 py-4 border-t border-border">
         <NavItem icon={<LogOut size={20} />} text="Déconnexion" onClick={() => alert('Fonction de déconnexion à implémenter.')} disabled={true}/>
      </div>
    </div>
  );
};

export default Sidebar;