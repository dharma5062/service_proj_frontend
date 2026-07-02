import React from 'react';
import { ReopenStatus } from '@/pages/serviceAPI/ServiceReopenAPI';
import {
    Clock,
    XCircle,
    CheckCircle,
    UserCheck,
    Wrench,
    CheckCheck,
    FileText,
    CreditCard,
    BadgeCheck,
    Archive,
    ShieldCheck,
} from 'lucide-react';

// ─── Config ───────────────────────────────────────────────────────────────────

interface StatusConfig {
    label: string;
    icon: React.ElementType;
    className: string;  // Tailwind classes for badge
    dotColor: string;   // Dot indicator color
    phase: number;      // 1-8 for progress
}

const STATUS_CONFIG: Record<ReopenStatus, StatusConfig> = {
    reopen_requested: {
        label: 'Reopen Requested',
        icon: Clock,
        className: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-100',
        dotColor: 'bg-amber-500',
        phase: 1,
    },
    reopen_rejected: {
        label: 'Rejected',
        icon: XCircle,
        className: 'bg-red-50 text-red-700 border-red-200 ring-red-100',
        dotColor: 'bg-red-500',
        phase: 0,
    },
    reopen_approved: {
        label: 'Approved',
        icon: CheckCircle,
        className: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-100',
        dotColor: 'bg-blue-500',
        phase: 2,
    },
    reopen_assigned: {
        label: 'Technician Assigned',
        icon: UserCheck,
        className: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-100',
        dotColor: 'bg-purple-500',
        phase: 3,
    },
    reopen_in_progress: {
        label: 'In Progress',
        icon: Wrench,
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-100',
        dotColor: 'bg-indigo-500',
        phase: 4,
    },
    reopen_completed: {
        label: 'Inspection Done',
        icon: CheckCheck,
        className: 'bg-green-50 text-green-700 border-green-200 ring-green-100',
        dotColor: 'bg-green-500',
        phase: 5,
    },
    reopen_pending_invoice: {
        label: 'Pending Invoice',
        icon: FileText,
        className: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-100',
        dotColor: 'bg-orange-500',
        phase: 6,
    },
    reopen_payment_pending: {
        label: 'Payment Pending',
        icon: CreditCard,
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-100',
        dotColor: 'bg-yellow-500',
        phase: 7,
    },
    reopen_payment_completed: {
        label: 'Payment Done',
        icon: BadgeCheck,
        className: 'bg-teal-50 text-teal-700 border-teal-200 ring-teal-100',
        dotColor: 'bg-teal-500',
        phase: 7,
    },
    reopen_closed: {
        label: 'Closed',
        icon: Archive,
        className: 'bg-gray-50 text-gray-700 border-gray-200 ring-gray-100',
        dotColor: 'bg-gray-500',
        phase: 8,
    },
    service_closed: {
        label: 'Warranty Closed',
        icon: ShieldCheck,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
        dotColor: 'bg-emerald-500',
        phase: 8,
    },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ReopenStatusBadgeProps {
    status: ReopenStatus | string;
    size?: 'xs' | 'sm' | 'md';
    showIcon?: boolean;
    showPulseDot?: boolean;
    className?: string;
}

export const ReopenStatusBadge: React.FC<ReopenStatusBadgeProps> = ({
    status,
    size = 'sm',
    showIcon = true,
    showPulseDot = false,
    className = '',
}) => {
    const config = STATUS_CONFIG[status as ReopenStatus];

    if (!config) {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium bg-gray-50 text-gray-600 border-gray-200 ${className}`}>
                {String(status).replace(/_/g, ' ')}
            </span>
        );
    }

    const Icon = config.icon;

    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-[10px] gap-1',
        sm: 'px-2.5 py-1 text-[11px] gap-1.5',
        md: 'px-3 py-1.5 text-xs gap-2',
    };

    const iconSizes = {
        xs: 'w-2.5 h-2.5',
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
    };

    const isActive = ['reopen_requested', 'reopen_approved', 'reopen_assigned', 'reopen_in_progress'].includes(status);

    return (
        <span
            className={`
                inline-flex items-center font-semibold rounded-full border
                ${sizeClasses[size]}
                ${config.className}
                ${className}
            `}
            title={config.label}
        >
            {showPulseDot && (
                <span className="relative flex w-1.5 h-1.5">
                    {isActive && (
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotColor}`} />
                    )}
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dotColor}`} />
                </span>
            )}
            {showIcon && <Icon className={iconSizes[size]} />}
            {config.label}
        </span>
    );
};

/** Returns the human-readable label for a reopen status */
export const getReopenStatusLabel = (status: ReopenStatus | string): string =>
    STATUS_CONFIG[status as ReopenStatus]?.label ?? String(status).replace(/_/g, ' ');

/** Returns true if the reopen status is a terminal state */
export const isReopenTerminal = (status: ReopenStatus | string): boolean =>
    ['reopen_rejected', 'reopen_closed', 'service_closed'].includes(status);

/** Returns true if action is needed by shop owner */
export const needsOwnerAction = (status: ReopenStatus | string): boolean =>
    ['reopen_requested', 'reopen_approved', 'reopen_completed', 'reopen_pending_invoice', 'reopen_payment_completed'].includes(status);

/** Returns true if action is needed by technician */
export const needsTechnicianAction = (status: ReopenStatus | string): boolean =>
    ['reopen_assigned', 'reopen_in_progress'].includes(status);

export default ReopenStatusBadge;

