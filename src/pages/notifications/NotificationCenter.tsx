import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    CheckCircle2,
    Wrench,
    UserPlus,
    AlertTriangle,
    Info,
    Check,
    CheckCheck,
    Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNotifications, Notification } from '@/hooks/useNotifications';

type NotifType = 'service' | 'staff' | 'alert' | 'system';

const typeConfig: Record<NotifType, { icon: React.ReactNode; bg: string }> = {
    service: {
        icon: <Wrench className="h-4 w-4 text-blue-600" />,
        bg: 'bg-blue-50',
    },
    staff: {
        icon: <UserPlus className="h-4 w-4 text-violet-600" />,
        bg: 'bg-violet-50',
    },
    alert: {
        icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
        bg: 'bg-amber-50',
    },
    system: {
        icon: <Info className="h-4 w-4 text-slate-500" />,
        bg: 'bg-slate-50',
    },
};

type Tab = 'all' | 'unread' | 'read';

interface NotificationCenterProps {
    notifications?: Notification[];
    unreadCount?: number;
    loading?: boolean;
    markRead?: (id: string) => void;
    markAllRead?: () => void;
    onClose?: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
    notifications: propNotifications,
    unreadCount: propUnreadCount,
    loading: propLoading,
    markRead: propMarkRead,
    markAllRead: propMarkAllRead,
    onClose,
}) => {
    const navigate = useNavigate();
    const local = useNotifications();
    const [activeTab, setActiveTab] = useState<Tab>('all');

    const notifications = propNotifications ?? local.notifications;
    const unreadCount = propUnreadCount ?? local.unreadCount;
    const loading = propLoading ?? local.loading;
    const markRead = propMarkRead ?? local.markRead;
    const markAllRead = propMarkAllRead ?? local.markAllRead;

    const readCount = notifications.length - unreadCount;

    const filtered = notifications.filter((n) => {
        if (activeTab === 'unread') return !n.isRead;
        if (activeTab === 'read') return n.isRead;
        return true;
    });

    const handleToggleRead = (notif: Notification) => {
        if (!notif.isRead) {
            markRead(notif.id);
        }

        // Parse service request ID from notification title or description
        const match = notif.title.match(/SR#\s*(\d+)/i) || 
                      notif.description.match(/service request #\s*(\d+)/i) ||
                      notif.title.match(/SR\s*#\s*(\d+)/i);
                      
        if (match && match[1]) {
            const srId = match[1];
            navigate(`/dashboard/services/view/${srId}`);
            if (onClose) onClose();
        }
    };

    const tabs: { key: Tab; label: string; count: number }[] = [
        { key: 'all', label: 'All', count: notifications.length },
        { key: 'unread', label: 'Unread', count: unreadCount },
        { key: 'read', label: 'Read', count: readCount },
    ];

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
                {/* pr-12 reserves space for the Sheet Close button to prevent overlap */}
                <div className="flex items-center justify-between mb-3 pr-12">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-gray-700" />
                        <span className="text-base font-bold text-gray-900">Notifications</span>
                        {unreadCount > 0 && (
                            <Badge className="h-5 min-w-[20px] px-1.5 text-xs font-bold bg-blue-600 text-white rounded-full hover:bg-blue-600 flex items-center justify-center">
                                {unreadCount}
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Mark all read
                        </button>
                    )}
                </div>

                {/* Tab Strip */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-1.5 rounded-md transition-all',
                                activeTab === tab.key
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span
                                    className={cn(
                                        'text-[10px] font-extrabold px-1.5 py-0.5 rounded',
                                        activeTab === tab.key && tab.key === 'unread'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-200 text-gray-600'
                                    )}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1 min-h-0">
                {loading && notifications.length === 0 ? (
                    <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs font-medium">Loading notifications...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 gap-2">
                        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 font-semibold">You're all caught up</p>
                        <p className="text-xs text-gray-400">
                            No {activeTab !== 'all' ? activeTab : ''} notifications
                        </p>
                    </div>
                ) : (
                    <div className="py-1">
                        {filtered.map((notif) => {
                            const cfg = typeConfig[notif.type] || typeConfig.system;
                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => handleToggleRead(notif)}
                                    className={cn(
                                        'group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-0',
                                        !notif.isRead
                                            ? 'bg-white hover:bg-blue-50/40'
                                            : 'bg-white/50 hover:bg-gray-50'
                                    )}
                                >
                                    {/* Unread accent bar */}
                                    {!notif.isRead && (
                                        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 rounded-r" />
                                    )}

                                    {/* Icon */}
                                    <div
                                        className={cn(
                                            'mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center',
                                            cfg.bg
                                        )}
                                    >
                                        {cfg.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p
                                                className={cn(
                                                    'text-xs md:text-sm font-bold leading-snug',
                                                    !notif.isRead
                                                        ? 'text-slate-900'
                                                        : 'text-slate-600'
                                                )}
                                            >
                                                {notif.title}
                                            </p>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5 font-medium">
                                                {notif.time}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-normal mt-1">
                                            {notif.description}
                                        </p>
                                    </div>

                                    {/* Per-item read toggle */}
                                    {!notif.isRead && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markRead(notif.id);
                                            }}
                                            className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 hover:bg-blue-200"
                                            title="Mark as read"
                                        >
                                            <Check className="h-2.5 w-2.5" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-9 text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                >
                    View all in Notification Settings
                </Button>
            </div>
        </div>
    );
};

export default NotificationCenter;
