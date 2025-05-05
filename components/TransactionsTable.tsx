// FILE: components/TransactionsTable.tsx
'use client';
import React, { useEffect, useState, useMemo } from 'react';
// ... (keep existing imports: ColumnDef, flexRender, etc.)
import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead // Import TableHead
} from '@/components/ui/table';
import { Transaction } from '@/types';
import { cn, formatAmount } from '@/lib/utils';
import dayjs from 'dayjs';
import { Skeleton } from '@/components/ui/skeleton'; // Use Shadcn Skeleton
import { useTransactionStore } from '@/components/stores/transaction-store'; // Use the consolidated store
import CategoryCell from '@/components/category-cell';
import { getMainColor } from '@/lib/colourUtils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; // Import ScrollArea
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from '@tanstack/react-table';

// Custom hook for bank logo color caching
function useBankLogoColor(bankLogoUrl?: string): string | null {
    const [color, setColor] = useState<string | null>(null);

    useEffect(() => {
        if (!bankLogoUrl) {
            setColor('#888888'); // Default color if no logo
            return;
        }

        let isMounted = true;
        // Simple in-memory cache for colors
        const colorCache = (window as any).__bankLogoColorCache || {};
        (window as any).__bankLogoColorCache = colorCache;

        if (colorCache[bankLogoUrl]) {
            setColor(colorCache[bankLogoUrl]);
            return;
        }

        getMainColor(bankLogoUrl)
            .then(mainColor => {
                if (isMounted) {
                    colorCache[bankLogoUrl] = mainColor;
                    setColor(mainColor);
                }
            })
            .catch(err => {
                console.error(`Failed to get main color for ${bankLogoUrl}:`, err);
                if (isMounted) setColor('#888888'); // Default on error
            });

        return () => { isMounted = false; };
    }, [bankLogoUrl]);

    return color;
}

