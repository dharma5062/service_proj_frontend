import { useState } from 'react';
import {
    Bell,
    CheckCircle2,
    Wrench,
    UserPlus,
    AlertTriangle,
    Info,
    Check,
    CheckCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type NotifType = 'service' | 'staff' | 'alert' | 'system';

interface Notification {
    id: string;
    type: NotifType;
    title: string;
    description: string;
    time: string;
    isRead: boolean;
}

const STATIC_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        type: 'service',
        title: 'SR029 marked as Completed',
        description: 'Battery Replace for Virat Kohli — Apple PC Gen3',
        time: '2m ago',
        isRead: false,
    },
    {
        id: '2',
        type: 'staff',
        title: 'New technician assigned',
        description: 'Nishanth assigned to SR028 — Mac i7 Battery',
        time: '15m ago',
        isRead: false,
    },
    {
        id: '3',
        type: 'alert',
        title: 'Critical defect reported',
        description: 'SR025 flagged with a critical defect by Michel',
        time: '1h ago',
        isRead: false,
    },
    {
        id: '4',
        type: 'service',
        title: 'SR027 progress updated',
        description: 'Battery Replace — Apple PC Gen3 moved to In Progress',
        time: '2h ago',
        isRead: true,
    },
    {
        id: '5',
        type: 'staff',
        title: 'Employee role updated',
        description: 'Nishanth promoted to Senior Employee',
        time: '1d ago',
        isRead: true,
    },
    {
        id: '6',
        type: 'system',
        title: 'System maintenance scheduled',
        description: 'Platform downtime on Saturday at 2 AM for 30 min',
        time: '1d ago',
        isRead: true,
    },
    {
        id: '7',
        type: 'service',
        title: 'New service request created',
        description: 'SR030 — Iphone 11 Battery for AB De by Nishanth',
        time: '2d ago',
        isRead: true,
    },
];

const typeConfig: Record<NotifType, { icon: React.ReactNode; bg: string }> = {
    service: {
        icon: <Wrench className="h-3.5 w-3.5 text-blue-600" />,
        bg: 'bg-blue-50',
    },
    staff: {
        icon: <UserPlus className="h-3.5 w-3.5 text-violet-600" />,
        bg: 'bg-violet-50',
    },
    alert: {
        icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />,
        bg: 'bg-amber-50',
    },
    system: {
        icon: <Info className="h-3.5 w-3.5 text-slate-500" />,
        bg: 'bg-slate-50',
    },
};

type Tab = 'all' | 'unread' | 'read';

const NotificationCenter = () => {
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [notifications, setNotifications] = useState<Notification[]>(STATIC_NOTIFICATIONS);

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const readCount = notifications.length - unreadCount;

    const filtered = notifications.filter((n) => {
        if (activeTab === 'unread') return !n.isRead;
        if (activeTab === 'read') return n.isRead;
        return true;
    });

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };

    const toggleRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
        );
    };

    const tabs: { key: Tab; label: string; count: number }[] = [
        { key: 'all', label: 'All', count: notifications.length },
        { key: 'unread', label: 'Unread', count: unreadCount },
        { key: 'read', label: 'Read', count: readCount },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-gray-700" />
                        <span className="text-sm font-bold text-gray-900">Notifications</span>
                        {unreadCount > 0 && (
                            <Badge className="h-4 min-w-[16px] px-1 text-[10px] font-bold bg-blue-600 text-white rounded-full hover:bg-blue-600">
                                {unreadCount}
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <CheckCheck className="h-3 w-3" />
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
                                'flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1 rounded-md transition-all',
                                activeTab === tab.key
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span
                                    className={cn(
                                        'text-[9px] font-bold px-1 py-0.5 rounded',
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
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 gap-2">
                        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500 font-medium">You're all caught up</p>
                        <p className="text-[10px] text-gray-400">
                            No {activeTab !== 'all' ? activeTab : ''} notifications
                        </p>
                    </div>
                ) : (
                    <div className="py-1">
                        {filtered.map((notif) => {
                            const cfg = typeConfig[notif.type];
                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => toggleRead(notif.id)}
                                    className={cn(
                                        'group relative flex items-start gap-2.5 px-4 py-2.5 cursor-pointer transition-colors border-b border-gray-50 last:border-0',
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
                                            'mt-0.5 flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center',
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
                                                    'text-[11px] leading-snug line-clamp-1',
                                                    !notif.isRead
                                                        ? 'font-semibold text-gray-900'
                                                        : 'font-medium text-gray-600'
                                                )}
                                            >
                                                {notif.title}
                                            </p>
                                            <span className="text-[9px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                                                {notif.time}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 leading-snug line-clamp-1 mt-0.5">
                                            {notif.description}
                                        </p>
                                    </div>

                                    {/* Per-item read toggle */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleRead(notif.id);
                                        }}
                                        className={cn(
                                            'flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 rounded-full flex items-center justify-center',
                                            !notif.isRead
                                                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                        )}
                                        title={notif.isRead ? 'Mark as unread' : 'Mark as read'}
                                    >
                                        <Check className="h-2.5 w-2.5" />
                                    </button>
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
                    className="w-full h-8 text-[11px] font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                >
                    View all in Notification Settings
                </Button>
            </div>
        </div>
    );
};

export default NotificationCenter;
