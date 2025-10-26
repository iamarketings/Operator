import * as React from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import type { Trunk } from '../types';
import Modal from './shared/Modal';
import { useNotification } from '../contexts/NotificationContext';

const getStatusChip = (status: Trunk['status']) => {
    switch (status) {
        case 'Registered':
            return <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">Enregistré</span>;
        case 'Unregistered':
            return <span className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">Non Enregistré</span>;
        case 'Unreachable':
            return <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">Injoignable</span>;
        default:
            return null;
    }
};

interface LiaisonsExternesProps {
    trunks: Trunk[];
    onAdd: (trunk: Omit<Trunk, 'id' | 'status'>) => void;
    onUpdate: (trunk: Trunk) => void;
    onDelete: (id: string) => void;
}

const LiaisonsExternes: React.FC<LiaisonsExternesProps> = ({ trunks, onAdd, onUpdate, onDelete }) => {
    const [modalState, setModalState] = React.useState<'closed' | 'add' | 'edit' | 'delete'>('closed');
    const [currentTrunk, setCurrentTrunk] = React.useState<Trunk | null>(null);
    const { addNotification } = useNotification();

    const openModal = (state: 'add' | 'edit' | 'delete', trunk?: Trunk) => {
        setCurrentTrunk(trunk || null);
        setModalState(state);
    };

    const closeModal = () => {
        setCurrentTrunk(null);
        setModalState('closed');
    };

    const handleFormSubmit = (trunkData: Trunk | Omit<Trunk, 'id' | 'status'>) => {
        if ('id' in trunkData) {
            onUpdate(trunkData);
            addNotification({ message: `Liaison ${trunkData.name} mise à jour.`, type: 'success' });
        } else {
            onAdd(trunkData);
            addNotification({ message: `Liaison ${trunkData.name} ajoutée.`, type: 'success' });
        }
        closeModal();
    };
    
    const handleDeleteConfirm = () => {
        if(currentTrunk) {
            onDelete(currentTrunk.id);
            addNotification({ message: `Liaison ${currentTrunk.name} supprimée.`, type: 'success' });
        }
        closeModal();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center">
                <button onClick={() => openModal('add')} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors">
                    <PlusCircle size={20} className="mr-2" />
                    Ajouter une liaison
                </button>
            </div>
            <div className="bg-surface rounded-lg shadow-md border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-text-secondary">
                        <thead className="text-xs text-text-secondary uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nom</th>
                                <th scope="col" className="px-6 py-3">Type</th>
                                <th scope="col" className="px-6 py-3">Statut</th>
                                <th scope="col" className="px-6 py-3">Hôte</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trunks.map(trunk => (
                                <tr key={trunk.id} className="border-b border-border hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-text-primary">{trunk.name}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{trunk.type}</td>
                                    <td className="px-6 py-4">{getStatusChip(trunk.status)}</td>
                                    <td className="px-6 py-4 font-mono">{trunk.host}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={() => openModal('edit', trunk)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"><Edit size={16} /></button>
                                            <button onClick={() => openModal('delete', trunk)} className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {(modalState === 'add' || modalState === 'edit') && (
                <TrunkFormModal
                    isOpen={true}
                    onClose={closeModal}
                    onSubmit={handleFormSubmit}
                    trunk={modalState === 'edit' ? currentTrunk : undefined}
                />
            )}

            {modalState === 'delete' && currentTrunk && (
                 <Modal isOpen={true} onClose={closeModal} title="Confirmer la suppression">
                     <div className="p-6">
                        <p>Êtes-vous sûr de vouloir supprimer la liaison **{currentTrunk.name}** ?</p>
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

// --- Form Modal Component ---
interface TrunkFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (trunkData: Trunk | Omit<Trunk, 'id' | 'status'>) => void;
    trunk?: Trunk | null;
}

const TrunkFormModal: React.FC<TrunkFormModalProps> = ({ isOpen, onClose, onSubmit, trunk }) => {
    // FIX: Explicitly type the initial state's `type` property to match `Trunk['type']`.
    // This prevents TypeScript from widening it to a generic `string`, which caused a type mismatch on submit.
    const [formData, setFormData] = React.useState(trunk || { name: '', type: 'PJSIP' as Trunk['type'], host: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={trunk ? 'Modifier la liaison' : 'Ajouter une liaison'}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-text-secondary">Nom</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-border rounded-md shadow-sm p-2" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary">Hôte/IP</label>
                        <input type="text" name="host" value={formData.host} onChange={handleChange} className="mt-1 block w-full border border-border rounded-md shadow-sm p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Type</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border border-border rounded-md shadow-sm p-2 bg-white">
                            <option value="PJSIP">PJSIP</option>
                            <option value="SIP">SIP</option>
                            <option value="IAX2">IAX2</option>
                        </select>
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


export default LiaisonsExternes;