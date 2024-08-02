"use client";

import React, { useEffect } from "react";
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
import { useTransactionStore } from '@/components/stores/transaction-store';
import {formatAmount} from "@/lib/utils";
import dayjs from "dayjs";
import { SkeletonTable } from '@/components/skeletons/table-skeleton';
import { useDateRangeStore } from '@/components/stores/date-range-store';
import { useTransactionTableStore } from '@/components/stores/transaction-table-store';


export const columns: ColumnDef<Transaction>[] = [

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
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="text-left px--4"
            >
                Amount
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
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
      accessorKey: "category",
      id: "Category",
      header: "Category"
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
        cell: ({ row }) => {
            const bankName = row.getValue("Bank") as string;
            const formattedBankName = bankName
                .toLowerCase()
                .replace(/\b\w/g, (char: string) => char.toUpperCase());
            return <div>{formattedBankName}</div>;
        },
    },
    {
        accessorKey: "Description",
        id: "Description",
        header: "Description",
        cell: ({ row }) => {
            const remittanceInformation: string = row.getValue("Description");
            return (
              <div className="flex flex-col justify-center fixed-cell-overflow">
                  {remittanceInformation}
              </div>
            );
        }
    },
    {
    accessorKey: "Exclude",
    id: "Exclude",
    header: "Exclude?",
    cell: ({ row }) => {
        const [checked, setChecked] = React.useState<boolean>(row.original.exclude === true);

        const handleChange = async (value: boolean) => {
            let transactionId = row.original.$id;
            setChecked(value);
            row.original.exclude = value;

            try {
                const response = await fetch("/api/excludeTransaction", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        transactionId: transactionId,
                        exclude: value,
                    }),
                });

                console.log("API Exclusion Response:", response);

                if (!response.ok) {
                    throw new Error("Failed to update transaction");
                }
            } catch (error) {
                console.error("Error updating transaction:", error);
                // Optionally, revert the checkbox state if the API call fails
                setChecked(!value);
                row.original.exclude = !value;
            }
        };

        return (
          <Checkbox
            checked={checked}
            onCheckedChange={handleChange}
            aria-label="Exclude row"
          />
        );
    },
    enableSorting: false,
    enableHiding: false,
}
];


const STORAGE_KEY = "transactionsData";

export function TransactionsTable() {
    const { transactions, loading, setTransactions, setLoading } = useTransactionTableStore();
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch("/api/transactionsTable");
                const data: Transaction[] = await response.json();
                data.sort((a: Transaction, b: Transaction) => {
                    const dateA = a.bookingDateTime ? new Date(a.bookingDateTime).getTime() : -Infinity;
                    const dateB = b.bookingDateTime ? new Date(b.bookingDateTime).getTime() : -Infinity;
                    return dateB - dateA;
                });
                setTransactions(data);
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [setLoading, setTransactions]);

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
        },
    });

    if (loading) {
        return (
          SkeletonTable()
        );
    }

    return (
      <div className="flex flex-col max-h-full max-w-full">
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
                            className="fixed-row-height" // Apply the fixed height class
                          >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="fixed-cell-overflow">
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext()
                                    )}
                                </TableCell>
                              ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow className="fixed-row-height">
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
                  {/*{table.getFilteredSelectedRowModel().rows.length} of{" "}*/}
                  {/*{table.getFilteredRowModel().rows.length} row(s) selected.*/}
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