// Component for Bank Filter Dropdown
function BankFilterDropdown({ column }: { column: any }) {
    const uniqueBanks = useMemo(() => {
       const banks = Array.from(column.getFacetedUniqueValues().keys()).sort() as string[];
       return banks;
    }, [column]); // Dependency array was missing

    const selectedBanks = (column.getFilterValue() as string[]) || [];

    const toggleBank = (bank: string) => {
        const newSelection = selectedBanks.includes(bank)
            ? selectedBanks.filter(b => b !== bank)
            : [...selectedBanks, bank];
        column.setFilterValue(newSelection.length > 0 ? newSelection : undefined);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 lg:px-3">
                    Bank
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => column.setFilterValue(undefined)}>
                   Show All Banks
                </DropdownMenuItem>
                 <DropdownMenuSeparator />
                {uniqueBanks.map((bank) => (
                    <DropdownMenuCheckboxItem
                        key={bank}
                        checked={selectedBanks.includes(bank)}
                        onCheckedChange={() => toggleBank(bank)}
                    >
                        {/* Optionally format bank name here if needed */}
                        {bank}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Component for Bank Cell rendering
function BankCell({ row }: { row: any }) {
    const bankName = row.getValue('Bank') as string || 'Unknown';
    // Basic formatting, adjust as needed
    const formattedBankName = bankName
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    const bankLogo = row.original?.bankLogo as string | undefined; // Access logo safely
    const color = useBankLogoColor(bankLogo);

    const cellStyle = {
        color: color || 'inherit', // Fallback color
        borderColor: color || 'currentColor',
        borderWidth: '1px',
        borderStyle: 'solid',
        backgroundColor: `${color}1A` // Use color with low opacity for background
    };

    return (
        <div className="flex items-center space-x-2">
            {bankLogo && (
                <img src={bankLogo} alt={`${formattedBankName} logo`} className="h-5 w-5 rounded-full object-contain" />
            )}
            <span
                className={cn(
                    'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                )}
                style={cellStyle}
            >
                {formattedBankName}
            </span>
        </div>
    );
}

// Component for Exclude Checkbox Cell
function ExcludeCell({ row }: { row: any }) {
    const [isUpdating, setIsUpdating] = useState(false);
    // Use the current value from the row's original data
    const isChecked = row.original.exclude === true;

    const handleChange = async (value: boolean) => {
        let transactionId = row.original.$id;
        if (!transactionId) {
            console.error("Transaction ID missing for exclusion update.");
            return;
        }
        setIsUpdating(true);

        // Optimistic UI update
        row.original.exclude = value;
        // Trigger table re-render if necessary (depends on how table state is managed)
        // This might require passing down a refresh function or using the store

        try {
            const response = await fetch('/api/excludeTransaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId, exclude: value }),
            });

            if (!response.ok) {
                 console.error('Failed to update transaction exclusion status');
                 // Revert optimistic update on failure
                 row.original.exclude = !value;
                 alert("Failed to update exclusion status. Please try again.");
            } else {
                 console.log(`Transaction ${transactionId} exclusion set to ${value}`);
                 // Optionally: refetch data via store action after successful update
                 // useTransactionStore.getState().fetchTransactions(true); // Example
            }
        } catch (error) {
            console.error('Error updating transaction exclusion:', error);
             // Revert optimistic update on failure
             row.original.exclude = !value;
             alert("An error occurred. Please try again.");
        } finally {
            setIsUpdating(false);
            // Force re-render if needed after async operation completes
            // This depends on your state management setup
        }
    };

    return (
        <Checkbox
            checked={isChecked}
            onCheckedChange={handleChange}
            aria-label="Exclude row"
            disabled={isUpdating}
            className="ml-4"
        />
    );
}

// Define Columns (with improvements)
export const columns: ColumnDef<Transaction>[] = [
    {
        accessorKey: 'Payee',
        id: 'Payee',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="px-2 text-left"
            >
                Payee
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className={'ml-2 font-medium'}>{row.getValue('Payee')}</div>,
        minSize: 150,
    },
    {
        accessorKey: 'amount',
        id: 'Amount',
        header: ({ column }) => (
            <Button
                variant="ghost"
                 size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="px-2 text-right w-full justify-end" // Align header right
            >
                Amount
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const amount = row.original.amount;
            const currency = row.original.currency;
            const displayAmount = formatAmount(amount, currency);
            return (
                <div
                    className={cn(
                      'text-right font-mono font-medium pr-2 whitespace-nowrap', // Align cell right
                      amount < 0 ? 'text-red-600 dark:text-red-500' : 'text-green-600 dark:text-green-500'
                     )}
                >
                    {displayAmount}
                </div>
            );
        },
         minSize: 100,
         sortingFn: 'basic', // Specify basic numeric sorting
    },
    {
        accessorKey: 'bookingDate',
        id: 'Payment Date',
        header: ({ column }) => (
            <Button
                variant="ghost"
                 size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="px-2 text-left"
            >
                Payment Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const bookingDate = row.getValue('Payment Date') as string;
            // Handle potential invalid dates gracefully
            const formattedDate = bookingDate ? dayjs(bookingDate).format('DD MMM YYYY') : 'Invalid Date';
            return <div className="px-2 text-left whitespace-nowrap">{formattedDate}</div>;
        },
        // Ensure sorting works correctly with dates
        sortingFn: (rowA, rowB, columnId) => {
            const dateA = dayjs(rowA.getValue(columnId));
            const dateB = dayjs(rowB.getValue(columnId));
            if (!dateA.isValid()) return 1; // Invalid dates sort last
            if (!dateB.isValid()) return -1;
            // Sort descending by default
            return dateB.unix() - dateA.unix();
        },
        minSize: 120,
    },
    {
        accessorKey: 'category',
        id: 'Category',
        header: () => <div className="text-left px-2">Category</div>, // Simple header
        cell: ({ row }) => {
            const category = row.getValue('Category') as string;
            const onCategoryChange = async (newCategory: string) => {
                let transactionId = row.original.$id;
                if (!transactionId) {
                    console.error("Transaction ID missing for category update.");
                    return;
                }

                // Optimistic UI update
                const oldCategory = row.original.category;
                row.original.category = newCategory;
                // Trigger table state update if necessary

                try {
                    const response = await fetch('/api/updateCategory', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ transactionId, category: newCategory }),
                    });

                    if (!response.ok) {
                        console.error('Failed to update category via API');
                         row.original.category = oldCategory; // Revert on failure
                         alert("Failed to update category. Please try again.");
                    } else {
                         console.log(`Category for ${transactionId} updated to ${newCategory}`);
                         // Optionally refetch data via store
                         // useTransactionStore.getState().fetchTransactions(true);
                    }
                } catch (error) {
                    console.error('Error updating category:', error);
                    row.original.category = oldCategory; // Revert on failure
                    alert("An error occurred while updating category.");
                } finally {
                     // Trigger table state update if necessary
                }
            };
            return (
                <CategoryCell category={category} onCategoryChange={onCategoryChange} />
            );
        },
         minSize: 180,
    },
    {
        accessorKey: 'Bank',
        id: 'Bank',
        header: ({ column }) => <BankFilterDropdown column={column} />,
        cell: BankCell,
        filterFn: 'arrIncludesSome', // Use built-in filter function for arrays
        minSize: 150,
    },
    {
        accessorKey: 'Description',
        id: 'Description',
        header: () => <div className="text-left px-2">Description</div>,
        cell: ({ row }) => {
            const description: string = row.getValue('Description') || '-';
            // Truncate long descriptions with tooltip potentially
            return (
                <div className="px-2 text-left text-xs text-muted-foreground truncate max-w-xs" title={description}>
                    {description}
                </div>
            );
        },
         minSize: 200,
    },
    {
        accessorKey: 'exclude', // Use the actual data key
        id: 'Exclude',
        header: () => <div className="text-center">Exclude?</div>, // Centered header
        cell: ExcludeCell,
        enableSorting: false,
        enableHiding: true, // Allow hiding this column
        minSize: 80,
    },
];

// Skeleton Loader for the table
const TableSkeleton = () => (
    <div className="w-full space-y-3 mt-8 px-4">
        {/* Skeleton Header */}
        <div className="flex items-center justify-between py-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-24" />
        </div>
         {/* Skeleton Table Body */}
        <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="flex w-full space-x-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                     <Skeleton className="h-8 flex-1" />
                     <Skeleton className="h-8 flex-1" />
                     <Skeleton className="h-8 w-16" />
                </div>
            ))}
        </div>
         {/* Skeleton Footer */}
         <div className="flex items-center justify-end space-x-2 py-4">
             <Skeleton className="h-8 w-24" />
             <Skeleton className="h-8 w-24" />
         </div>
    </div>
);

// Main Table Component
export function TransactionsTable() {
    // Use the consolidated transaction store
    const { transactions, loading, error, fetchTransactions } = useTransactionStore();
    const [sorting, setSorting] = useState<SortingState>([{ id: 'Payment Date', desc: true }]); // Default sort
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    useEffect(() => {
        // Fetch data on initial mount or if data is considered stale by the store
        fetchTransactions();
    }, [fetchTransactions]); // Dependency array includes the fetch function from the store

     const table = useReactTable({
        data: transactions, // Data from the store
        columns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        // Removed manualPagination: true as pagination state is handled locally now
        // defaultColumn: { // Define min sizes for better responsive behavior
        //    minSize: 50, // Minimum size for columns unless overridden
        // },
    });

    if (loading) {
        return <TableSkeleton />;
    }

    if (error) {
         return <div className="text-red-500 p-4">Error loading transactions: {error}</div>;
    }

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-150px)] w-full p-4"> {/* Adjust max-height */}
            {/* Filters and Column Visibility */}
            <div className="flex flex-col sm:flex-row items-center gap-4 py-4 px-1">
                <Input
                    placeholder="Filter Payee..."
                    value={(table.getColumn("Payee")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("Payee")?.setFilterValue(event.target.value)
                    }
                    className="w-full sm:w-64 h-10" // Responsive width
                />
                 <Input
                    placeholder="Filter Description..." // Added description filter
                    value={(table.getColumn("Description")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("Description")?.setFilterValue(event.target.value)
                    }
                    className="w-full sm:w-64 h-10" // Responsive width
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto h-10">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                >
                                    {column.id.replace(/_/g, ' ')} {/* Make id more readable */}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table Area */}
            <ScrollArea className="flex-grow rounded-md border">
                <Table>
                    <TableHeader className="sticky top-0 bg-background z-10"> {/* Sticky header */}
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} style={{ width: header.getSize() }}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No transactions found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Pagination */}
            <div className="flex items-center justify-between space-x-2 py-4 px-1">
                 <div className="flex-1 text-sm text-muted-foreground">
                   {/* Optional: Row selection count */}
                   {/* {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected. */}
                 </div>
                <div className="flex items-center space-x-2">
                     <span className="text-sm text-muted-foreground">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}