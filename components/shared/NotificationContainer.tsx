import * as React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const Notification: React.FC<{ notification: { id: number; message: string; type: 'success' | 'error' | 'info' }; onDismiss: (id: number) => void; }> = ({ notification, onDismiss }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(notification.id);
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [notification, onDismiss]);

    const icons = {
        success: <CheckCircle className="h-6 w-6 text-green-500" />,
        error: <XCircle className="h-6 w-6 text-red-500" />,
        info: <Info className="h-6 w-6 text-blue-500" />,
    };

    const styles = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200',
    };

    return (
        <div className={`w-full max-w-sm bg-surface rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden my-2 border-l-4 ${styles[notification.type]}`}>
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {icons[notification.type]}
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-text-primary">{notification.message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button onClick={() => onDismiss(notification.id)} className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            <span className="sr-only">Close</span>
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NotificationContainer: React.FC = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-[100]">
            <div className="w-full max-w-sm space-y-4">
                {notifications.map(n => (
                    <Notification key={n.id} notification={n} onDismiss={removeNotification} />
                ))}
            </div>
        </div>
    );
};

export default NotificationContainer;
