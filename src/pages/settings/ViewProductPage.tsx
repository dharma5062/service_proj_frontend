import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProductsApi } from '@/pages/serviceAPI/ProductsAPI';

// ── Helpers ──────────────────────────────────────────────────────────────────

const deepParse = (value: any): any => {
    let parsed = value;
    while (typeof parsed === 'string') {
        try {
            const next = JSON.parse(parsed);
            if (next === parsed) break;
            parsed = next;
        } catch { break; }
    }
    return parsed;
};

const getDescriptionText = (description: any): string => {
    if (!description) return '';
    const parsed = deepParse(description);
    if (typeof parsed === 'object' && parsed !== null && 'text' in parsed) {
        const inner = deepParse(parsed.text);
        if (typeof inner === 'object' && inner !== null && 'text' in inner) return inner.text || '';
        return typeof inner === 'string' ? inner : (parsed.text || '');
    }
    return typeof description === 'string' ? description : '';
};

const getCostPrice = (description: any): number | null => {
    if (!description) return null;
    const parsed = deepParse(description);
    if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.cost_price !== undefined) return parsed.cost_price;
        if ('text' in parsed) {
            const inner = deepParse(parsed.text);
            if (typeof inner === 'object' && inner !== null && inner.cost_price !== undefined) return inner.cost_price;
        }
    }
    return null;
};

const getTaxInfo = (product: any): { tax_name: string; tax_percentage: number; tax_type?: string } | null => {
    if (product.tax_name || product.tax_percentage || product.tax_type) {
        return { tax_name: product.tax_name || '', tax_percentage: product.tax_percentage || 0, tax_type: product.tax_type || 'exclusive' };
    }
    const parsed = deepParse(product.description);
    if (typeof parsed === 'object' && parsed !== null && parsed.taxes?.length > 0) {
        const t = parsed.taxes[0];
        return { tax_name: t.tax_name || '', tax_percentage: t.tax_percentage || 0, tax_type: t.tax_type || 'exclusive' };
    }
    return null;
};

const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Component ─────────────────────────────────────────────────────────────────

const ViewProductPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { useGetProductById } = useProductsApi();
    const { data: product, isLoading } = useGetProductById(id ? Number(id) : undefined);

    if (isLoading) {
        return (
            <div className="p-4 space-y-4 max-w-2xl mx-auto">
                <Skeleton className="h-6 w-40" />
                <div className="flex gap-4">
                    <Skeleton className="w-28 h-28 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-4 text-center text-sm text-gray-500">
                Product not found.
                <Button variant="link" onClick={() => navigate('/dashboard/settings/product')}>Go back</Button>
            </div>
        );
    }

    const taxInfo = getTaxInfo(product);
    const costPrice = getCostPrice(product.description);
    const descText = getDescriptionText(product.description);
    const price = product.price ? Number(product.price) : 0;
    const taxRate = taxInfo?.tax_percentage ?? 0;
    const taxAmt = taxInfo?.tax_type === 'inclusive'
        ? price - price / (1 + taxRate / 100)
        : price * taxRate / 100;
    const totalPrice = taxInfo?.tax_type === 'inclusive' ? price : price + taxAmt;

    const categoryHierarchy: string[] = [];
    if (product.category) {
        const cat = product.category as any;
        if (cat.parent?.parent) categoryHierarchy.push(cat.parent.parent.name);
        if (cat.parent) categoryHierarchy.push(cat.parent.name);
        categoryHierarchy.push(cat.name);
    }

    return (
        <div className="p-0">
            {/* Page header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/dashboard/settings/product')}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 tracking-tight">Product Details</h1>
                        <p className="text-xs text-blue-600 mt-0.5">View full product information</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => navigate(`/dashboard/settings/product/edit/${product.id}`)}
                >
                    <Pencil className="w-3 h-3" /> Edit Product
                </Button>
            </div>

            {/* Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

                {/* ── Header banner ── */}
                <div className="flex gap-4 p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    {/* Image */}
                    <div className="shrink-0">
                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-28 h-28 object-contain rounded-xl border border-gray-200 bg-white shadow-sm"
                            />
                        ) : (
                            <div className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border border-gray-200 flex items-center justify-center shadow-sm">
                                <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Title block */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">{product.name}</h2>
                            <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${product.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {product.active ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        {/* Category breadcrumb */}
                        {categoryHierarchy.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-2">
                                {categoryHierarchy.map((c, i) => (
                                    <span key={i} className="flex items-center gap-1">
                                        <span className="text-[11px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">{c}</span>
                                        {i < categoryHierarchy.length - 1 && (
                                            <span className="text-gray-300 text-[10px]">›</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Brand + ID row */}
                        <div className="flex flex-wrap gap-2 mt-2.5">
                            {product.brand && (
                                <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                    🏷 {product.brand.name}
                                </span>
                            )}
                            <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                                ID #{product.id}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="p-5 space-y-5">

                    {/* Pricing breakdown */}
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pricing Breakdown</p>
                        <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
                            {costPrice !== null && (
                                <div className="flex justify-between items-center px-4 py-2.5">
                                    <span className="text-xs text-gray-500">Cost Price</span>
                                    <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded">{fmt(Number(costPrice))}</span>
                                </div>
                            )}
                            {price > 0 && (
                                <div className="flex justify-between items-center px-4 py-2.5">
                                    <span className="text-xs text-gray-500">Selling Price</span>
                                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{fmt(price)}</span>
                                </div>
                            )}
                            {taxInfo && taxRate > 0 && (
                                <div className="flex justify-between items-center px-4 py-2.5">
                                    <span className="text-xs text-gray-500">
                                        Tax — {taxInfo.tax_name || 'GST'} {taxRate}%
                                        <span className="ml-1 text-[10px] text-gray-400">
                                            ({taxInfo.tax_type === 'inclusive' ? 'Inclusive' : 'Exclusive'})
                                        </span>
                                    </span>
                                    <span className="text-xs text-gray-600">+ {fmt(taxAmt)}</span>
                                </div>
                            )}
                            {price > 0 && (
                                <div className="flex justify-between items-center px-4 py-3 bg-green-50 rounded-b-xl">
                                    <span className="text-xs font-bold text-gray-700">Total Price (Final)</span>
                                    <span className="text-sm font-bold text-green-700">{fmt(totalPrice)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {descText && (
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Description</p>
                            <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">{descText}</p>
                        </div>
                    )}

                    {/* Meta info grid */}
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Details</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'Brand', value: product.brand?.name },
                                { label: 'Category', value: categoryHierarchy[categoryHierarchy.length - 1] },
                                {
                                    label: 'Created',
                                    value: product.created_at
                                        ? new Date(product.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : null,
                                },
                                {
                                    label: 'Updated',
                                    value: product.updated_at
                                        ? new Date(product.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : null,
                                },
                            ].filter(r => r.value).map(({ label, value }) => (
                                <div key={label} className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                                    <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ViewProductPage;
