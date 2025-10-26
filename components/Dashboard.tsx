
// Fix: Switched to a namespace import for React to solve JSX type resolution errors.
import * as React from 'react';
import { Phone, Users, Server, Voicemail } from 'lucide-react';
import MetricCard from './MetricCard';
import CallActivityChart from './CallActivityChart';
import ActiveCallsTable from './ActiveCallsTable';
import type { AsteriskStats, Call, CallActivityData } from '../types';

const generateRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const generatePhoneNumber = () => `+1${generateRandomNumber(200, 999)}${generateRandomNumber(100, 999)}${generateRandomNumber(1000, 9999)}`;
const generateChannel = () => `PJSIP/${generateRandomNumber(100, 500)}-${Math.random().toString(36).substring(2, 10)}`;

interface DashboardProps {
    registeredExtensionsCount: number;
    totalExtensionsCount: number;
    registeredTrunksCount: number;
    totalTrunksCount: number;
}

const Dashboard: React.FC<DashboardProps> = ({ registeredExtensionsCount, totalExtensionsCount, registeredTrunksCount, totalTrunksCount }) => {
    const [stats, setStats] = React.useState<AsteriskStats>({
        activeCalls: 0,
        registeredExtensions: registeredExtensionsCount,
        registeredTrunks: registeredTrunksCount,
        activeConferences: 2,
    });
    const [activeCalls, setActiveCalls] = React.useState<Call[]>([]);
    const [callActivity, setCallActivity] = React.useState<CallActivityData[]>(() => {
        const initialData: CallActivityData[] = [];
        const now = new Date();
        for (let i = 10; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 1000);
            initialData.push({
                time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                calls: generateRandomNumber(5, 20),
            });
        }
        return initialData;
    });

    const updateActiveCalls = React.useCallback(() => {
        setActiveCalls(prevCalls => {
            let newCalls = [...prevCalls];
            // Remove some old calls
            newCalls = newCalls.filter(() => Math.random() > 0.1);

            // Add new calls
            if (Math.random() > 0.6 && newCalls.length < 25) {
                const newCall: Call = {
                    id: `call-${Date.now()}-${Math.random()}`,
                    callerId: generatePhoneNumber(),
                    destination: generateRandomNumber(1000, 1010).toString(),
                    startTime: Date.now(),
                    duration: 0,
                    channel: generateChannel(),
                    state: Math.random() > 0.3 ? 'Up' : 'Ringing',
                };
                newCalls.push(newCall);
            }
            return newCalls;
        });
    }, []);

    React.useEffect(() => {
        const interval = setInterval(updateActiveCalls, 3000);
        return () => clearInterval(interval);
    }, [updateActiveCalls]);

    React.useEffect(() => {
        // Update stats card for active calls
        setStats(prev => ({ ...prev, activeCalls: activeCalls.length }));

        // Update call activity chart data
        setCallActivity(prevActivity => {
            const now = new Date();
            const newActivity = [...prevActivity.slice(1), {
                time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                calls: activeCalls.length,
            }];
            return newActivity;
        });
    }, [activeCalls]);
    
    React.useEffect(() => {
        setStats(prev => ({...prev, registeredExtensions: registeredExtensionsCount, registeredTrunks: registeredTrunksCount }));
    }, [registeredExtensionsCount, registeredTrunksCount]);


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard 
                    title="Appels en cours" 
                    value={stats.activeCalls.toString()} 
                    icon={<Phone className="text-blue-500" />} 
                    trend="+2 cette heure" 
                />
                <MetricCard 
                    title="Postes connectés" 
                    value={`${stats.registeredExtensions} / ${totalExtensionsCount}`} 
                    icon={<Users className="text-green-500" />} 
                    trend="98% en ligne" 
                />
                <MetricCard 
                    title="Liaisons actives" 
                    value={`${stats.registeredTrunks} / ${totalTrunksCount}`} 
                    icon={<Server className="text-yellow-500" />} 
                    trend="Toutes stables" 
                />
                <MetricCard 
                    title="Conférences actives" 
                    value={stats.activeConferences.toString()} 
                    icon={<Voicemail className="text-purple-500" />} 
                    trend="Aucune nouvelle depuis 1h"
                />
            </div>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <CallActivityChart data={callActivity} />
                </div>
                <div className="bg-surface rounded-lg shadow-md border border-border p-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">État du système</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary">Version Asterisk</span>
                            <span className="font-mono text-sm bg-gray-100 text-green-600 px-2 py-1 rounded">18.10.0</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary">Disponibilité</span>
                            <span className="text-text-primary font-medium">17 jours, 4 heures</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-text-secondary">Charge CPU</span>
                            <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{width: '15%'}}></div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary">Utilisation mémoire</span>
                            <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-500 h-2.5 rounded-full" style={{width: '35%'}}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <ActiveCallsTable calls={activeCalls} />
            </div>
        </div>
    );
};

export default Dashboard;