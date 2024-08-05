'use client';
import React, { useEffect, useMemo, useState } from 'react';
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
import { cn, formatAmount } from '@/lib/utils';
import dayjs from "dayjs";
import { SkeletonTable } from '@/components/skeletons/table-skeleton';
import { useTransactionTableStore } from '@/components/stores/transaction-table-store';
import CategoryCell from '@/components/category-cell';
import { startOfMonth } from 'date-fns';

const categories = [
    "Groceries", "Restaurant", "Travel", "Entertainment", "Health",
    "Subscriptions", "Shopping", "Transfers", "Income", "Finance", "Other"
];

// Function to generate a unique color from a string
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 70%, 50%)`;
    return color;
};

// Function to extract the main color from an image
const getMainColor = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0, img.width, img.height);

            const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height).data;
            if (!imageData) {
                reject('Failed to get image data');
                return;
            }

            let r = 0, g = 0, b = 0;
            for (let i = 0; i < imageData.length; i += 4) {
                r += imageData[i];
                g += imageData[i+1];
                b += imageData[i+2];
            }
            r = Math.floor(r / (imageData.length / 4));
            g = Math.floor(g / (imageData.length / 4));
            b = Math.floor(b / (imageData.length / 4));

            resolve(`rgb(${r},${g},${b})`);
        };
        img.onerror = reject;
        img.src = imageUrl;
    });
};

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
        cell: ({ row }) => {
            const payee = row.getValue("Payee") as string;
            return <div className={"ml-4"}>{payee}</div>;
        }
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
        header: "Category",
        cell: ({ row }) => {
            const category = row.getValue("Category") as string;
            const onCategoryChange = async (newCategory: string) => {
                let transactionId = row.original.$id;
                row.original.category = newCategory;

                try {
                    const response = await fetch("/api/updateCategory", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            transactionId: transactionId,
                            category: newCategory,
                        }),
                    });

                    console.log("API Category Response:", response);

                    if (!response.ok) {
                        throw new Error("Failed to update category");
                    }
                } catch (error) {
                    console.error("Error updating category:", error);
                    row.original.category = category;
                }
            }

            return <CategoryCell category={category} onCategoryChange={onCategoryChange} />;
        }
    },
    {
        accessorKey: "Bank",
        id: "Bank",
        header: ({ column }) => {
            const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
            return (
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="text-left px--5"
                      >
                          Bank
                          <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                      {Array.from(column.getFacetedUniqueValues()).map(([value]) => (
                        <DropdownMenuCheckboxItem
                          key={value as string}
                          checked={selectedBanks.includes(value as string)}
                          onCheckedChange={(checked) => {
                              let updatedBanks: string[];
                              if (checked) {
                                  updatedBanks = [...selectedBanks, value as string];
                              } else {
                                  updatedBanks = selectedBanks.filter(bank => bank !== value);
                              }
                              setSelectedBanks(updatedBanks);
                              column.setFilterValue(updatedBanks.length ? updatedBanks : undefined);
                          }}
                        >
                            {value as string}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
              </DropdownMenu>
            );
        },
        cell: ({ row }) => {
            const bankName = row.getValue("Bank") as string;
            const formattedBankName = bankName
              .toLowerCase()
              .replace(/\b\w/g, (char: string) => char.toUpperCase());
            const bankLogo = row.original.bankLogo as string;
            const [color, setColor] = useState<string | null>(null);

            useEffect(() => {
                getMainColor(bankLogo)
                  .then(setColor)
                  .catch(console.error);
            }, [bankLogo]);

            return (
              <div className="relative group">
                  <div
                    className={cn(
                      'flex items-center justify-center',
                      'px-2 py-1 rounded-full',
                      'text-sm font-medium',
                      'transition-all duration-300 ease-in-out',
                      'hover:bg-gradient-to-r',
                      'cursor-pointer'
                    )}
                    style={{
                        color: color || 'inherit',
                        borderColor: color || 'currentColor',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        '--tw-gradient-from': color || 'currentColor',
                        '--tw-gradient-to': 'transparent'
                    }}
                  >
                      {formattedBankName}
                  </div>
                  <div
                    className={cn(
                      'absolute inset-0',
                      'rounded-full',
                      'opacity-0 group-hover:opacity-20',
                      'transition-opacity duration-300 ease-in-out',
                      'pointer-events-none'
                    )}
                    style={{
                        background: `linear-gradient(90deg, ${color || 'currentColor'} 0%, transparent 100%)`
                    }}
                  />
              </div>
            );
        },
        filterFn: (row, id, filterValue: string[]) => {
            const rowValue = row.getValue(id) as string;
            return filterValue.length === 0 || filterValue.includes(rowValue);
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
    },
    // // Add this new column definition to the columns array
    // {
    //     accessorKey: "bankLogo",
    //     id: "bankLogo",
    //     header: "Bank Logo",
    //     cell: ({ row }) => {
    //         const bankLogo = row.getValue("bankLogo") as string;
    //         return (
    //           <div className="flex justify-center">
    //               <img src={bankLogo} alt="Bank Logo" className="h-8 w-8 object-contain" />
    //           </div>
    //         );
    //     },
    //     enableSorting: false,
    //     enableHiding: false,
    // }
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
                    className="w-64"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
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