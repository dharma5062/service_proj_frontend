import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    UserCheck,
    UserCircle,
    History,
    Package,
    Loader2,
    AlertCircle,
    CheckCircle,
    IndianRupee,
} from 'lucide-react';
import { useServiceReopenApi, ServiceReopenRequest } from '@/pages/serviceAPI/ServiceReopenAPI';
import { useShopEmployeesApi } from '@/pages/serviceAPI/ShopEmployeesAPI';
import { ReopenStatusBadge } from '@/components/reopen/ReopenStatusBadge';
import { toast } from 'sonner';

interface ReopenAssignTechnicianModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reopenRequest: ServiceReopenRequest;
    onAssigned?: () => void;
}

export const ReopenAssignTechnicianModal: React.FC<ReopenAssignTechnicianModalProps> = ({
    open,
    onOpenChange,
    reopenRequest,
    onAssigned,
}) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [note, setNote] = useState('');


    const { useGetEmployeeHistory, useAssignReopenEmployee } = useServiceReopenApi();
    const { useGetShopEmployees } = useShopEmployeesApi();

    const { data: history, isLoading: historyLoading } = useGetEmployeeHistory(
        open ? reopenRequest.id : undefined
    );
    const { data: employeesData } = useGetShopEmployees({ per_page: 100 });
    const assignMutation = useAssignReopenEmployee();

    const employees = employeesData?.data ?? [];
    const previousEmployee = history?.previous_employee;

    // Pre-select same employee if available
    React.useEffect(() => {
        if (previousEmployee?.id && !selectedEmployeeId) {
            setSelectedEmployeeId(String(previousEmployee.id));
        }
    }, [previousEmployee]);

    const handleAssign = async () => {
        if (!selectedEmployeeId) {
            toast.error('Please select an employee.');
            return;
        }
        try {
            const res = await assignMutation.mutateAsync({
                reopenId: reopenRequest.id,
                employeeId: Number(selectedEmployeeId),
                note: note || undefined,
            });
            if (res.status) {
                toast.success(res.message || 'Employee assigned successfully!');
                onOpenChange(false);
                onAssigned?.();
            } else {
                toast.error(res.message || 'Failed to assign.');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error assigning employee.');
        }
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[680px] p-0 gap-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-5 pt-5 pb-3 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                            <UserCheck className="w-4.5 h-4.5 text-purple-700" />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-bold text-gray-900">
                                Assign Employee — Reopen Cycle #{reopenRequest.reopen_number}
                            </DialogTitle>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                SR#{reopenRequest.service_id} · Customer: {reopenRequest.customer?.name ?? '—'}
                            </p>
                        </div>
                        <div className="ml-auto">
                            <ReopenStatusBadge status={reopenRequest.reopen_status} size="xs" showPulseDot />
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x max-h-[580px] overflow-y-auto">

                    {/* LEFT: Previous Employee Context */}
                    <div className="lg:w-[52%] p-4 space-y-3 bg-gray-50/50">
                        <h3 className="text-[10px] font-bold text-gray-400 capitalize tracking-wider flex items-center gap-1.5">
                            <History className="w-3 h-3" /> Previous Cycle Context
                        </h3>

                        {historyLoading ? (
                            <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading history...
                            </div>
                        ) : (
                            <>
                                {/* Previous Employee */}
                                {previousEmployee ? (
                                    <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-start gap-2.5 shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                                            {previousEmployee.name?.[0] ?? '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">{previousEmployee.name}</p>
                                            <p className="text-[10px] text-gray-500 capitalize">{previousEmployee.role ?? previousEmployee.user_type ?? 'Employee'}</p>
                                            {previousEmployee.phone && (
                                                <p className="text-[10px] text-gray-400">{previousEmployee.phone}</p>
                                            )}
                                        </div>
                                        <span className="ml-auto text-[9px] bg-purple-50 text-purple-600 border border-purple-100 rounded px-1.5 py-0.5 font-bold shrink-0">
                                            Prev. Assigned
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-[11px] text-gray-400 bg-white rounded-lg border p-2.5">
                                        <UserCircle className="w-3.5 h-3.5" /> No previous assignment found
                                    </div>
                                )}

                                {/* Customer's Issue */}
                                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                                    <p className="text-[10px] font-semibold text-amber-700 capitalize tracking-wider mb-1">Customer Complaint</p>
                                    <p className="text-[11px] text-gray-800 leading-relaxed">{reopenRequest.issue_type && <span className="font-bold">{reopenRequest.issue_type}: </span>}{reopenRequest.reason}</p>
                                </div>

                                {/* Original Services & Parts */}
                                {((history?.previous_parts?.length ?? 0) > 0 || (history?.previous_charges?.length ?? 0) > 0) && (
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="flex items-center gap-1.5 p-2 border-b bg-gray-50">
                                            <Package className="w-3 h-3 text-gray-500" />
                                            <span className="text-[10px] font-bold text-gray-600 capitalize tracking-wider">Original Services & Parts</span>
                                        </div>
                                        <div className="divide-y max-h-[120px] overflow-y-auto">
                                            {history?.previous_parts?.map((p, i) => (
                                                <div key={`p-${i}`} className="flex items-center justify-between px-2.5 py-1.5">
                                                    <div>
                                                        <p className="text-[11px] font-medium text-gray-800">{p.name}</p>
                                                        <p className="text-[9px] text-gray-400">Qty: {p.quantity}</p>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-gray-700">₹{p.total.toLocaleString()}</p>
                                                </div>
                                            ))}
                                            {history?.previous_charges?.map((c, i) => (
                                                <div key={`c-${i}`} className="flex items-center justify-between px-2.5 py-1.5 bg-blue-50/30">
                                                    <div>
                                                        <p className="text-[11px] font-medium text-blue-900">{c.name} <span className="text-[9px] text-blue-600 font-semibold">(Service)</span></p>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-blue-800">₹{c.amount.toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Original Invoice Details */}
                                {history?.original_invoice && (
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 space-y-1.5">
                                        <div className="flex items-center gap-1.5 border-b border-indigo-100/50 pb-1.5 mb-1.5">
                                            <IndianRupee className="w-3 h-3 text-indigo-600" />
                                            <span className="text-[10px] font-bold text-indigo-700 capitalize tracking-wider">Original Invoice Breakdown</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-indigo-800/80">
                                            <span>Subtotal</span>
                                            <span className="font-medium">₹{Number(history.original_invoice.subtotal).toLocaleString()}</span>
                                        </div>
                                        {Number(history.original_invoice.discount) > 0 && (
                                            <div className="flex justify-between items-center text-[10px] text-green-700">
                                                <span>Discount</span>
                                                <span className="font-medium">-₹{Number(history.original_invoice.discount).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {Number(history.original_invoice.tax_amount) > 0 && (
                                            <div className="flex justify-between items-center text-[10px] text-indigo-800/80">
                                                <span>Tax</span>
                                                <span className="font-medium">+₹{Number(history.original_invoice.tax_amount).toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-1 border-t border-indigo-200/50">
                                            <span className="text-[11px] font-bold text-indigo-900">Total Paid</span>
                                            <span className="text-sm font-black text-indigo-700">₹{Number(history.original_invoice.total_amount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Service Notes */}
                                {/* {history?.service_notes && (
                                    <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <Wrench className="w-3 h-3" /> Previous Work Notes
                                        </p>
                                        <p className="text-[11px] text-gray-700 leading-relaxed line-clamp-3">{renderServiceNotes(history.service_notes)}</p>
                                    </div>
                                )} */}


                            </>
                        )}
                    </div>

                    {/* RIGHT: Assignment Form */}
                    <div className="lg:w-[48%] p-4 space-y-4 flex flex-col">
                        <h3 className="text-[10px] font-bold text-gray-400 capitalize tracking-wider flex items-center gap-1.5">
                            <UserCheck className="w-3 h-3" /> Assign Technician
                        </h3>

                        {/* Quick-assign same employee */}
                        {previousEmployee && (
                            <button
                                onClick={() => setSelectedEmployeeId(String(previousEmployee.id))}
                                className={`w-full flex items-center gap-2.5 border rounded-xl p-2.5 text-left transition-all ${
                                    selectedEmployeeId === String(previousEmployee.id)
                                        ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-300'
                                        : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/30'
                                }`}
                            >
                                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs shrink-0">
                                    {previousEmployee.name?.[0]}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-bold text-gray-900 truncate">{previousEmployee.name}</p>
                                    <p className="text-[9px] text-gray-400">Recommended · Knows the repair history</p>
                                </div>
                                {selectedEmployeeId === String(previousEmployee.id) && (
                                    <CheckCircle className="w-4 h-4 text-purple-600 shrink-0" />
                                )}
                            </button>
                        )}

                        {/* Divider */}
                        {previousEmployee && employees.length > 1 && (
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-[9px] text-gray-400 font-medium">Or Select Different</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>
                        )}

                        {/* Employee Dropdown */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-gray-600">Select Employee</label>
                            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                                <SelectTrigger className="h-9 text-xs border-gray-200">
                                    <SelectValue placeholder="Choose an employee..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp: any) => (
                                        <SelectItem key={emp.id} value={String(emp.id)} className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-[10px]">
                                                    {emp.name?.[0]}
                                                </div>
                                                <div>
                                                    <span className="font-medium">{emp.name}</span>
                                                    {previousEmployee?.id === emp.id && (
                                                        <span className="ml-1.5 text-[9px] text-purple-600 font-semibold">(Prev. Assigned)</span>
                                                    )}
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Internal Note */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-gray-600">Internal Instructions (Optional)</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Describe the issue or any specific instructions..."
                                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 min-h-[80px] resize-none focus:border-purple-400 focus:ring-1 focus:ring-purple-300 outline-none transition-all"
                            />
                        </div>

                        {/* Info tip */}
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5 mt-auto">
                            <AlertCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-blue-600 leading-relaxed">
                                Assigning will notify the selected employee. The service status will update to <strong>ASSIGNED</strong> and the employee will be asked to start rework.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                className="h-8 text-xs px-5 bg-purple-600 hover:bg-purple-700 text-white font-bold"
                                onClick={handleAssign}
                                disabled={!selectedEmployeeId || assignMutation.isPending}
                            >
                                {assignMutation.isPending ? (
                                    <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Assigning...</>
                                ) : (
                                    <><UserCheck className="w-3 h-3 mr-1.5" /> Confirm Assignment</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReopenAssignTechnicianModal;