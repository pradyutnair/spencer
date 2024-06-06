"use client";

import React, { useEffect, useState } from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Transaction } from "@/types";
import {formatAmount} from "@/lib/utils";
import dayjs from "dayjs";

export const columns: ColumnDef<Transaction>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "Payee",
        id: "Payee",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Payee
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    {
        accessorKey: "amount",
        header: "Amount",
        id: "Amount",
        cell: ({ row }) => {
            const amount = row.original.amount;
            const currency = row.original.currency;

            const displayAmount = formatAmount(amount, currency);
            return (
                <div className={`flex flex-col font-medium ${amount < 0 ? 'text-[#f04438]' : 'text-[#039855]'}`} style={{ whiteSpace: 'nowrap' }}>
                    {displayAmount}
                </div>
            );
        },
    },
    {
        accessorKey: "bookingDate",
        id: "Payment Date",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="text-left"
                >
                    Payment Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const bookingDate = new Date(row.getValue("Payment Date"));
            const formattedDate = bookingDate.toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            return (
                <div className="px-6 text-left">
                    {formattedDate}
                </div>
            );
        },
        sortingFn: (rowA, rowB, columnId) => {
            const dateA = dayjs(rowA.getValue(columnId));
            const dateB = dayjs(rowB.getValue(columnId));
            return dateB.unix() - dateA.unix();
        }
    },



    {
        accessorKey: "Bank",
        id: "Bank",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="text-left px--5"
            >
                Bank
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    {
    accessorKey: "Description",
    id: "Description",
    header: "Description",
    cell: ({ row }) => {
        const remittanceInformation: string = row.getValue("Description");
        return (
            <div className="flex flex-col justify-center" style={{ wordWrap: 'break-word', maxWidth: '200px' }}>
                {remittanceInformation}
            </div>
        );
    },
},
];

const STORAGE_KEY = "transactionsData";

export function TransactionsTable() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    useEffect(() => {
        let storedData;
        //storedData= sessionStorage.getItem(STORAGE_KEY);
        storedData = null;
        if (storedData) {
            // -------------------------------------------------------------
            // Sort stored data by booking date
            storedData = JSON.stringify(JSON.parse(storedData).sort((a: { bookingDate: string | number | Date; }, b: { bookingDate: string | number | Date; }) => {
                return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
            }));
            // -------------------------------------------------------------
            setTransactions(JSON.parse(storedData));
            setLoading(false);
        } else {
            const fetchTransactions = async () => {
                try {
                    const response = await fetch("/api/transactions");
                    const data: Transaction[] = await response.json();
                    // -------------------------------------------------------------
                    // Sort data by booking date
                    data.sort((a: Transaction, b: Transaction) => {
                        const dateA = a.bookingDateTime ? new Date(a.bookingDateTime).getTime() : -Infinity;
                        const dateB = b.bookingDateTime ? new Date(b.bookingDateTime).getTime() : -Infinity;
                        return dateB - dateA;
                    });
                    // -------------------------------------------------------------
                    setTransactions(data);
                    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                } catch (error) {
                    console.error("Error fetching transactions:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchTransactions();
        }
    }, []);

    const table = useReactTable({
        data: transactions,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        initialState: {
            sorting: [{ id: 'Payment Date', desc: true }],
            // pagination: {
            //     pageSize: 7, // Default number of rows per page
            // },
        },
    });



    if (loading) {
        return <p className={"px-4"}>Loading...</p>;
    }

    console.log(transactions);

    return (
        <div className="flex flex-col max-h-full max-w-full overflow-hidden">
            <div className="flex items-center py-4 px-1">
                <Input
                    placeholder="Filter Payee..."
                    value={(table.getColumn("Payee")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("Payee")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown className="ml-2 h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex-1 overflow-y-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className={"custom-header-row"}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
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
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2">
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
