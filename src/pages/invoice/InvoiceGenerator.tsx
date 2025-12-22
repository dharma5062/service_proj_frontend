import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface LineItem {
    description: string;
    quantity: number;
    price: number;
}

const InvoiceGenerator = () => {
    const navigate = useNavigate();
    const invoiceRef = useRef<HTMLDivElement>(null);

    const [documentType, setDocumentType] = useState<'invoice' | 'jobcard'>('invoice');
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { description: 'Oil Change Service', quantity: 1, price: 50.00 },
        { description: 'Air Filter Replacement', quantity: 1, price: 25.00 },
    ]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('INV-2024-001');
    const [issueDate, setIssueDate] = useState('2023-10-26');
    const [notes, setNotes] = useState('');

    const addLineItem = () => {
        setLineItems([...lineItems, { description: '', quantity: 1, price: 0 }]);
    };

    const removeLineItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };
        setLineItems(updated);
    };

    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const tax = subtotal * 0.10;
    const total = subtotal + tax;

    const generatePDF = async () => {
        if (!invoiceRef.current) return;

        try {
            toast.info('Generating PDF...', { duration: 2000 });

            const canvas = await html2canvas(invoiceRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`${invoiceNumber}.pdf`);

            toast.success('PDF downloaded successfully!');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-8">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-500 hover:text-blue-600 text-sm font-medium"
                >
                    Dashboard
                </button>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <button
                    onClick={() => navigate('/dashboard/services')}
                    className="text-gray-500 hover:text-blue-600 text-sm font-medium"
                >
                    Invoices
                </button>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-800 text-sm font-medium">New</span>
            </div>

            {/* Page Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Create Invoice / Job Card</h1>
                    <p className="text-gray-500 mt-1">
                        Fill in the details on the right to generate a new document.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline">Save as Draft</Button>
                    <Button onClick={generatePDF} className="bg-blue-600 hover:bg-blue-700">
                        Generate & Send
                    </Button>
                </div>
            </div>

            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Column: Preview */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-sm p-8 border">
                        <div ref={invoiceRef} className="aspect-[1/1.414] p-8 border rounded-lg bg-gray-50">
                            {/* Preview Header */}
                            <div className="flex justify-between items-start pb-8 border-b">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {documentType === 'invoice' ? 'INVOICE' : 'JOB CARD'}
                                    </h2>
                                    <p className="text-gray-500 mt-1">Invoice #: {invoiceNumber}</p>
                                </div>
                                <div className="text-right">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <span className="text-blue-600 font-bold text-lg">AP</span>
                                    </div>
                                    <p className="font-semibold text-gray-800 mt-2">AutoFix Pro</p>
                                    <p className="text-sm text-gray-500">123 Service Lane, Auto City</p>
                                </div>
                            </div>

                            {/* Customer & Date Info */}
                            <div className="flex justify-between items-start py-6">
                                <div>
                                    <p className="font-semibold text-gray-600 text-sm">BILLED TO</p>
                                    <p className="font-medium text-gray-900 mt-1">John Doe</p>
                                    <p className="text-gray-500 text-sm">john.doe@email.com</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-600 text-sm">
                                        Issue Date: {new Date(issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                    <p className="font-semibold text-gray-600 text-sm mt-1">
                                        Due Date: Nov 25, 2023
                                    </p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mt-2">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Service / Part
                                            </th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Qty
                                            </th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Price
                                            </th>
                                            <th className="py-3.5 text-right text-sm font-semibold text-gray-900">
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {lineItems.map((item, index) => (
                                            <tr key={index}>
                                                <td className="py-4 text-sm font-medium text-gray-900">
                                                    {item.description || '-'}
                                                </td>
                                                <td className="px-3 py-4 text-sm text-gray-500">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-3 py-4 text-sm text-gray-500">
                                                    ${item.price.toFixed(2)}
                                                </td>
                                                <td className="py-4 text-right text-sm font-medium text-gray-900">
                                                    ${(item.quantity * item.price).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="mt-6 flex justify-end">
                                <div className="w-full max-w-sm">
                                    <dl className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500">Subtotal</dt>
                                            <dd className="font-medium text-gray-900">${subtotal.toFixed(2)}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500">Tax (10%)</dt>
                                            <dd className="font-medium text-gray-900">${tax.toFixed(2)}</dd>
                                        </div>
                                        <div className="flex justify-between pt-3 border-t">
                                            <dt className="font-semibold text-base text-gray-900">Total</dt>
                                            <dd className="font-semibold text-base text-gray-900">${total.toFixed(2)}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Document Type Toggle */}
                    <div className="flex h-10 p-1 bg-gray-200 rounded-lg">
                        <button
                            onClick={() => setDocumentType('invoice')}
                            className={`flex-1 rounded-md px-2 text-sm font-medium transition-all ${documentType === 'invoice'
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-500'
                                }`}
                        >
                            Invoice
                        </button>
                        <button
                            onClick={() => setDocumentType('jobcard')}
                            className={`flex-1 rounded-md px-2 text-sm font-medium transition-all ${documentType === 'jobcard'
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-500'
                                }`}
                        >
                            Job Card
                        </button>
                    </div>

                    {/* Customer Information */}
                    <Collapsible defaultOpen className="border rounded-xl bg-white">
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                            <p className="text-sm font-medium">Customer Information</p>
                            <ChevronRight className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-90" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="border-t p-4">
                            <div className="relative">
                                <Label htmlFor="customer-search">Select Customer</Label>
                                <div className="relative mt-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="customer-search"
                                        placeholder="Search by name or email..."
                                        className="pl-10"
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Document Details */}
                    <Collapsible className="border rounded-xl bg-white">
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                            <p className="text-sm font-medium">Document Details</p>
                            <ChevronRight className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-90" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="border-t p-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="invoice-number">Invoice #</Label>
                                    <Input
                                        id="invoice-number"
                                        value={invoiceNumber}
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="issue-date">Issue Date</Label>
                                    <Input
                                        id="issue-date"
                                        type="date"
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Service & Parts */}
                    <Collapsible defaultOpen className="border rounded-xl bg-white">
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                            <p className="text-sm font-medium">Service & Parts</p>
                            <ChevronRight className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-90" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="border-t p-4 space-y-4">
                            {lineItems.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-5">
                                        {index === 0 && (
                                            <Label className="text-xs text-gray-600 mb-1">Description</Label>
                                        )}
                                        <Input
                                            className="text-sm"
                                            value={item.description}
                                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        {index === 0 && (
                                            <Label className="text-xs text-gray-600 mb-1">Qty</Label>
                                        )}
                                        <Input
                                            className="text-sm"
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        {index === 0 && (
                                            <Label className="text-xs text-gray-600 mb-1">Price</Label>
                                        )}
                                        <Input
                                            className="text-sm"
                                            type="number"
                                            step="0.01"
                                            value={item.price}
                                            onChange={(e) => updateLineItem(index, 'price', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full h-9 text-gray-500 hover:bg-red-100 hover:text-red-600"
                                            onClick={() => removeLineItem(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={addLineItem}
                                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-600 hover:text-blue-600 transition text-sm font-medium"
                            >
                                <Plus className="h-4 w-4" /> Add Item
                            </button>
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Notes & Payment */}
                    <Collapsible className="border rounded-xl bg-white">
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                            <p className="text-sm font-medium">Notes & Payment</p>
                            <ChevronRight className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-90" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="border-t p-4">
                            <div>
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    rows={3}
                                    placeholder="Add any additional notes for the customer..."
                                    className="mt-1"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </div>
        </div>
    );
};

export default InvoiceGenerator;
