import * as React from 'react';
import { PlusCircle, Edit, Trash2, Search, X, Voicemail, Mic } from 'lucide-react';
import type { Extension } from '../types';
import Modal from './shared/Modal';
import { useNotification } from '../contexts/NotificationContext';

// --- Helper Functions ---
const getStatusChip = (status: Extension['status']) => {
    switch (status) {
        case 'Registered':
            return <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">Enregistré</span>;
        case 'Unregistered':
            return <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">Non Enregistré</span>;
        case 'In Use':
            return <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">En Ligne</span>;
        case 'Ringing':
            return <span className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">Sonnerie</span>;
        case 'Unavailable':
             return <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">Indisponible</span>;
        default:
            return null;
    }
};

const emptyExtension: Omit<Extension, 'id' | 'status' | 'ipAddress' | 'userAgent'> = {
    number: '', name: '', secret: '', protocol: 'PJSIP',
    voicemail: { enabled: false, pin: '', email: '' },
    callRecording: { incoming: false, outgoing: false }
};

// --- Main Component ---
interface PostesProps {
    extensions: Extension[];
    onAdd: (ext: Omit<Extension, 'id' | 'status' | 'ipAddress' | 'userAgent'>) => void;
    onUpdate: (ext: Extension) => void;
    onDelete: (id: string) => void;
}

