import { useState, useCallback, useEffect } from 'react';
import type { Extension, Trunk, Queue, CDR, QueueMember } from '../types';

// --- Mock Data Generation (as fallback) ---

const generateRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const generatePhoneNumber = () => `+1${generateRandomNumber(200, 999)}${generateRandomNumber(100, 999)}${generateRandomNumber(1000, 9999)}`;
const generateChannel = () => `PJSIP/${generateRandomNumber(100, 500)}-${Math.random().toString(36).substring(2, 10)}`;
const generateIpAddress = () => `${generateRandomNumber(1, 254)}.${generateRandomNumber(1, 254)}.${generateRandomNumber(1, 254)}.${generateRandomNumber(1, 254)}`;
const userAgents = ['Yealink T46S', 'Grandstream GXP2170', 'Polycom VVX 450', 'Zoiper 5', 'Linphone'];
const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];

const createMockExtensions = (count: number): Extension[] => {
    return Array.from({ length: count }, (_, i) => {
        const statusOptions: Extension['status'][] = ['Registered', 'Unregistered', 'In Use', 'Ringing', 'Unavailable'];
        return {
            id: `ext-${1000 + i}`,
            number: `${1000 + i}`,
            name: `${names[i % names.length]} ${1000 + i}`,
            secret: Math.random().toString(36).substring(2, 10),
            protocol: Math.random() > 0.5 ? 'PJSIP' : 'SIP',
            status: i < count * 0.9 ? 'Registered' : statusOptions[generateRandomNumber(1, statusOptions.length - 1)],
            ipAddress: generateIpAddress(),
            userAgent: userAgents[generateRandomNumber(0, userAgents.length - 1)],
            voicemail: {
                enabled: Math.random() > 0.7,
                pin: generateRandomNumber(1000, 9999).toString(),
                email: `${names[i % names.length].toLowerCase()}@example.com`
            },
            callRecording: {
                incoming: Math.random() > 0.5,
                outgoing: Math.random() > 0.8,
            }
        };
    });
};

const createMockTrunks = (): Trunk[] => {
    return [
        { id: 'trunk-1', name: 'Fournisseur A', type: 'PJSIP', status: 'Registered', host: 'sip.fournisseurA.com' },
        { id: 'trunk-2', name: 'Fournisseur B', type: 'SIP', status: 'Registered', host: 'sip.fournisseurB.net' },
        { id: 'trunk-3', name: 'Liaison Inter-site', type: 'IAX2', status: 'Unregistered', host: '192.168.1.254' },
        { id: 'trunk-4', name: 'Backup SIP', type: 'PJSIP', status: 'Unreachable', host: 'backup.sip.com' },
    ];
};

const createMockQueues = (allExtensions: Extension[]): Queue[] => {
    const techMembers = allExtensions.slice(0, 3).map(ext => ({ id: `qm-${ext.id}`, name: ext.name, status: 'Logged In' as QueueMember['status'] }));
    const salesMembers = allExtensions.slice(3, 5).map(ext => ({ id: `qm-${ext.id}`, name: ext.name, status: 'Logged In' as QueueMember['status'] }));

    return [
        { id: 'q-1', name: 'Support Technique', strategy: 'roundrobin', waitingCalls: 0, members: techMembers },
        { id: 'q-2', name: 'Ventes', strategy: 'ringall', waitingCalls: 0, members: salesMembers },
    ];
};

const createMockCDRs = (count: number): CDR[] => {
    return Array.from({ length: count }, (_, i) => {
        const dispositionOptions: CDR['disposition'][] = ['ANSWERED', 'NO ANSWER', 'BUSY', 'FAILED'];
        const disposition = dispositionOptions[generateRandomNumber(0, dispositionOptions.length - 1)];
        const duration = generateRandomNumber(0, 3600);
        const billsec = disposition === 'ANSWERED' ? Math.max(0, duration - generateRandomNumber(5, 15)) : 0;
        const hasRecording = disposition === 'ANSWERED' && Math.random() > 0.6;
        return {
            id: `cdr-${Date.now() - i * 100000}`,
            calldate: new Date(Date.now() - i * 100000).toISOString(),
            clid: `"${names[generateRandomNumber(0, names.length - 1)]}" <${generatePhoneNumber()}>`,
            src: generatePhoneNumber(),
            dst: `${generateRandomNumber(1000, 4000)}`,
            dcontext: 'from-internal',
            channel: generateChannel(),
            dstchannel: generateChannel(),
            lastapp: 'Dial',
            lastdata: 'PJSIP/1001',
            duration,
            billsec,
            disposition,
            amaflags: 3,
            accountcode: '',
            uniqueid: `${Date.now()}.${i}`,
            userfield: '',
            recordingfile: hasRecording ? `monitor/${new Date().toISOString().slice(0,10).replace(/-/g,'/')}/${Date.now()}.${i}.wav` : undefined,
        };
    });
};

const initialExtensions = createMockExtensions(20);
const initialTrunks = createMockTrunks();
const initialQueues = createMockQueues(initialExtensions);
const initialCDRs = createMockCDRs(100);

