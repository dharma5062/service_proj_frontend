import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, Filter, X, Plus, Download, Upload, Eye, Edit, Trash2, Ban } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
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
    onFilter?: (filters: Record<string, string>) => void;
    className?: string;
    size?: 'small' | 'medium' | 'large';
    bordered?: boolean;
    hoverable?: boolean;
    striped?: boolean;
    sticky?: boolean;
    searchable?: boolean;
    searchKey?: string;
    title?: string;
    actions?: React.ReactNode;
    compact?: boolean;
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
    // Selection props
    rowSelection?: boolean;
    selectedRowKeys?: (string | number)[];
    onSelectionChange?: (selectedKeys: (string | number)[], selectedRows: T[]) => void;
    getRowKey?: (record: T) => string | number;
    // Conditional action props
    shouldShowView?: (record: T) => boolean;
    shouldShowEdit?: (record: T) => boolean;
    shouldShowDelete?: (record: T) => boolean;
    shouldShowRevoke?: (record: T) => boolean;
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
    size = 'small',
    bordered = true,
    hoverable = true,
    striped = false,
    sticky = false,
    searchable = true,
    searchKey,
    title,
    actions,
    compact = true,
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
    rowSelection = false,
    selectedRowKeys = [],
    onSelectionChange,
    getRowKey = (record) => record.id,
    shouldShowView,
    shouldShowEdit,
    shouldShowDelete,
    shouldShowRevoke,
}: DataTableProps<T>) => {
    const [sortState, setSortState] = React.useState<SortState>({
        key: null,
        direction: null,
    });


    const [filters, setFilters] = React.useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = React.useState('');
    const [activeFilters, setActiveFilters] = React.useState<Record<string, string>>({});
    const [internalSelectedKeys, setInternalSelectedKeys] = React.useState<(string | number)[]>([]);


    // Use the external selectedRowKeys if provided, otherwise use internal state
    const currentSelectedKeys = selectedRowKeys.length > 0 ? selectedRowKeys : internalSelectedKeys;


    const handleSort = (columnKey: string) => {
        if (!onSort) return;


        let newDirection: 'asc' | 'desc' | null = 'asc';


        if (sortState.key === columnKey) {
            if (sortState.direction === 'asc') {
                newDirection = 'desc';
            } else if (sortState.direction === 'desc') {
                newDirection = null;
            }
        }


        setSortState({ key: columnKey, direction: newDirection });
        onSort(columnKey, newDirection);
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
    };


    const clearAllFilters = () => {
        setActiveFilters({});
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


    const sizeClasses = {
        small: {
            cell: compact ? "h-6 px-2 py-1 text-xs" : "h-8 px-2 py-1 text-sm",
            header: compact ? "h-6 px-2 py-1 text-xs font-medium" : "h-8 px-2 py-1 text-sm font-medium",
        },
        medium: {
            cell: "h-8 px-3 py-2 text-sm",
            header: "h-8 px-3 py-2 text-sm font-medium",
        },
        large: {
            cell: "h-12 px-4 py-3 text-sm",
            header: "h-12 px-4 py-3 text-sm font-medium",
        },
    };


    const tableClasses = cn(
        "w-full caption-bottom",
        compact && "text-xs",
    );


    const rowClasses = cn(
        "border-b border-border transition-colors",
        hoverable && "hover:bg-muted/30",
        striped && "even:bg-muted/20",
        compact && "border-b-muted/50"
    );


    const headerClasses = cn(
        "bg-muted/40 border-b p-4 border-border",
        sticky && "sticky top-0 z-10"
    );


    const filteredData = React.useMemo(() => {
        if (!searchKey || !searchQuery) return data;
        return data.filter((item) => {
            const value = item[searchKey];
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [data, searchKey, searchQuery]);

    const currentData = React.useMemo(() => {
        if (!pagination) return filteredData;


        // If data length is already within pageSize limit, assume server-side pagination
        // This means the API already returned only the current page's data
        if (filteredData.length <= pagination.pageSize) {
            return filteredData;
        }


        // Otherwise, do client-side pagination
        const start = (pagination.current - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        return filteredData.slice(start, end);
    }, [filteredData, pagination]);


    // Selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allKeys = currentData.map(record => getRowKey(record));
            // Update internal state only if not controlled
            if (selectedRowKeys.length === 0) {
                setInternalSelectedKeys(allKeys);
            }
            onSelectionChange?.(allKeys, currentData);
        } else {
            // Update internal state only if not controlled
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


        // Update internal state only if not controlled
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


    // Add selection and actions columns to columns list
    const finalColumns = React.useMemo(() => {
        let cols = [...columns];


        // Create selection column
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


        // Create actions column with conditional visibility
        const actionsColumn: Column<T> = {
            key: 'actions',
            title: 'Actions',
            width: '150px',
            align: 'center',
            render: (_, record) => {
                // Use conditional functions if provided, otherwise use default logic
                const showView = shouldShowView ? shouldShowView(record) : (onView !== undefined);
                const showEdit = shouldShowEdit ? shouldShowEdit(record) : (onEdit !== undefined);
                const showDelete = shouldShowDelete ? shouldShowDelete(record) : (onDelete !== undefined);
                const showRevoke = shouldShowRevoke ? shouldShowRevoke(record) : (onRevoke !== undefined);


                return (
                    <div className="flex items-center justify-center gap-1">
                        {showView && onView && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onView(record)}
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                                title="View Details"
                            >
                                <Eye className="h-3 w-3 text-blue-600" />
                            </Button>
                        )}
                        {showEdit && onEdit && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEdit(record)}
                                className="h-6 w-6 p-0 hover:bg-green-100"
                                title="Edit Request"
                            >
                                <Edit className="h-3 w-3 text-green-600" />
                            </Button>
                        )}
                        {showRevoke && onRevoke && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onRevoke(record)}
                                className="h-6 w-6 p-0 hover:bg-orange-100"
                                title="Revoke"
                            >
                                <Ban className="h-3 w-3 text-orange-600" />
                            </Button>
                        )}
                        {showDelete && onDelete && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDelete(record)}
                                className="h-6 w-6 p-0 hover:bg-red-100"
                                title="Cancel Request"
                            >
                                <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                        )}
                    </div>
                );
            },
        };


        // Add selection column if rowSelection is enabled
        if (rowSelection) {
            cols = [selectionColumn, ...cols];
        }


        // Add actions column if showActions is enabled
        if (showActions) {
            cols = [...cols, actionsColumn];
        }


        return cols;
    }, [columns, rowSelection, showActions, onView, onEdit, onDelete, onRevoke, shouldShowView, shouldShowEdit, shouldShowDelete, shouldShowRevoke]);


    if (loading) {
        return (
            <CustomCard className={className}>
                {(title || searchable || showAdd || showImport || showExport) && (
                    <CustomCardHeader className="p-4">
                        {title && <CustomCardTitle>{title}</CustomCardTitle>}
                    </CustomCardHeader>
                )}
                <CustomCardBody className="p-0">
                    <ScrollArea className="h-[calc(100vh-250px)]">


                        <CustomTable className={tableClasses} bordered={bordered}>
                            <CustomTableHeader className={headerClasses}>


                                <CustomTableRow>
                                    {finalColumns.map((column) => (
                                        <CustomTableHead
                                            key={column.key}
                                            className={cn(
                                                sizeClasses[size].header,
                                                column.align && `text-${column.align}`,
                                                column.className
                                            )}
                                            style={column.width ? { width: column.width } : undefined}
                                        >
                                            {column.title}
                                        </CustomTableHead>
                                    ))}
                                </CustomTableRow>


                            </CustomTableHeader>
                            <CustomTableBody>
                                {Array.from({ length: pagination?.pageSize || 5 }).map((_, index) => (
                                    <CustomTableRow key={index} className={rowClasses}>
                                        {finalColumns.map((column) => (
                                            <CustomTableCell
                                                key={column.key}
                                                className={cn(
                                                    sizeClasses[size].cell,
                                                    column.align && `text-${column.align}`
                                                )}
                                            >
                                                <div className="h-3 bg-muted rounded animate-pulse" />
                                            </CustomTableCell>
                                        ))}
                                    </CustomTableRow>
                                ))}
                            </CustomTableBody>
                        </CustomTable>
                    </ScrollArea>
                </CustomCardBody>
            </CustomCard>
        );
    }


    return (
        <CustomCard className={className}>
            {/* Header with title, search, and actions */}
            {(title || searchable || actions || showAdd || showImport || showExport) && (
                <CustomCardHeader className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            {title && <CustomCardTitle>{title}</CustomCardTitle>}
                        </div>


                        <div className="flex items-center gap-2">
                            {searchable && (
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="h-8 w-48 pl-7 text-xs"
                                    />
                                </div>
                            )}


                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearAllFilters}
                                    className="h-8 px-2 text-xs"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Clear
                                </Button>
                            )}


                            {/* Import Button */}
                            {showImport && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onImport}
                                    className="h-8 px-3 text-xs"
                                >
                                    <Upload className="h-3 w-3 mr-1" />
                                    Import
                                </Button>
                            )}


                            {/* Export Button */}
                            {showExport && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onExport}
                                    className="h-8 px-3 text-xs bg-green-600 text-white hover:bg-green-700 hover:text-white focus:ring-2 focus:ring-green-600"
                                >
                                    <Download className="h-3 w-3 mr-1" />
                                    Export
                                </Button>
                            )}


                            {/* Add Button */}
                            {showAdd && (
                                <Button
                                    size="sm"
                                    onClick={onAdd}
                                    className="h-8 px-3 text-xs"
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                </Button>
                            )}


                            {actions}
                        </div>
                    </div>


                    {/* Active filters display */}
                    {hasActiveFilters && (
                        <div className="flex items-center gap-1 mt-2">
                            <span className="text-xs text-muted-foreground">Filters:</span>
                            {Object.entries(activeFilters).map(([key, value]) => (
                                <Badge
                                    key={key}
                                    variant="secondary"
                                    className="text-xs px-2 py-0.5"
                                >
                                    {key === '_search' ? 'Search' : key}: {value}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleFilter(key, '')}
                                        className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                                    >
                                        <X className="h-2 w-2" />
                                    </Button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </CustomCardHeader>
            )}


            <CustomCardBody className="p-2">
                <ScrollArea className="h-[calc(95vh-250px)]">


                    <CustomTable className={tableClasses} bordered={bordered}>


                        <CustomTableHeader className={headerClasses}>
                            <CustomTableRow>
                                {finalColumns.map((column) => (
                                    <CustomTableHead
                                        key={column.key}
                                        className={cn(
                                            sizeClasses[size].header,
                                            column.align && `text-${column.align}`,
                                            (column.sortable || column.filterable) && "cursor-pointer select-none",
                                            column.className
                                        )}
                                        style={column.width ? { width: column.width } : undefined}
                                    >
                                        {column.key === 'selection' ? (
                                            <Checkbox
                                                checked={isAllSelected}
                                                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                                className="h-4 w-4"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <span
                                                    className="truncate flex-1"
                                                    onClick={() => column.sortable && handleSort(column.key)}
                                                >
                                                    {column.title}
                                                </span>


                                                <div className="flex items-center gap-0.5">
                                                    {column.sortable && (
                                                        <button
                                                            onClick={() => handleSort(column.key)}
                                                            className="hover:bg-muted/50 rounded p-0.5"
                                                        >
                                                            {getSortIcon(column.key)}
                                                        </button>
                                                    )}


                                                    {column.filterable && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className="hover:bg-muted/50 rounded p-0.5">
                                                                    <Filter className={cn(
                                                                        "h-3 w-3",
                                                                        activeFilters[column.key] ? "text-blue-600" : "text-muted-foreground"
                                                                    )} />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <div className="p-2">
                                                                    <Input
                                                                        placeholder={`Filter ${column.title.toLowerCase()}...`}
                                                                        value={filters[column.key] || ''}
                                                                        onChange={(e) => {
                                                                            setFilters({ ...filters, [column.key]: e.target.value });
                                                                        }}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                handleFilter(column.key, filters[column.key] || '');
                                                                            }
                                                                        }}
                                                                        className="h-7 text-xs"
                                                                    />
                                                                    <div className="flex gap-1 mt-2">
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleFilter(column.key, filters[column.key] || '')}
                                                                            className="h-6 px-2 text-xs flex-1"
                                                                        >
                                                                            Apply
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => {
                                                                                setFilters({ ...filters, [column.key]: '' });
                                                                                handleFilter(column.key, '');
                                                                            }}
                                                                            className="h-6 px-2 text-xs"
                                                                        >
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
                                                                                className="text-xs"
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
                            {currentData.length > 0 ? (
                                currentData.map((record, index) => (
                                    <CustomTableRow key={index} className={rowClasses}>
                                        {finalColumns.map((column) => (
                                            <CustomTableCell
                                                key={column.key}
                                                className={cn(
                                                    sizeClasses[size].cell,
                                                    column.align && `text-${column.align}`,
                                                    column.className
                                                )}
                                            >
                                                {getCellValue(record, column, index)}
                                            </CustomTableCell>
                                        ))}
                                    </CustomTableRow>
                                ))
                            ) : (
                                <CustomTableRow>
                                    <CustomTableCell
                                        colSpan={finalColumns.length}
                                        className="h-16 text-center text-muted-foreground"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="h-6 w-6 text-muted-foreground/50" />
                                            <span className="text-sm">No data available</span>
                                        </div>
                                    </CustomTableCell>
                                </CustomTableRow>
                            )}
                        </CustomTableBody>
                    </CustomTable>
                </ScrollArea>


            </CustomCardBody>


            {
                pagination && (
                    <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/20">
                        <div className="flex items-center gap-4">
                            <div className="text-xs text-muted-foreground">
                                Showing {Math.min((pagination.current - 1) * pagination.pageSize + 1, pagination.total)} to{' '}
                                {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
                                {pagination.total} entries
                            </div>


                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Show:</span>
                                <Select
                                    value={pagination.pageSize.toString()}
                                    onValueChange={(value) => {
                                        pagination.onChange(1, parseInt(value));
                                    }}
                                >
                                    <SelectTrigger className="h-6 w-16 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="15">15</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="30">30</SelectItem>
                                        <SelectItem value="40">40</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-xs text-muted-foreground">entries</span>
                            </div>
                        </div>


                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
                                disabled={pagination.current <= 1}
                                className="h-6 px-2 text-xs"
                            >
                                Previous
                            </Button>
                            <div className="text-xs text-muted-foreground px-2">
                                Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
                                disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                                className="h-6 px-2 text-xs"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )
            }
        </CustomCard >
    );
};