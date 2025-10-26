
// Fix: Switched to a namespace import for React to solve JSX type resolution errors.
import * as React from 'react';
import { Call } from '../types';
import { PhoneForwarded, PhoneOff } from 'lucide-react';

interface ActiveCallsTableProps {
  calls: Call[];
}

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};


const ActiveCallsTable: React.FC<ActiveCallsTableProps> = ({ calls }) => {
    const [currentTime, setCurrentTime] = React.useState(Date.now());

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const getCallStateChip = (state: Call['state']) => {
        switch (state) {
            case 'Up':
                return <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">Connecté</span>;
            case 'Ringing':
                return <span className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">Sonnerie</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">Terminé</span>;
        }
    };
    
    return (
        <div className="bg-surface rounded-lg shadow-md border border-border overflow-hidden">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-text-primary">Appels en cours</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-text-secondary">
                    <thead className="text-xs text-text-secondary uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">État</th>
                            <th scope="col" className="px-6 py-3">Appelant</th>
                            <th scope="col" className="px-6 py-3">Destinataire</th>
                            <th scope="col" className="px-6 py-3">Durée</th>
                            <th scope="col" className="px-6 py-3">Canal</th>
                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {calls.length === 0 ? (
                            <tr className="border-b border-border">
                                <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                                    Aucun appel en cours
                                </td>
                            </tr>
                        ) : (
                            calls.map((call) => (
                                <tr key={call.id} className="border-b border-border hover:bg-gray-50">
                                    <td className="px-6 py-4">{getCallStateChip(call.state)}</td>
                                    <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap">{call.callerId}</td>
                                    <td className="px-6 py-4">{call.destination}</td>
                                    <td className="px-6 py-4 font-mono">{formatDuration(call.duration + Math.floor((currentTime - call.startTime) / 1000))}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{call.channel}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button className="p-2 text-blue-500 hover:bg-blue-100 rounded-full transition-colors"><PhoneForwarded size={16} /></button>
                                            <button className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"><PhoneOff size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ActiveCallsTable;