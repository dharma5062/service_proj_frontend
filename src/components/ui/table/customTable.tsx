import * as React from "react";
import { cn } from "@/lib/utils";

export interface CustomTableProps extends React.HTMLAttributes<HTMLTableElement> {
  className?: string;
  bordered?: boolean;
}

export interface CustomTableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
}

export interface CustomTableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
}

export interface CustomTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  className?: string;
}

export interface CustomTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  className?: string;
}

export interface CustomTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  className?: string;
}

const CustomTable = React.forwardRef<HTMLTableElement, CustomTableProps>(
  ({ className, bordered = true, ...props }, ref) => (
    <div className={cn(
      "relative w-full overflow-auto",
      bordered && "border border-border"
    )}>
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm border-collapse", className)}
        {...props}
      />
    </div>
  )
);
CustomTable.displayName = "CustomTable";

const CustomTableHeader = React.forwardRef<HTMLTableSectionElement, CustomTableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn("border-b-4 border-border bg-muted/50", className)}
      {...props}
    />
  )
);
CustomTableHeader.displayName = "CustomTableHeader";

const CustomTableBody = React.forwardRef<HTMLTableSectionElement, CustomTableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("", className)}
      {...props}
    />
  )
);
CustomTableBody.displayName = "CustomTableBody";

const CustomTableRow = React.forwardRef<HTMLTableRowElement, CustomTableRowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
);
CustomTableRow.displayName = "CustomTableRow";

const CustomTableHead = React.forwardRef<HTMLTableCellElement, CustomTableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-10 px-4 text-left align-middle font-medium text-muted-foreground border-r border-border last:border-r-0 bg-muted/30",
        className
      )}
      {...props}
    />
  )
);
CustomTableHead.displayName = "CustomTableHead";

const CustomTableCell = React.forwardRef<HTMLTableCellElement, CustomTableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("px-4 py-2 align-middle border-r border-b border-border/50 last:border-r-0", className)}
      {...props}
    />
  )
);
CustomTableCell.displayName = "CustomTableCell";

export {
  CustomTable,
  CustomTableHeader,
  CustomTableBody,
  CustomTableRow,
  CustomTableHead,
  CustomTableCell,
};