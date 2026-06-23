import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, Filter, X, Plus, Download, Upload, Eye, Edit, Trash2, Ban } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "../scroll-area";
import { CustomCard, CustomCardBody, CustomCardHeader, CustomCardTitle } from "./customCard";
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from "./customTable";

export interface Column<T = any> {
    key: string;
    title: string;
    dataIndex?: string;
    width?: string | number;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    filterable?: boolean;
    render?: (value: any, record: T, index: number) => React.ReactNode;
    className?: string;
    filterOptions?: Array<{ label: string; value: string }>;
    description?: string; // Tooltip on column header
    hidden?: boolean; // Hide column
    minWidth?: string | number;
    maxWidth?: string | number;
    ellipsis?: boolean; // Truncate text
}

export interface HeaderStat {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export interface HeaderAction {
    key: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost' | 'destructive';
    className?: string;
    disabled?: boolean;
    show?: boolean;
}

export interface FilterConfig {
    key: string;
    label: string;
    type: 'select' | 'text';
    options?: Array<{ label: string; value: string }>;
    placeholder?: string;
}

export interface DataTableProps<T = any> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    pagination?: {
        current: number;
        pageSize: number;
        total: number;
        onChange: (page: number, pageSize: number) => void;
    };
    onSort?: (key: string, direction: 'asc' | 'desc' | null) => void;
    onFilter?: (filters: Record<string, any>) => void;
    className?: string;
    size?: 'small' | 'medium' | 'large'; // Legacy
    density?: 'compact' | 'default' | 'comfortable'; // New
    bordered?: boolean;
    hoverable?: boolean;
    striped?: boolean;
    sticky?: boolean;
    searchable?: boolean;
    searchAlign?: 'left' | 'right';
    searchKey?: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    headerStats?: HeaderStat[];
    actions?: React.ReactNode;
    headerActions?: HeaderAction[];
    filterConfig?: FilterConfig[];
    compact?: boolean; // Legacy
    onAdd?: () => void;
    onImport?: () => void;
    onExport?: () => void;
    showAdd?: boolean;
    showImport?: boolean;
    showExport?: boolean;
    showActions?: boolean;
    onView?: (record: T) => void;
    onEdit?: (record: T) => void;
    onDelete?: (record: T) => void;
    onRevoke?: (record: T) => void;
    onSearch?: (value: string) => void;
    rowSelection?: boolean;
    selectedRowKeys?: (string | number)[];
    onSelectionChange?: (selectedKeys: (string | number)[], selectedRows: T[]) => void;
    getRowKey?: (record: T) => string | number;
    shouldShowView?: (record: T) => boolean;
    shouldShowEdit?: (record: T) => boolean;
    shouldShowDelete?: (record: T) => boolean;
    shouldShowRevoke?: (record: T) => boolean;
    defaultSort?: { key: string; direction: 'asc' | 'desc' };
    serverSidePagination?: boolean; // When true, data is already paged by server — skip internal slice
    emptyText?: React.ReactNode;
}

interface SortState {
    key: string | null;
    direction: 'asc' | 'desc' | null;
}

