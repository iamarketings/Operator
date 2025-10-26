// Fix: Switched to a namespace import for React to solve JSX type resolution errors.
import * as React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Postes from './components/Postes';
import LiaisonsExternes from './components/LiaisonsExternes';
import FilesDattente from './components/FilesDattente';
import Historique from './components/Historique';
import useAsteriskData from './hooks/useAsteriskData';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationContainer from './components/shared/NotificationContainer';

export type Page = "dashboard" | "postes" | "liaisons" | "files" | "historique";

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState<Page>('dashboard');

  const {
    extensions,
    addExtension,
    updateExtension,
    deleteExtension,
    trunks,
    addTrunk,
    updateTrunk,
    deleteTrunk,
    queues,
    addQueue,
    updateQueue,
    deleteQueue,
    cdr
  } = useAsteriskData();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard 
                  registeredExtensionsCount={extensions.filter(e => e.status === 'Registered').length} 
                  totalExtensionsCount={extensions.length}
                  registeredTrunksCount={trunks.filter(t => t.status === 'Registered').length} 
                  totalTrunksCount={trunks.length}
               />;
      case 'postes':
        return <Postes extensions={extensions} onAdd={addExtension} onUpdate={updateExtension} onDelete={deleteExtension} />;
      case 'liaisons':
        return <LiaisonsExternes trunks={trunks} onAdd={addTrunk} onUpdate={updateTrunk} onDelete={deleteTrunk} />;
      case 'files':
        return <FilesDattente queues={queues} extensions={extensions} onAdd={addQueue} onUpdate={updateQueue} onDelete={deleteQueue} />;
      case 'historique':
        return <Historique cdr={cdr} />;
      default:
        return <Dashboard 
                  registeredExtensionsCount={extensions.filter(e => e.status === 'Registered').length} 
                  totalExtensionsCount={extensions.length}
                  registeredTrunksCount={trunks.filter(t => t.status === 'Registered').length}
                  totalTrunksCount={trunks.length}
               />;
    }
  };
  
  const pageTitles: Record<Page, string> = {
    dashboard: "Vue d'ensemble",
    postes: "Gestion des Postes",
    liaisons: "Gestion des Liaisons Externes",
    files: "Gestion des Files d'attente",
    historique: "Historique des Appels"
  };

  return (
    <NotificationProvider>
      <div className="flex h-screen bg-background font-sans">
          <Sidebar 
            isOpen={isSidebarOpen} 
            setIsOpen={setIsSidebarOpen} 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              sidebarOpen={isSidebarOpen} 
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              title={pageTitles[currentPage]}
            />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
              {renderPage()}
            </main>
          </div>
        </div>
        <NotificationContainer />
      </NotificationProvider>
  );
};

export default App;