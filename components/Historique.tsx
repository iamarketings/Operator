import * as React from 'react';
import { Search, Calendar, Download, PlayCircle } from 'lucide-react';
import type { CDR } from '../types';

const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
};

const getDispositionChip = (disposition: CDR['disposition']) => {
    switch (disposition) {
        case 'ANSWERED':
            return <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">Répondu</span>;
        case 'NO ANSWER':
            return <span className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">Sans réponse</span>;
        case 'BUSY':
            return <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">Occupé</span>;
        case 'FAILED':
            return <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">Échoué</span>;
        default:
            return null;
    }
};

interface HistoriqueProps {
    cdr: CDR[];
}

const ITEMS_PER_PAGE = 15;

const Historique: React.FC<HistoriqueProps> = ({ cdr }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);

    const filteredCdr = cdr.filter(record =>
        record.src.includes(searchTerm) ||
        record.dst.includes(searchTerm) ||
        record.clid.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCdr.length / ITEMS_PER_PAGE);
    const paginatedCdr = filteredCdr.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };
    
    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    return (
        <div className="space-y-6">
            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par numéro, nom..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-primary focus:border-primary"
                    />
                </div>
                 <div className="flex space-x-2">
                    <button className="flex-1 flex items-center justify-center bg-surface border border-border px-4 py-2 rounded-lg text-text-primary hover:bg-gray-50">
                        <Calendar size={16} className="mr-2" />
                        <span>Date de début</span>
                    </button>
                     <button className="flex-1 flex items-center justify-center bg-surface border border-border px-4 py-2 rounded-lg text-text-primary hover:bg-gray-50">
                        <Calendar size={16} className="mr-2" />
                        <span>Date de fin</span>
                    </button>
                 </div>
            </div>

            {/* Table Section */}
            <div className="bg-surface rounded-lg shadow-md border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-text-secondary">
                        <thead className="text-xs text-text-secondary uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date & Heure</th>
                                <th scope="col" className="px-6 py-3">Appelant</th>
                                <th scope="col" className="px-6 py-3">Source</th>
                                <th scope="col" className="px-6 py-3">Destination</th>
                                <th scope="col" className="px-6 py-3">Durée (facturée)</th>
                                <th scope="col" className="px-6 py-3">Statut</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCdr.map(record => (
                                <tr key={record.id} className="border-b border-border hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(record.calldate).toLocaleString('fr-FR')}</td>
                                    <td className="px-6 py-4 font-medium text-text-primary">{record.clid}</td>
                                    <td className="px-6 py-4">{record.src}</td>
                                    <td className="px-6 py-4">{record.dst}</td>
                                    <td className="px-6 py-4 font-mono">{formatDuration(record.duration)} ({formatDuration(record.billsec)})</td>
                                    <td className="px-6 py-4">{getDispositionChip(record.disposition)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            {record.recordingfile && (
                                                <>
                                                <button onClick={() => alert(`Écoute de : ${record.recordingfile}`)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-full transition-colors" title="Écouter l'enregistrement">
                                                    <PlayCircle size={16} />
                                                </button>
                                                <button onClick={() => alert(`Téléchargement de : ${record.recordingfile}`)} className="p-2 text-green-500 hover:bg-green-100 rounded-full transition-colors" title="Télécharger l'enregistrement">
                                                    <Download size={16} />
                                                </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="p-4 border-t border-border flex justify-between items-center text-sm">
                    <span>Affiche {paginatedCdr.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}-{(currentPage - 1) * ITEMS_PER_PAGE + paginatedCdr.length} sur {filteredCdr.length} résultats</span>
                    <div className="flex space-x-1">
                        <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-3 py-1 border border-border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">Précédent</button>
                        <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-3 py-1 border border-border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">Suivant</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Historique;