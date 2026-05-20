import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/table/datatable';
import { toast } from 'sonner';

interface Promotion {
    id: number;
    name: string;
    discount: string;
    validityPeriod: string;
    status: 'Active' | 'Scheduled' | 'Inactive';
}

const PromotionsPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const promotions: Promotion[] = [
        {
            id: 1,
            name: 'Summer Sale',
            discount: '20% off',
            validityPeriod: 'Jul 1 - Aug 31, 2024',
            status: 'Active',
        },
        {
            id: 2,
            name: 'New Client Discount',
            discount: '$10 off',
            validityPeriod: 'Jan 1 - Dec 31, 2024',
            status: 'Active',
        },
        {
            id: 3,
            name: 'Holiday Special',
            discount: '15% off',
            validityPeriod: 'Dec 1 - Dec 24, 2024',
            status: 'Scheduled',
        },
        {
            id: 4,
            name: 'Loyalty Member Perk',
            discount: '$5 off',
            validityPeriod: 'Ongoing',
            status: 'Inactive',
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-700 hover:bg-green-100';
            case 'Scheduled':
                return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
            case 'Inactive':
                return 'bg-red-100 text-red-700 hover:bg-red-100';
            default:
                return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
        }
    };

    const columns: Column<Promotion>[] = [
        {
            key: 'name',
            title: 'Offer Name',
            dataIndex: 'name',
            sortable: true,
            filterable: true,
            render: (value) => <span className="font-medium text-gray-900">{value}</span>,
        },
        {
            key: 'discount',
            title: 'Discount',
            dataIndex: 'discount',
            sortable: true,
            filterable: true,
            render: (value) => <span className="text-gray-700">{value}</span>,
        },
        {
            key: 'validityPeriod',
            title: 'Validity Period',
            dataIndex: 'validityPeriod',
            sortable: true,
            render: (value) => <span className="text-gray-600">{value}</span>,
        },
        {
            key: 'status',
            title: 'Status',
            dataIndex: 'status',
            sortable: true,
            filterable: true,
            filterOptions: [
                { label: 'Active', value: 'Active' },
                { label: 'Scheduled', value: 'Scheduled' },
                { label: 'Inactive', value: 'Inactive' },
            ],
            render: (value) => (
                <Badge className={getStatusColor(value)}>
                    {value}
                </Badge>
            ),
        },
    ];

    const handleAddPromotion = () => {
        toast.info('Create new promotion');
        console.log('Create new promotion');
    };

    const handleEditPromotion = (record: Promotion) => {
        toast.info(`Editing promotion: ${record.name}`);
        console.log('Edit promotion:', record);
    };

    const handleDeletePromotion = (record: Promotion) => {
        toast.success('Promotion deleted successfully', {
            description: `${record.name} has been removed.`,
        });
        console.log('Delete promotion:', record);
    };

    const handleExportPromotions = () => {
        toast.info('Exporting promotions data');
        console.log('Export promotions');
    };

    return (
        <div className="p-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                        Promotional Offers & Discounts
                    </h1>
                    <p className="text-xs sm:text-sm mt-0.5 text-primary font-medium">
                        Create, manage, and track promotional offers for your shop.
                    </p>
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={promotions}
                title="Promotions List"
                searchable={true}
                showActions={true}
                showAdd={true}
                showExport={true}
                onAdd={handleAddPromotion}
                onEdit={handleEditPromotion}
                onDelete={handleDeletePromotion}
                onExport={handleExportPromotions}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: promotions.length,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                }}
                hoverable
                bordered
            />
        </div>
    );
};

export default PromotionsPage;
