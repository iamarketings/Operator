import * as React from 'react';
import { PlusCircle, Users, Clock, Edit, Trash2 } from 'lucide-react';
import type { Queue, QueueMember, Extension } from '../types';
import Modal from './shared/Modal';
import { useNotification } from '../contexts/NotificationContext';

const getMemberStatusChip = (status: QueueMember['status']) => {
    switch (status) {
        case 'Logged In':
            return <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">Disponible</span>;
        case 'Logged Out':
            return <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">Déconnecté</span>;
        case 'In Use':
            return <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">En appel</span>;
        case 'Ringing':
            return <span className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">Sonnerie</span>;
        default:
            return null;
    }
};

const QueueCard: React.FC<{ queue: Queue; onEdit: () => void; onDelete: () => void; }> = ({ queue, onEdit, onDelete }) => {
    const loggedInMembers = queue.members.filter(m => m.status !== 'Logged Out').length;

    return (
        <div className="bg-surface rounded-lg shadow-md border border-border p-6 flex flex-col">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-text-primary">{queue.name}</h3>
                    <p className="text-sm text-text-secondary capitalize">{queue.strategy.replace('roundrobin', 'Tourniquet')}</p>
                </div>
                <div className="flex space-x-1">
                     <button onClick={onEdit} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"><Edit size={16} /></button>
                     <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"><Trash2 size={16} /></button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 my-6">
                <div className="flex items-center">
                    <Clock size={20} className="text-yellow-500 mr-3"/>
                    <div>
                        <p className="text-2xl font-bold">{queue.waitingCalls}</p>
                        <p className="text-xs text-text-secondary">En attente</p>
                    </div>
                </div>
                 <div className="flex items-center">
                    <Users size={20} className="text-green-500 mr-3"/>
                    <div>
                        <p className="text-2xl font-bold">{loggedInMembers} / {queue.members.length}</p>
                        <p className="text-xs text-text-secondary">Agents actifs</p>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="font-semibold mb-2 text-sm">Membres</h4>
                <div className="space-y-2">
                    {queue.members.map(member => (
                        <div key={member.id} className="flex justify-between items-center text-sm">
                            <span>{member.name}</span>
                            {getMemberStatusChip(member.status)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface FilesDattenteProps {
    queues: Queue[];
    extensions: Extension[];
    onAdd: (queue: Omit<Queue, 'id' | 'waitingCalls'>) => void;
    onUpdate: (queue: Queue) => void;
    onDelete: (id: string) => void;
}

const FilesDattente: React.FC<FilesDattenteProps> = ({ queues, extensions, onAdd, onUpdate, onDelete }) => {
    const [modalState, setModalState] = React.useState<'closed' | 'add' | 'edit' | 'delete'>('closed');
    const [currentQueue, setCurrentQueue] = React.useState<Queue | null>(null);
    const { addNotification } = useNotification();

    const openModal = (state: 'add' | 'edit' | 'delete', queue?: Queue) => {
        setCurrentQueue(queue || null);
        setModalState(state);
    };

    const closeModal = () => {
        setCurrentQueue(null);
        setModalState('closed');
    };
    
    const handleFormSubmit = (queueData: Queue | Omit<Queue, 'id' | 'waitingCalls'>) => {
        if ('id' in queueData) {
            onUpdate(queueData);
            addNotification({ message: `File d'attente ${queueData.name} mise à jour.`, type: 'success' });
        } else {
            onAdd(queueData);
            addNotification({ message: `File d'attente ${queueData.name} ajoutée.`, type: 'success' });
        }
        closeModal();
    };

    const handleDeleteConfirm = () => {
        if (currentQueue) {
            onDelete(currentQueue.id);
            addNotification({ message: `File d'attente ${currentQueue.name} supprimée.`, type: 'success' });
        }
        closeModal();
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center">
                <button onClick={() => openModal('add')} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors">
                    <PlusCircle size={20} className="mr-2" />
                    Ajouter une file
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {queues.map(queue => (
                    <QueueCard key={queue.id} queue={queue} onEdit={() => openModal('edit', queue)} onDelete={() => openModal('delete', queue)} />
                ))}
            </div>

            {(modalState === 'add' || modalState === 'edit') && (
                <QueueFormModal
                    isOpen={true}
                    onClose={closeModal}
                    onSubmit={handleFormSubmit}
                    queue={modalState === 'edit' ? currentQueue : undefined}
                    allExtensions={extensions}
                />
            )}

            {modalState === 'delete' && currentQueue && (
                 <Modal isOpen={true} onClose={closeModal} title="Confirmer la suppression">
                     <div className="p-6">
                        <p>Êtes-vous sûr de vouloir supprimer la file d'attente **{currentQueue.name}** ?</p>
                     </div>
                     <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-2">
                        <button onClick={closeModal} className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Annuler</button>
                        <button onClick={handleDeleteConfirm} className="px-4 py-2 rounded-md border border-transparent bg-red-600 text-white hover:bg-red-700">Supprimer</button>
                     </div>
                 </Modal>
            )}
        </div>
    );
};

// --- Form Modal ---
interface QueueFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (queueData: Queue | Omit<Queue, 'id' | 'waitingCalls'>) => void;
    queue?: Queue | null;
    allExtensions: Extension[];
}

const QueueFormModal: React.FC<QueueFormModalProps> = ({ isOpen, onClose, onSubmit, queue, allExtensions }) => {
    // FIX: Explicitly type the initial state's `strategy` property to match `Queue['strategy']`.
    // This prevents TypeScript from widening it to a generic `string`, which caused a type mismatch on submit.
    const [formData, setFormData] = React.useState(queue || { name: '', strategy: 'ringall' as Queue['strategy'], members: [] });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleMemberToggle = (ext: Extension) => {
        setFormData(prev => {
            const isMember = prev.members.some(m => m.id === `qm-${ext.id}`);
            if (isMember) {
                return {...prev, members: prev.members.filter(m => m.id !== `qm-${ext.id}`)};
            } else {
                 return {...prev, members: [...prev.members, {id: `qm-${ext.id}`, name: ext.name, status: 'Logged Out'}]};
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={queue ? "Modifier la file d'attente" : "Ajouter une file d'attente"}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-text-secondary">Nom de la file</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-border rounded-md shadow-sm p-2" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary">Stratégie d'appel</label>
                        <select name="strategy" value={formData.strategy} onChange={handleChange} className="mt-1 block w-full border border-border rounded-md shadow-sm p-2 bg-white">
                            <option value="ringall">Sonner tous</option>
                            <option value="roundrobin">Tourniquet</option>
                            <option value="leastrecent">Le moins récemment appelé</option>
                             <option value="random">Aléatoire</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Membres</label>
                        <div className="max-h-40 overflow-y-auto border border-border rounded-md p-2 space-y-1">
                            {allExtensions.map(ext => (
                                <label key={ext.id} className="flex items-center space-x-3 p-1 rounded-md hover:bg-gray-50">
                                    <input type="checkbox"
                                        checked={formData.members.some(m => m.id === `qm-${ext.id}`)}
                                        onChange={() => handleMemberToggle(ext)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-text-primary">{ext.name} ({ext.number})</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Annuler</button>
                    <button type="submit" className="px-4 py-2 rounded-md border border-transparent bg-primary text-white hover:bg-primary/90">Sauvegarder</button>
                </div>
            </form>
        </Modal>
    );
};

export default FilesDattente;