const Postes: React.FC<PostesProps> = ({ extensions, onAdd, onUpdate, onDelete }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [modalState, setModalState] = React.useState<'closed' | 'add' | 'edit' | 'delete'>('closed');
    const [currentExtension, setCurrentExtension] = React.useState<Extension | null>(null);
    const { addNotification } = useNotification();

    const openModal = (state: 'add' | 'edit' | 'delete', ext?: Extension) => {
        setCurrentExtension(ext || null);
        setModalState(state);
    };

    const closeModal = () => {
        setCurrentExtension(null);
        setModalState('closed');
    };

    const handleFormSubmit = (extData: Extension | Omit<Extension, 'id' | 'status' | 'ipAddress' | 'userAgent'>) => {
        if ('id' in extData) {
            onUpdate(extData);
            addNotification({ message: `Poste ${extData.number} mis à jour.`, type: 'success' });
        } else {
            onAdd(extData);
            addNotification({ message: `Poste ${extData.number} ajouté.`, type: 'success' });
        }
        closeModal();
    };

    const handleDeleteConfirm = () => {
        if(currentExtension) {
            onDelete(currentExtension.id);
            addNotification({ message: `Poste ${currentExtension.number} supprimé.`, type: 'success' });
        }
        closeModal();
    };

    const filteredExtensions = extensions.filter(ext => 
        ext.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ext.number.includes(searchTerm) ||
        ext.ipAddress.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text" placeholder="Rechercher par nom, numéro, IP..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-primary focus:border-primary"
                    />
                </div>
                <button onClick={() => openModal('add')} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors">
                    <PlusCircle size={20} className="mr-2" />
                    Ajouter un poste
                </button>
            </div>
            
            <div className="bg-surface rounded-lg shadow-md border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-text-secondary">
                        <thead className="text-xs text-text-secondary uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Numéro</th>
                                <th scope="col" className="px-6 py-3">Nom</th>
                                <th scope="col" className="px-6 py-3">Statut</th>
                                <th scope="col" className="px-6 py-3">Adresse IP</th>
                                <th scope="col" className="px-6 py-3">Client SIP</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExtensions.map(ext => (
                                <tr key={ext.id} className="border-b border-border hover:bg-gray-50">
                                    <td className="px-6 py-4 font-bold text-text-primary">{ext.number}</td>
                                    <td className="px-6 py-4">{ext.name}</td>
                                    <td className="px-6 py-4">{getStatusChip(ext.status)}</td>
                                    <td className="px-6 py-4 font-mono">{ext.ipAddress}</td>
                                    <td className="px-6 py-4">{ext.userAgent}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={() => openModal('edit', ext)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"><Edit size={16} /></button>
                                            <button onClick={() => openModal('delete', ext)} className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {(modalState === 'add' || modalState === 'edit') && (
                <PosteFormModal
                    isOpen={true}
                    onClose={closeModal}
                    onSubmit={handleFormSubmit}
                    extension={modalState === 'edit' ? currentExtension : undefined}
                />
            )}
            
            {modalState === 'delete' && currentExtension && (
                 <Modal isOpen={true} onClose={closeModal} title="Confirmer la suppression">
                     <div className="p-6">
                        <p>Êtes-vous sûr de vouloir supprimer le poste **{currentExtension.name} ({currentExtension.number})** ?</p>
                        <p className="text-sm text-red-600 mt-2">Cette action est irréversible.</p>
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
interface PosteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (extData: Extension | Omit<Extension, 'id' | 'status' | 'ipAddress' | 'userAgent'>) => void;
    extension?: Extension | null;
}

const PosteFormModal: React.FC<PosteFormModalProps> = ({ isOpen, onClose, onSubmit, extension }) => {
    const [formData, setFormData] = React.useState(extension || emptyExtension);
    const [activeTab, setActiveTab] = React.useState<'general' | 'voicemail' | 'recording'>('general');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
        
        const keys = name.split('.');
        if (keys.length > 1) {
            setFormData(prev => ({
                ...prev,
                [keys[0]]: {
                    ...(prev as any)[keys[0]],
                    [keys[1]]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const TabButton: React.FC<{tab: 'general' | 'voicemail' | 'recording', label: string, icon: React.ReactNode}> = ({tab, label, icon}) => (
        <button type="button" onClick={() => setActiveTab(tab)} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-gray-100'}`}>
            {icon}
            <span className="ml-2">{label}</span>
        </button>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={extension ? `Modifier le poste ${extension.number}` : "Ajouter un nouveau poste"}>
            <form onSubmit={handleSubmit}>
                <div className="p-6">
                    <div className="flex space-x-2 border-b border-border pb-4 mb-6">
                        <TabButton tab="general" label="Général" icon={<Edit size={16} />} />
                        <TabButton tab="voicemail" label="Messagerie Vocale" icon={<Voicemail size={16}/>} />
                        <TabButton tab="recording" label="Enregistrement" icon={<Mic size={16}/>} />
                    </div>

                    {activeTab === 'general' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary">Numéro de poste</label>
                                    <input type="text" name="number" value={formData.number} onChange={handleChange} className="mt-1 block w-full border border-border rounded-md shadow-sm p-2" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary">Nom (Caller ID)</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-border rounded-md shadow-sm p-2" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Mot de passe SIP</label>
                                <input type="text" name="secret" value={formData.secret} onChange={handleChange} className="mt-1 block w-full border border-border rounded-md shadow-sm p-2" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Protocole</label>
                                <select name="protocol" value={formData.protocol} onChange={handleChange} className="mt-1 block w-full border border-border rounded-md shadow-sm p-2 bg-white">
                                    <option value="PJSIP">PJSIP</option>
                                    <option value="SIP">SIP</option>
                                </select>
                            </div>
                        </div>
                    )}
                    
                     {activeTab === 'voicemail' && (
                        <div className="space-y-4">
                            <label className="flex items-center space-x-3">
                                <input type="checkbox" name="voicemail.enabled" checked={formData.voicemail.enabled} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                <span className="text-sm font-medium text-text-primary">Activer la messagerie vocale</span>
                            </label>
                            {formData.voicemail.enabled && (
                                <div className="pl-7 space-y-4">
                                     <div>
                                        <label className="block text-sm font-medium text-text-secondary">Code PIN</label>
                                        <input type="text" name="voicemail.pin" value={formData.voicemail.pin} onChange={handleChange} className="mt-1 block w-full border border-border rounded-md shadow-sm p-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary">Email de notification</label>
                                        <input type="email" name="voicemail.email" value={formData.voicemail.email} onChange={handleChange} className="mt-1 block w-full border border-border rounded-md shadow-sm p-2" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                     {activeTab === 'recording' && (
                        <div className="space-y-4">
                             <label className="flex items-center space-x-3">
                                <input type="checkbox" name="callRecording.incoming" checked={formData.callRecording.incoming} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                <span className="text-sm font-medium text-text-primary">Enregistrer les appels entrants</span>
                            </label>
                            <label className="flex items-center space-x-3">
                                <input type="checkbox" name="callRecording.outgoing" checked={formData.callRecording.outgoing} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                <span className="text-sm font-medium text-text-primary">Enregistrer les appels sortants</span>
                            </label>
                        </div>
                    )}

                </div>
                <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Annuler</button>
                    <button type="submit" className="px-4 py-2 rounded-md border border-transparent bg-primary text-white hover:bg-primary/90">Sauvegarder</button>
                </div>
            </form>
        </Modal>
    );
};

export default Postes;