const useAsteriskData = () => {
    const [extensions, setExtensions] = useState<Extension[]>(initialExtensions);
    const [trunks, setTrunks] = useState<Trunk[]>(initialTrunks);
    const [queues, setQueues] = useState<Queue[]>(initialQueues);
    const [cdr, setCdr] = useState<CDR[]>(initialCDRs);

    // Fetch data from API on mount, fallback to mock data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [extRes, trunkRes, queueRes, cdrRes] = await Promise.all([
                    fetch('/api/extensions'),
                    fetch('/api/trunks'),
                    fetch('/api/queues'),
                    fetch('/api/cdr')
                ]);
                if (extRes.ok) setExtensions(await extRes.json());
                if (trunkRes.ok) setTrunks(await trunkRes.json());
                if (queueRes.ok) setQueues(await queueRes.json());
                if (cdrRes.ok) setCdr(await cdrRes.json());
            } catch (error) {
                console.warn("API not available, using mock data. This is expected if the backend is not running.", error);
            }
        };
        fetchData();
    }, []);

    const apiRequest = async (url: string, method: string, body?: any) => {
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined
            });
            if (!response.ok) {
                 throw new Error(`API request failed: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error with ${method} ${url}:`, error);
            // Fallback to mock behavior for UI testing
            return Promise.reject(error);
        }
    }

    const addExtension = useCallback(async (ext: Omit<Extension, 'id' | 'status' | 'ipAddress' | 'userAgent'>) => {
        try {
            const newExt = await apiRequest('/api/extensions', 'POST', ext);
            setExtensions(prev => [...prev, newExt]);
        } catch {
             setExtensions(prev => [...prev, { 
                ...ext, 
                id: `ext-${Date.now()}`,
                status: 'Unregistered',
                ipAddress: 'N/A',
                userAgent: 'N/A'
            }]);
        }
    }, []);
    
    const updateExtension = useCallback(async (updatedExt: Extension) => {
        try {
            await apiRequest(`/api/extensions/${updatedExt.id}`, 'PUT', updatedExt);
            setExtensions(prev => prev.map(ext => ext.id === updatedExt.id ? updatedExt : ext));
        } catch {
            setExtensions(prev => prev.map(ext => ext.id === updatedExt.id ? updatedExt : ext));
        }
    }, []);

    const deleteExtension = useCallback(async (extId: string) => {
        try {
            await apiRequest(`/api/extensions/${extId}`, 'DELETE');
            setExtensions(prev => prev.filter(ext => ext.id !== extId));
        } catch {
             setExtensions(prev => prev.filter(ext => ext.id !== extId));
        }
    }, []);
    
    const addTrunk = useCallback(async (trunk: Omit<Trunk, 'id' | 'status'>) => {
       try {
            const newTrunk = await apiRequest('/api/trunks', 'POST', trunk);
            setTrunks(prev => [...prev, newTrunk]);
       } catch {
            setTrunks(prev => [...prev, { ...trunk, id: `trunk-${Date.now()}`, status: 'Unregistered' }]);
       }
    }, []);
    
    const updateTrunk = useCallback(async (updatedTrunk: Trunk) => {
        try {
            await apiRequest(`/api/trunks/${updatedTrunk.id}`, 'PUT', updatedTrunk);
            setTrunks(prev => prev.map(trunk => trunk.id === updatedTrunk.id ? updatedTrunk : trunk));
        } catch {
             setTrunks(prev => prev.map(trunk => trunk.id === updatedTrunk.id ? updatedTrunk : trunk));
        }
    }, []);

    const deleteTrunk = useCallback(async (trunkId: string) => {
        try {
            await apiRequest(`/api/trunks/${trunkId}`, 'DELETE');
            setTrunks(prev => prev.filter(trunk => trunk.id !== trunkId));
        } catch {
            setTrunks(prev => prev.filter(trunk => trunk.id !== trunkId));
        }
    }, []);
    
    const addQueue = useCallback(async (queue: Omit<Queue, 'id' | 'waitingCalls'>) => {
        try {
            const newQueue = await apiRequest('/api/queues', 'POST', queue);
            setQueues(prev => [...prev, newQueue]);
        } catch {
            setQueues(prev => [...prev, { ...queue, id: `queue-${Date.now()}`, waitingCalls: 0 }]);
        }
    }, []);
    
    const updateQueue = useCallback(async (updatedQueue: Queue) => {
        try {
            await apiRequest(`/api/queues/${updatedQueue.id}`, 'PUT', updatedQueue);
            setQueues(prev => prev.map(queue => queue.id === updatedQueue.id ? updatedQueue : queue));
        } catch {
            setQueues(prev => prev.map(queue => queue.id === updatedQueue.id ? updatedQueue : queue));
        }
    }, []);

    const deleteQueue = useCallback(async (queueId: string) => {
       try {
            await apiRequest(`/api/queues/${queueId}`, 'DELETE');
            setQueues(prev => prev.filter(queue => queue.id !== queueId));
       } catch {
            setQueues(prev => prev.filter(queue => queue.id !== queueId));
       }
    }, []);

    return { 
        extensions, addExtension, updateExtension, deleteExtension,
        trunks, addTrunk, updateTrunk, deleteTrunk,
        queues, addQueue, updateQueue, deleteQueue,
        cdr
    };
};

export default useAsteriskData;