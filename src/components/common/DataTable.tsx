"use client";

import React, { useMemo, useState, useCallback } from "react";
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type RowSelectionState,
    type SortingState,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

type AccessorKey<T> = Extract<keyof T, string>;

interface Column<T> {
    key: AccessorKey<T> | string;
    label: string | React.ReactNode;
    render?: (row: T) => React.ReactNode;
    enableSorting?: boolean;
}

interface PaginationProps {
    page: number;
    totalPages: number;
    total?: number;
    onPageChange: (newPage: number) => void;
}

interface DataTableProps<T extends object> {
    columns: Column<T>[];
    data: T[];
    emptyMessage?: string;
    pagination?: PaginationProps;
    loading?: boolean;
    getRowId?: (row: T, index: number) => string;
    className?: string;
    skeletonRows?: number;
    rowSelection?: RowSelectionState;
    onRowSelectionChange?: (state: RowSelectionState) => void;
    selectable?: boolean;
}

const DataTable = <T extends object,>({
    columns,
    data,
    emptyMessage = "No data found.",
    pagination,
    loading = false,
    getRowId,
    className,
    skeletonRows = 10,
    rowSelection: rowSelectionProp,
    onRowSelectionChange,
    selectable = true,
}: DataTableProps<T>) => {
    const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});
    const rowSelection = rowSelectionProp ?? internalRowSelection;

    const handleRowSelectionChange = (
        updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)
    ) => {
        const next =
            typeof updater === "function"
                ? (updater as (old: RowSelectionState) => RowSelectionState)(rowSelection)
                : updater;

        onRowSelectionChange?.(next);
        if (rowSelectionProp === undefined) setInternalRowSelection(next);
    };

    const [sorting, setSorting] = useState<SortingState>([]);
    const memoData = useMemo(() => data ?? [], [data]);

    const defaultGetRowId = useCallback((row: T, index: number) => {
        // @ts-expect-error probing common id fields
        const maybe = row.id ?? row.ID ?? row._id ?? row.uuid;
        return typeof maybe === "string" || typeof maybe === "number" ? String(maybe) : String(index);
    }, []);

    const tableColumns = useMemo<ColumnDef<T>[]>(() => {
        const cols: ColumnDef<T>[] = [];

        if (selectable) {
            cols.push({
                id: "select",
                header: ({ table }) => {
                    const checked: boolean | "indeterminate" = table.getIsAllPageRowsSelected()
                        ? true
                        : table.getIsSomePageRowsSelected()
                            ? "indeterminate"
                            : false;

                    return (
                        <div className="flex items-center justify-center">
                            <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
                                aria-label="Select all rows on this page"
                            />
                        </div>
                    );
                },
                cell: ({ row }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(value === true)}
                            aria-label={`Select row ${row.index + 1}`}
                        />
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
                size: 48,
            });
        }

        const userCols: ColumnDef<T>[] = columns.map((col) => ({
            accessorKey: col.key as string,
            header: ({ column }) => {
                const canSort = col.enableSorting ?? false;
                const isSorted = column.getIsSorted(); // false | 'asc' | 'desc'

                // Tri-state toggle: unsorted -> asc -> desc -> unsorted
                return canSort ? (
                    <button
                        type="button"
                        onClick={column.getToggleSortingHandler()}
                        className="flex w-full items-center justify-between gap-2 select-none"
                        aria-label={
                            isSorted === "asc"
                                ? "Sort descending"
                                : isSorted === "desc"
                                    ? "Clear sorting"
                                    : "Sort ascending"
                        }
                    >
                        <span className="truncate">
                            {typeof col.label === "string" ? col.label : col.label}
                        </span>
                        <span aria-hidden="true" className="text-xs text-muted-foreground">
                            {isSorted === "asc" ? "▲" : isSorted === "desc" ? "▼" : "⇅"}
                        </span>
                    </button>
                ) : (
                    <>{typeof col.label === "string" ? col.label : col.label}</>
                );
            },
            enableSorting: col.enableSorting ?? false,
            enableSortingRemoval: true,
            sortDescFirst: false,
            cell: ({ row }) =>
                col.render
                    ? col.render(row.original as T)
                    : ((row.original as Record<string, unknown>)[col.key as string] ?? "—") as React.ReactNode,
        }));

        return [...cols, ...userCols];
    }, [columns, selectable]);

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: memoData,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: { rowSelection, sorting },
        onRowSelectionChange: handleRowSelectionChange,
        onSortingChange: setSorting,
        enableRowSelection: selectable,
        getRowId: getRowId ?? defaultGetRowId,
        enableSortingRemoval: true,
    });

    const skeleton = useMemo(
        () =>
            Array.from({ length: skeletonRows }, (_, i) => (
                <TableRow key={`skeleton-${i}`}>
                    {selectable && (
                        <TableCell className="text-center px-4 py-3">
                            <Skeleton className="h-4 w-4 mx-auto rounded" />
                        </TableCell>
                    )}
                    {columns.map((_, idx) => (
                        <TableCell key={idx} className="px-4 py-3">
                            <Skeleton className="h-4 w-24" />
                        </TableCell>
                    ))}
                </TableRow>
            )),
        [columns, skeletonRows, selectable]
    );

    const visibleRows = table.getRowModel().rows;
    const colSpan = columns.length + (selectable ? 1 : 0);

    return (
        <div className={`w-full overflow-x-auto rounded-lg border-2 border-primary-900/40 ${className ?? ""}`}>
            <Table>
                <TableHeader className="table-header-gradient">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                const isSorted = header.column.getIsSorted();
                                const ariaSort =
                                    isSorted === "asc" ? "ascending" : isSorted === "desc" ? "descending" : "none";

                                return (
                                    <TableHead
                                        key={header.id}
                                        aria-sort={
                                            header.column.getCanSort()
                                                ? (ariaSort as "none" | "ascending" | "descending")
                                                : undefined
                                        }
                                        className={
                                            header.id === "select"
                                                ? "w-12 text-center px-4 py-3"
                                                : "whitespace-nowrap font-semibold px-4 py-3 text-sm"
                                        }
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>

                <TableBody aria-busy={loading}>
                    {loading ? (
                        skeleton
                    ) : visibleRows.length > 0 ? (
                        visibleRows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() ? "selected" : undefined}
                                className="last:border!"

                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.id}
                                        className={
                                            cell.column.id === "select"
                                                ? "text-center px-4 py-3"
                                                : "whitespace-nowrap px-4 py-3 text-sm"
                                        }
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={colSpan} className="text-center py-8 text-sm text-muted-foreground">
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-end w-full py-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() =>
                                        pagination.page > 1 && pagination.onPageChange(pagination.page - 1)
                                    }
                                    className={pagination.page === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>

                            {[...Array(pagination.totalPages)].map((_, i) => {
                                const pageNumber = i + 1;
                                if (
                                    pageNumber === 1 ||
                                    pageNumber === pagination.totalPages ||
                                    Math.abs(pageNumber - pagination.page) <= 1
                                ) {
                                    return (
                                        <PaginationItem key={pageNumber}>
                                            <PaginationLink
                                                isActive={pagination.page === pageNumber}
                                                onClick={() => pagination.onPageChange(pageNumber)}
                                                className="cursor-pointer"
                                            >
                                                {pageNumber}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                } else if (Math.abs(pageNumber - pagination.page) === 2) {
                                    return <PaginationEllipsis key={pageNumber} />;
                                }
                                return null;
                            })}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() =>
                                        pagination.page < pagination.totalPages &&
                                        pagination.onPageChange(pagination.page + 1)
                                    }
                                    className={
                                        pagination.page === pagination.totalPages
                                            ? "cursor-not-allowed opacity-50"
                                            : "cursor-pointer"
                                    }
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
};

export default DataTable;
