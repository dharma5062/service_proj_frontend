import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { DataTable, Column } from '@/components/ui/table/datatable';
import { Product, useProductsApi } from '@/pages/serviceAPI/ProductsAPI';

const ProductsPage = () => {
    const navigate = useNavigate();
    const { shopId, hasPermission } = useAuth();
    const { useGetProducts, useDeleteProduct } = useProductsApi();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const { data: productResponse, isLoading: loading } = useGetProducts({ page: currentPage, per_page: pageSize });
    const products = productResponse?.data ?? [];
    const totalProducts = productResponse?.total ?? 0;
    const deleteProductMutation = useDeleteProduct();

    // Reset pagination when branch changes
    useEffect(() => {
        setCurrentPage(1);
    }, [shopId]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

    /**
     * Extract plain description text from the description field.
     * The backend may store description as a JSON object: { text: '...', taxes: [...] }
     * or as a plain string.
     */
    /**
     * Deeply parse a value that may be multi-level stringified JSON.
     * Returns the final parsed object or string.
     */
    const deepParse = (value: any): any => {
        let parsed = value;
        // Keep parsing while it's a string that looks like JSON
        while (typeof parsed === 'string') {
            try {
                const next = JSON.parse(parsed);
                if (next === parsed) break; // avoid infinite loop on plain strings that parse to themselves
                parsed = next;
            } catch {
                break;
            }
        }
        return parsed;
    };

    const getDescriptionText = (description: any): string => {
        if (!description) return '';

        let parsed = deepParse(description);

        if (typeof parsed === 'object' && parsed !== null) {
            if ('text' in parsed) {
                // The text field itself may be a JSON string containing the actual text
                const innerText = deepParse(parsed.text);
                if (typeof innerText === 'object' && innerText !== null && 'text' in innerText) {
                    return innerText.text || '';
                }
                return typeof innerText === 'string' ? innerText : (parsed.text || '');
            }
            if ('taxes' in parsed) {
                return '';
            }
        }

        return typeof description === 'string' ? description : String(description);
    };

    /**
     * Extract cost_price from the description field.
     * The cost_price may be nested inside a JSON-encoded text field.
     */
    const getCostPrice = (description: any): number | null => {
        if (!description) return null;

        let parsed = deepParse(description);

        if (typeof parsed === 'object' && parsed !== null) {
            // Check if cost_price is at top level
            if (parsed.cost_price !== undefined) return parsed.cost_price;

            // Check inside the text field (which may be a JSON string)
            if ('text' in parsed) {
                const innerText = deepParse(parsed.text);
                if (typeof innerText === 'object' && innerText !== null && innerText.cost_price !== undefined) {
                    return innerText.cost_price;
                }
            }
        }

        return null;
    };

    /**
     * Extract tax info from the description field.
     * Returns { tax_name, tax_percentage } or null if no tax data exists.
     */
    const getTaxInfo = (product: Product): { tax_name: string; tax_percentage: number; tax_type?: string } | null => {
        // First check top-level tax fields
        if (product.tax_name || product.tax_percentage || product.tax_type) {
            return {
                tax_name: product.tax_name || '',
                tax_percentage: product.tax_percentage || 0,
                tax_type: product.tax_type || 'exclusive',
            };
        }

        // Fallback: check if tax is embedded in description JSON
        const desc = product.description;
        let parsed = desc;

        if (typeof parsed === 'string') {
            try {
                parsed = JSON.parse(parsed);
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
            } catch {
                // Not JSON
            }
        }

        if (typeof parsed === 'object' && parsed !== null) {
            const descObj = parsed as any;
            if (descObj.taxes && Array.isArray(descObj.taxes) && descObj.taxes.length > 0) {
                return {
                    tax_name: descObj.taxes[0].tax_name || '',
                    tax_percentage: descObj.taxes[0].tax_percentage || 0,
                    tax_type: descObj.taxes[0].tax_type || 'exclusive',
                };
            }
        }

        return null;
    };

    const columns: Column<Product>[] = [
        {
            key: 'image',
            title: 'Image',
            dataIndex: 'image_url',
            render: (value) => (
                value ? (
                    <img
                        src={value}
                        alt="Product"
                        className="w-8 h-8 object-cover rounded-md border border-gray-100 shadow-sm"
                    />
                ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-md flex items-center justify-center border border-gray-200">
                        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                        </svg>
                    </div>
                )
            ),
        },
        {
            key: 'name',
            title: 'Product Name',
            dataIndex: 'name',
            sortable: true,
            render: (value, record) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-900 leading-tight">
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium mt-0.5 line-clamp-1 max-w-[150px]">
                        {getDescriptionText(record.description) || 'No description'}
                    </span>
                </div>
            ),
        },
        {
            key: 'cost_price',
            title: 'Cost Price',
            dataIndex: 'description',
            render: (value) => {
                const costPrice = getCostPrice(value);
                if (costPrice === null) return <span className="text-xs text-gray-400">-</span>;
                return (
                    <span className="text-xs font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-100 whitespace-nowrap">
                        ₹{Number(costPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                );
            },
        },
        {
            key: 'price',
            title: 'Selling Price',
            dataIndex: 'price',
            sortable: true,
            render: (value) => (
                value ? (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20 whitespace-nowrap">
                        ₹{Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                ) : <span className="text-xs text-gray-400">-</span>
            ),
        },
        {
            key: 'category',
            title: 'Category',
            dataIndex: 'category',
            sortable: true,
            render: (value) => {
                if (!value) return <span className="text-xs text-gray-400">-</span>;

                // Build hierarchy path if parent exists
                const hierarchy: string[] = [];
                if (value.parent) {
                    if (value.parent.parent) {
                        hierarchy.push(value.parent.parent.name);
                    }
                    hierarchy.push(value.parent.name);
                }
                const currentName = value.name.charAt(0).toUpperCase() + value.name.slice(1);

                return (
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800">{currentName}</span>
                        {hierarchy.length > 0 && (
                            <span className="text-[10px] text-gray-400 font-medium">
                                {hierarchy.join(' → ')}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'brand',
            title: 'Brand',
            dataIndex: 'brand',
            sortable: true,
            render: (value) => (
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-100">
                    {value?.name.charAt(0).toUpperCase() + value?.name.slice(1) || '-'}
                </span>
            ),
        },
        {
            key: 'tax',
            title: 'Tax Rate',
            dataIndex: 'id',
            render: (_value, record) => {
                const taxInfo = record ? getTaxInfo(record) : null;
                if (!taxInfo || (!taxInfo.tax_name && !taxInfo.tax_percentage)) {
                    return <span className="text-xs text-gray-400">-</span>;
                }
                return (
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800">{taxInfo.tax_name || 'GST'}</span>
                        <span className="text-[10px] font-semibold text-gray-500">
                            {taxInfo.tax_percentage}% {taxInfo.tax_type === 'inclusive' ? '(Incl.)' : '(Excl.)'}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'total_price',
            title: 'Total Amount',
            dataIndex: 'id',
            render: (_value, record) => {
                if (!record || !record.price) return <span className="text-xs text-gray-400">-</span>;
                const price = Number(record.price);
                const taxInfo = record ? getTaxInfo(record) : null;
                let total = price;
                if (taxInfo && taxInfo.tax_percentage) {
                    if (taxInfo.tax_type === 'inclusive') {
                        total = price;
                    } else {
                        total = price + (price * taxInfo.tax_percentage / 100);
                    }
                }
                return (
                    <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-full border border-secondary/20 whitespace-nowrap shadow-sm">
                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                );
            },
        },
    ];

    const handleView = (record: Product) => {
        navigate(`/dashboard/settings/product/view/${record.id}`);
    };

    const handleEdit = (record: Product) => {
        navigate(`/dashboard/settings/product/edit/${record.id}`);
    };

    const handleDeleteClick = (record: Product) => {
        setSelectedProductId(record.id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedProductId) {
            try {
                await deleteProductMutation.mutateAsync(selectedProductId);
                toast.success('Product deleted successfully');
            } catch (error) {
                toast.error('Failed to delete product', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        setDeleteDialogOpen(false);
        setSelectedProductId(null);
    };

    const handleAddNew = () => {
        navigate('/dashboard/settings/product/create');
    };

    const processedProducts = useMemo(() => {
        return products.map(p => ({
            ...p,
            _filter_category: p.category?.name?.toLowerCase() || 'unassigned',
            _filter_brand: p.brand?.name?.toLowerCase() || 'unassigned',
            _search_blob: `${p.name} ${p.category?.name || ''} ${p.brand?.name || ''}`.toLowerCase()
        }));
    }, [products]);

    const categoryOptions = useMemo(() => {
        const unique = new Set<string>();
        products.forEach(p => {
            if (p.category?.name) unique.add(p.category.name.toLowerCase());
        });
        return [
            ...Array.from(unique).map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
            { label: 'Unassigned', value: 'unassigned' }
        ];
    }, [products]);

    const brandOptions = useMemo(() => {
        const unique = new Set<string>();
        products.forEach(p => {
            if (p.brand?.name) unique.add(p.brand.name.toLowerCase());
        });
        return [
            ...Array.from(unique).map(b => ({ label: b.charAt(0).toUpperCase() + b.slice(1), value: b })),
            { label: 'Unassigned', value: 'unassigned' }
        ];
    }, [products]);

    return (
        <div className="p-0">
            {/* DataTable */}
            <DataTable
                title="Products List"
                headerStats={[
                    {
                        label: 'Total Products',
                        value: totalProducts,
                        icon: <Package className="h-3 w-3" />,
                        color: 'primary'
                    }
                ]}
                filterConfig={[
                    {
                        key: '_filter_category',
                        label: 'Category',
                        type: 'select',
                        options: categoryOptions
                    },
                    {
                        key: '_filter_brand',
                        label: 'Brand',
                        type: 'select',
                        options: brandOptions
                    }
                ]}
                searchKey="_search_blob"
                columns={columns}
                data={processedProducts}
                searchable={true}
                showActions={true}
                showAdd={hasPermission('product.create')}
                showExport={true}
                onAdd={handleAddNew}
                onExport={() => toast.info('Exporting data...')}
                onView={handleView}
                onEdit={hasPermission('product.update') ? handleEdit : undefined}
                onDelete={hasPermission('product.delete') ? handleDeleteClick : undefined}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: totalProducts,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                }}
                serverSidePagination={true}
                hoverable
                bordered
                loading={loading}
            />


            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ProductsPage;