export const DataTable = <T extends Record<string, any>>({
    columns,
    data,
    loading = false,
    pagination,
    onSort,
    onFilter,
    className,
    size = 'small', // Legacy
    density, // New
    bordered = true,
    hoverable = true,
    striped = false,
    sticky = false,
    searchable = true,
    searchAlign = 'right',
    searchKey,
    title,
    description,
    headerStats,
    actions,
    headerActions,
    filterConfig,
    compact = true, // Legacy
    onAdd,
    onImport,
    onExport,
    showAdd = false,
    showImport = false,
    showExport = false,
    showActions = false,
    onView,
    onEdit,
    onDelete,
    onRevoke,
    onSearch,
    rowSelection = false,
    selectedRowKeys = [],
    onSelectionChange,
    getRowKey = (record) => record.id,
    shouldShowView,
    shouldShowEdit,
    shouldShowDelete,
    shouldShowRevoke,
    defaultSort,
    serverSidePagination = false,
    emptyText,
}: DataTableProps<T>) => {
    // Resolve density
    const resolvedDensity = density || (compact || size === 'small' ? 'compact' : size === 'large' ? 'comfortable' : 'default');

    const [sortState, setSortState] = React.useState<SortState>({
        key: defaultSort?.key || null,
        direction: defaultSort?.direction || null,
    });

    const [filters, setFilters] = React.useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = React.useState('');
    const [activeFilters, setActiveFilters] = React.useState<Record<string, any>>({});
    const [internalSelectedKeys, setInternalSelectedKeys] = React.useState<(string | number)[]>([]);

    const [isFilterOpen, setIsFilterOpen] = React.useState(false);
    const [tempFilters, setTempFilters] = React.useState<Record<string, any>>({});

    React.useEffect(() => {
        if (isFilterOpen) {
            const initialTemp: Record<string, any> = {};
            filterConfig?.forEach(config => {
                if (activeFilters[config.key] !== undefined) {
                    initialTemp[config.key] = activeFilters[config.key];
                }
            });
            setTempFilters(initialTemp);
        }
    }, [isFilterOpen]);

    const currentSelectedKeys = selectedRowKeys.length > 0 ? selectedRowKeys : internalSelectedKeys;

    const handleSort = (columnKey: string) => {
        let newDirection: 'asc' | 'desc' | null = 'asc';

        if (sortState.key === columnKey) {
            if (sortState.direction === 'asc') {
                newDirection = 'desc';
            } else if (sortState.direction === 'desc') {
                newDirection = null;
            }
        }

        setSortState({ key: columnKey, direction: newDirection });
        onSort?.(columnKey, newDirection);
    };

    const handleFilter = (columnKey: string, value: string) => {
        const newFilters = { ...activeFilters };

        if (value === '') {
            delete newFilters[columnKey];
        } else {
            newFilters[columnKey] = value;
        }

        setActiveFilters(newFilters);
        onFilter?.(newFilters);
    };

    const applyTempFilters = () => {
        const nextFilters = { ...activeFilters };
        filterConfig?.forEach(config => {
            delete nextFilters[config.key];
        });
        Object.entries(tempFilters).forEach(([key, val]) => {
            if (val !== undefined && val !== '') {
                nextFilters[key] = val;
            }
        });
        setActiveFilters(nextFilters);
        onFilter?.(nextFilters);
        setIsFilterOpen(false);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        const newFilters = { ...activeFilters };

        if (e.target.value === '') {
            delete newFilters['_search'];
        } else {
            newFilters['_search'] = e.target.value;
        }

        setActiveFilters(newFilters);
        onFilter?.(newFilters);
        onSearch?.(e.target.value);
    };

    const clearAllFilters = () => {
        setActiveFilters({});
        setTempFilters({});
        setSearchQuery('');
        onFilter?.({});
    };

    const getSortIcon = (columnKey: string) => {
        if (sortState.key !== columnKey) {
            return <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />;
        }
        if (sortState.direction === 'asc') {
            return <ChevronUp className="h-3 w-3 text-blue-600" />;
        } else if (sortState.direction === 'desc') {
            return <ChevronDown className="h-3 w-3 text-blue-600" />;
        }
        return <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />;
    };

    const getCellValue = (record: T, column: Column<T>, index: number) => {
        if (column.render) {
            return column.render(
                column.dataIndex ? record[column.dataIndex] : record,
                record,
                index
            );
        }
        return column.dataIndex ? record[column.dataIndex] : '';
    };

    const densityClasses = {
        compact: {
            cell: "h-7 px-2 py-1 text-xs",
            header: "h-7 px-2 py-1 text-xs font-medium",
        },
        default: {
            cell: "h-9 px-3 py-2 text-sm",
            header: "h-9 px-3 py-2 text-sm font-medium",
        },
        comfortable: {
            cell: "h-12 px-4 py-3 text-sm",
            header: "h-12 px-4 py-3 text-sm font-medium",
        },
    };

    const tableClasses = cn(
        "w-full caption-bottom",
        resolvedDensity === 'compact' && "text-xs",
    );

    const rowClasses = cn(
        "border-b border-border transition-colors",
        hoverable && "hover:bg-muted/30",
        striped && "even:bg-muted/20",
        resolvedDensity === 'compact' && "border-b-muted/50"
    );

    const headerClasses = cn(
        "bg-muted/40 border-b p-4 border-border",
        sticky && "sticky top-0 z-10"
    );

    const visibleColumns = React.useMemo(() => columns.filter(c => !c.hidden), [columns]);

    const filteredData = React.useMemo(() => {
        let result = Array.isArray(data) ? [...data] : [];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter((item) => {
                if (searchKey) {
                    const value = item[searchKey];
                    return value != null && String(value).toLowerCase().includes(q);
                }
                return visibleColumns.some((col) => {
                    if (!col.dataIndex) return false;
                    const value = item[col.dataIndex];
                    if (value == null) return false;
                    if (typeof value === 'object') {
                        return Object.values(value).some(
                            (v) => v != null && String(v).toLowerCase().includes(q)
                        );
                    }
                    return String(value).toLowerCase().includes(q);
                });
            });
        }

        const columnFilters = Object.entries(activeFilters).filter(([k]) => k !== '_search');
        if (columnFilters.length > 0) {
            result = result.filter((item) => {
                return columnFilters.every(([colKey, filterValue]) => {
                    if (!filterValue) return true;

                    const col = visibleColumns.find((c) => c.key === colKey);
                    const dataKey = col?.dataIndex || colKey;
                    const cellValue = item[dataKey];
                    if (cellValue == null) return false;
                    return String(cellValue).toLowerCase() === String(filterValue).toLowerCase();
                });
            });
        }

        if (sortState.key && sortState.direction) {
            const col = visibleColumns.find((c) => c.key === sortState.key);
            const dataKey = col?.dataIndex || sortState.key;
            result.sort((a, b) => {
                const aVal = a[dataKey];
                const bVal = b[dataKey];
                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;
                const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
                return sortState.direction === 'asc' ? comparison : -comparison;
            });
        }

        return result;
    }, [data, searchQuery, searchKey, activeFilters, sortState, visibleColumns]);

    const currentData = React.useMemo(() => {
        if (!pagination || serverSidePagination) return filteredData;
        const start = (pagination.current - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        return filteredData.slice(start, end);
    }, [filteredData, pagination, serverSidePagination]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allKeys = currentData.map(record => getRowKey(record));
            if (selectedRowKeys.length === 0) {
                setInternalSelectedKeys(allKeys);
            }
            onSelectionChange?.(allKeys, currentData);
        } else {
            if (selectedRowKeys.length === 0) {
                setInternalSelectedKeys([]);
            }
            onSelectionChange?.([], []);
        }
    };

    const handleSelectRow = (record: T, checked: boolean) => {
        const key = getRowKey(record);
        let newSelectedKeys: (string | number)[];

        if (checked) {
            newSelectedKeys = [...currentSelectedKeys, key];
        } else {
            newSelectedKeys = currentSelectedKeys.filter(k => k !== key);
        }

        if (selectedRowKeys.length === 0) {
            setInternalSelectedKeys(newSelectedKeys);
        }

        const selectedRows = currentData.filter(row => newSelectedKeys.includes(getRowKey(row)));
        onSelectionChange?.(newSelectedKeys, selectedRows);
    };

    const isAllSelected = currentData.length > 0 && currentData.every(record =>
        currentSelectedKeys.includes(getRowKey(record))
    );

    const hasActiveFilters = Object.keys(activeFilters).length > 0;

    const finalColumns = React.useMemo(() => {
        let cols = [...visibleColumns];

        const selectionColumn: Column<T> = {
            key: 'selection',
            title: '',
            width: '50px',
            align: 'center',
            render: (_, record) => (
                <Checkbox
                    checked={currentSelectedKeys.includes(getRowKey(record))}
                    onCheckedChange={(checked) => handleSelectRow(record, checked as boolean)}
                    className="h-4 w-4"
                />
            ),
        };

        const actionsColumn: Column<T> = {
            key: 'actions',
            title: 'Actions',
            width: '150px',
            align: 'center',
            render: (_, record) => {
                const showView = shouldShowView ? shouldShowView(record) : (onView !== undefined);
                const showEdit = shouldShowEdit ? shouldShowEdit(record) : (onEdit !== undefined);
                const showDelete = shouldShowDelete ? shouldShowDelete(record) : (onDelete !== undefined);
                const showRevoke = shouldShowRevoke ? shouldShowRevoke(record) : (onRevoke !== undefined);

                return (
                    <div className="flex items-center justify-center gap-1">
                        {showView && onView && (
                            <Button size="sm" variant="ghost" onClick={() => onView(record)} className="h-6 w-6 p-0 hover:bg-blue-100" title="View Details">
                                <Eye className="h-3 w-3 text-blue-600" />
                            </Button>
                        )}
                        {showEdit && onEdit && (
                            <Button size="sm" variant="ghost" onClick={() => onEdit(record)} className="h-6 w-6 p-0 hover:bg-green-100" title="Edit Request">
                                <Edit className="h-3 w-3 text-green-600" />
                            </Button>
                        )}
                        {showRevoke && onRevoke && (
                            <Button size="sm" variant="ghost" onClick={() => onRevoke(record)} className="h-6 w-6 p-0 hover:bg-orange-100" title="Revoke">
                                <Ban className="h-3 w-3 text-orange-600" />
                            </Button>
                        )}
                        {showDelete && onDelete && (
                            <Button size="sm" variant="ghost" onClick={() => onDelete(record)} className="h-6 w-6 p-0 hover:bg-red-100" title="Cancel Request">
                                <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                        )}
                    </div>
                );
            },
        };

        if (rowSelection) {
            cols = [selectionColumn, ...cols];
        }

        if (showActions) {
            cols = [...cols, actionsColumn];
        }

        return cols;
    }, [visibleColumns, rowSelection, showActions, onView, onEdit, onDelete, onRevoke, shouldShowView, shouldShowEdit, shouldShowDelete, shouldShowRevoke, currentSelectedKeys]);

    const hasHeaderContent = title || description || headerStats || searchable || filterConfig || headerActions || showAdd || showImport || showExport || actions;

    return (
        <CustomCard className={className}>
            {hasHeaderContent && (
                <CustomCardHeader className="p-3 border-b border-border space-y-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap xl:flex-nowrap">
                        <div className="flex items-center gap-6 flex-wrap min-w-0">
                            <div className="min-w-0 flex flex-col justify-center">
                                <div className="flex items-center gap-3 flex-wrap">
                                    {title && (
                                        <CustomCardTitle className="text-sm flex items-center gap-2 font-bold">
                                            {title}
                                            {loading && <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>}
                                        </CustomCardTitle>
                                    )}
                                    {headerStats && headerStats.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            {headerStats.map((stat, i) => (
                                                <Badge key={i} variant="outline" className={cn(
                                                    "text-[10px] px-1.5 py-0 h-5 flex items-center gap-1 border whitespace-nowrap",
                                                    stat.color === 'primary' && "bg-primary/5 text-primary border-primary/20",
                                                    stat.color === 'success' && "bg-green-50 text-green-700 border-green-200",
                                                    stat.color === 'warning' && "bg-amber-50 text-amber-700 border-amber-200",
                                                    stat.color === 'danger' && "bg-red-50 text-red-700 border-red-200",
                                                )}>
                                                    {stat.icon && <span className="[&>svg]:w-3 [&>svg]:h-3 text-current opacity-70">{stat.icon}</span>}
                                                    <span className="font-medium opacity-80">{stat.label}:</span>
                                                    <span className="font-bold">{stat.value}</span>
                                                    {stat.trend && (
                                                        <span className={cn(
                                                            "flex items-center ml-0.5",
                                                            stat.trend === 'up' && "text-green-600",
                                                            stat.trend === 'down' && "text-red-600",
                                                        )}>
                                                            {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→'}
                                                            {stat.trendValue}
                                                        </span>
                                                    )}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
                            </div>

                            {searchable && searchAlign === 'left' && (
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="h-8 w-full md:w-64 pl-8 text-xs bg-background"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-end">
                            {searchable && searchAlign !== 'left' && (
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="h-8 w-full md:w-64 pl-8 text-xs bg-background"
                                    />
                                </div>
                            )}

                            {filterConfig && filterConfig.length > 0 && (
                                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant={hasActiveFilters ? "default" : "outline"} size="sm" className="h-8 px-3 text-xs gap-1.5">
                                            <Filter className="h-3.5 w-3.5" />
                                            Filters
                                            {Object.keys(activeFilters).filter(k => k !== '_search').length > 0 && (
                                                <Badge variant="secondary" className="ml-1 px-1 h-4 min-w-4 justify-center text-[10px] bg-white/20 hover:bg-white/30 text-current">
                                                    {Object.keys(activeFilters).filter(k => k !== '_search').length}
                                                </Badge>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-4" align="end">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-sm">Filters</h4>
                                                {Object.keys(tempFilters).length > 0 && (
                                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setTempFilters({})}>
                                                        Reset
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                {filterConfig.map(config => (
                                                    <div key={config.key} className="space-y-1.5">
                                                        <label className="text-xs font-medium text-muted-foreground">{config.label}</label>
                                                        {config.type === 'select' ? (
                                                            <Select
                                                                value={tempFilters[config.key] || '_all'}
                                                                onValueChange={(val) => setTempFilters(prev => ({ ...prev, [config.key]: val === '_all' ? undefined : val }))}
                                                            >
                                                                <SelectTrigger className="h-8 text-xs">
                                                                    <SelectValue placeholder={config.placeholder || "Select option..."} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="_all">All Options</SelectItem>
                                                                    {config.options?.map(opt => (
                                                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <Input
                                                                className="h-8 text-xs"
                                                                placeholder={config.placeholder}
                                                                value={tempFilters[config.key] || ''}
                                                                onChange={(e) => setTempFilters(prev => ({ ...prev, [config.key]: e.target.value }))}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <Button className="w-full h-8 text-xs" onClick={applyTempFilters}>
                                                Apply Filters
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}

                            {headerActions?.map((action) => (
                                (!('show' in action) || action.show) && (
                                    <Button
                                        key={action.key}
                                        variant={action.variant || "default"}
                                        size="sm"
                                        onClick={action.onClick}
                                        disabled={action.disabled}
                                        className={cn("h-8 px-3 text-xs gap-1.5", action.className)}
                                    >
                                        {action.icon}
                                        {action.label}
                                    </Button>
                                )
                            ))}

                            {/* Legacy Actions (kept for backward compatibility) */}
                            {showImport && (
                                <Button variant="outline" size="sm" onClick={onImport} className="h-8 px-3 text-xs gap-1.5">
                                    <Upload className="h-3.5 w-3.5" />
                                    Import
                                </Button>
                            )}
                            {showExport && (
                                <Button variant="outline" size="sm" onClick={onExport} className="h-8 px-3 text-xs gap-1.5 bg-green-600 text-white hover:bg-green-700">
                                    <Download className="h-3.5 w-3.5" />
                                    Export
                                </Button>
                            )}
                            {showAdd && (
                                <Button size="sm" onClick={onAdd} className="h-8 px-3 text-xs gap-1.5">
                                    <Plus className="h-3.5 w-3.5" />
                                    Add
                                </Button>
                            )}
                            {actions}
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-xs text-muted-foreground mr-1">Active Filters:</span>
                            {Object.entries(activeFilters).map(([key, value]) => {
                                if (!value) return null;
                                let displayLabel = key;
                                let displayValue = String(value);

                                if (key === '_search') {
                                    displayLabel = 'Search';
                                } else if (filterConfig) {
                                    const config = filterConfig.find(c => c.key === key);
                                    if (config) {
                                        displayLabel = config.label;
                                        if (config.type === 'select') {
                                            const opt = config.options?.find(o => o.value === value);
                                            if (opt) displayValue = opt.label;
                                        }
                                    }
                                }

                                return (
                                    <Badge key={key} variant="secondary" className="text-xs px-2 py-0.5 rounded-md gap-1 bg-muted/60">
                                        <span className="text-muted-foreground">{displayLabel}:</span>
                                        <span className="font-medium">{displayValue}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleFilter(key, '')}
                                            className="h-4 w-4 p-0 ml-0.5 hover:bg-background rounded-full"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                );
                            })}
                            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-5 px-2 text-[10px] text-muted-foreground">
                                Clear all
                            </Button>
                        </div>
                    )}
                </CustomCardHeader>
            )}

            <CustomCardBody className="p-0">
                <ScrollArea className="max-h-[calc(100vh-250px)] relative">
                    <CustomTable className={tableClasses} bordered={bordered}>
                        <CustomTableHeader className={headerClasses}>
                            <CustomTableRow>
                                {finalColumns.map((column) => (
                                    <CustomTableHead
                                        key={column.key}
                                        className={cn(
                                            densityClasses[resolvedDensity].header,
                                            column.align && `text-${column.align}`,
                                            (column.sortable || column.filterable) && "cursor-pointer select-none hover:bg-muted/50 transition-colors",
                                            sortState.key === column.key && "bg-muted/50",
                                            column.className
                                        )}
                                        style={{
                                            width: column.width,
                                            minWidth: column.minWidth,
                                            maxWidth: column.maxWidth
                                        }}
                                        title={column.description}
                                    >
                                        {column.key === 'selection' ? (
                                            <Checkbox
                                                checked={isAllSelected}
                                                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                                className="h-4 w-4"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-1.5" onClick={() => column.sortable && handleSort(column.key)}>
                                                <span className={cn("truncate flex-1", column.description && "underline decoration-dashed underline-offset-4 decoration-muted-foreground/50")}>
                                                    {column.title}
                                                </span>

                                                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                                                    {column.sortable && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSort(column.key); }}
                                                            className={cn("rounded p-0.5 transition-colors", sortState.key === column.key ? "bg-muted text-foreground" : "hover:bg-muted/80 text-muted-foreground")}
                                                        >
                                                            {getSortIcon(column.key)}
                                                        </button>
                                                    )}

                                                    {/* Legacy column filters */}
                                                    {column.filterable && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className="hover:bg-muted/80 rounded p-0.5 transition-colors">
                                                                    <Filter className={cn(
                                                                        "h-3 w-3",
                                                                        activeFilters[column.key] ? "text-blue-600 fill-blue-600/20" : "text-muted-foreground"
                                                                    )} />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <div className="p-2">
                                                                    <Input
                                                                        placeholder={`Filter ${column.title}...`}
                                                                        value={filters[column.key] || ''}
                                                                        onChange={(e) => setFilters({ ...filters, [column.key]: e.target.value })}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') handleFilter(column.key, filters[column.key] || '');
                                                                        }}
                                                                        className="h-8 text-xs mb-2"
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <Button size="sm" onClick={() => handleFilter(column.key, filters[column.key] || '')} className="h-7 px-3 text-xs flex-1">
                                                                            Apply
                                                                        </Button>
                                                                        <Button size="sm" variant="outline" onClick={() => { setFilters({ ...filters, [column.key]: '' }); handleFilter(column.key, ''); }} className="h-7 px-3 text-xs">
                                                                            Clear
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                {column.filterOptions && (
                                                                    <>
                                                                        <div className="border-t border-border my-1" />
                                                                        {column.filterOptions.map((option) => (
                                                                            <DropdownMenuItem
                                                                                key={option.value}
                                                                                onClick={() => handleFilter(column.key, option.value)}
                                                                                className="text-xs cursor-pointer"
                                                                            >
                                                                                {option.label}
                                                                            </DropdownMenuItem>
                                                                        ))}
                                                                    </>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </CustomTableHead>
                                ))}
                            </CustomTableRow>
                        </CustomTableHeader>

                        <CustomTableBody>
                            {loading && currentData.length === 0 ? (
                                Array.from({ length: pagination?.pageSize || 5 }).map((_, index) => (
                                    <CustomTableRow key={index} className={rowClasses}>
                                        {finalColumns.map((column) => (
                                            <CustomTableCell key={column.key} className={cn(densityClasses[resolvedDensity].cell, column.align && `text-${column.align}`)}>
                                                <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
                                            </CustomTableCell>
                                        ))}
                                    </CustomTableRow>
                                ))
                            ) : currentData.length > 0 ? (
                                currentData.map((record, index) => (
                                    <CustomTableRow key={index} className={rowClasses}>
                                        {finalColumns.map((column) => (
                                            <CustomTableCell
                                                key={column.key}
                                                className={cn(
                                                    densityClasses[resolvedDensity].cell,
                                                    column.align && `text-${column.align}`,
                                                    column.ellipsis && "truncate",
                                                    sortState.key === column.key && "bg-muted/10",
                                                    column.className
                                                )}
                                                style={{ maxWidth: column.maxWidth }}
                                                title={column.ellipsis ? String(getCellValue(record, column, index) || '') : undefined}
                                            >
                                                {getCellValue(record, column, index)}
                                            </CustomTableCell>
                                        ))}
                                    </CustomTableRow>
                                ))
                            ) : (
                                <CustomTableRow>
                                    <CustomTableCell colSpan={finalColumns.length} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
                                                <Search className="h-5 w-5 text-muted-foreground/50" />
                                            </div>
                                            <span className="text-sm font-medium">{emptyText || "No data available"}</span>
                                            {hasActiveFilters && (
                                                <span className="text-xs text-muted-foreground max-w-[200px] text-center">
                                                    Try adjusting your filters or search query
                                                </span>
                                            )}
                                        </div>
                                    </CustomTableCell>
                                </CustomTableRow>
                            )}
                        </CustomTableBody>
                    </CustomTable>
                </ScrollArea>
            </CustomCardBody>

            {pagination && (() => {
                const total = pagination.total || filteredData.length;
                const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
                const current = pagination.current;

                // Calculate visible page numbers
                const getVisiblePages = () => {
                    const pages = [];
                    if (totalPages <= 5) {
                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                        if (current <= 3) {
                            pages.push(1, 2, 3, 4, '...', totalPages);
                        } else if (current >= totalPages - 2) {
                            pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                        } else {
                            pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
                        }
                    }
                    return pages;
                };

                return (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-border bg-muted/10 gap-4">
                        <div className="flex items-center text-xs text-muted-foreground flex-wrap gap-x-4 gap-y-2">
                            <div>
                                Showing <span className="font-medium text-foreground">{total === 0 ? 0 : Math.min((current - 1) * pagination.pageSize + 1, total)}</span> to <span className="font-medium text-foreground">{Math.min(current * pagination.pageSize, total)}</span> of <span className="font-medium text-foreground">{total}</span> entries
                            </div>
                            {selectedRowKeys.length > 0 && (
                                <div className="text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                                    {selectedRowKeys.length} selected
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap justify-center">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">Rows per page:</span>
                                <Select
                                    value={pagination.pageSize.toString()}
                                    onValueChange={(value) => pagination.onChange(1, parseInt(value))}
                                >
                                    <SelectTrigger className="h-7 w-[65px] text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[10, 15, 20, 30, 40, 50, 100].map(size => (
                                            <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => pagination.onChange(current - 1, pagination.pageSize)}
                                    disabled={current <= 1}
                                    className="h-7 w-7"
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronUp className="h-4 w-4 -rotate-90" />
                                </Button>

                                <div className="flex items-center gap-1 hidden sm:flex">
                                    {getVisiblePages().map((page, i) => (
                                        typeof page === 'number' ? (
                                            <Button
                                                key={i}
                                                variant={current === page ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => pagination.onChange(page, pagination.pageSize)}
                                                className={cn("h-7 w-7 p-0 text-xs", current === page && "font-bold")}
                                            >
                                                {page}
                                            </Button>
                                        ) : (
                                            <span key={i} className="px-1 text-muted-foreground text-xs">...</span>
                                        )
                                    ))}
                                </div>

                                <span className="text-xs font-medium sm:hidden px-2">
                                    Page {current} of {totalPages}
                                </span>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => pagination.onChange(current + 1, pagination.pageSize)}
                                    disabled={current >= totalPages}
                                    className="h-7 w-7"
                                >
                                    <span className="sr-only">Next</span>
                                    <ChevronDown className="h-4 w-4 -rotate-90" />
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </CustomCard>
    );
};