import * as React from "react";
import { cn } from "@/lib/utils";

// Custom Card Interface
interface CustomCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

interface CustomCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

interface CustomCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode;
    className?: string;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

interface CustomCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
    children: React.ReactNode;
    className?: string;
}

interface CustomCardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

interface CustomCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

// Custom Card Component
const CustomCard = React.forwardRef<HTMLDivElement, CustomCardProps>(
    ({ className, children, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
);
CustomCard.displayName = "CustomCard";

// Custom Card Header Component
const CustomCardHeader = React.forwardRef<HTMLDivElement, CustomCardHeaderProps>(
    ({ className, children, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "px-4 py-3 border-b border-gray-100 bg-gray-50/50",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
);
CustomCardHeader.displayName = "CustomCardHeader";

// Custom Card Title Component
const CustomCardTitle = React.forwardRef<HTMLHeadingElement, CustomCardTitleProps>(
    ({ className, children, as: Component = 'h3', ...props }, ref) => (
        <Component
            ref={ref as React.ForwardedRef<HTMLHeadingElement>}
            className={cn(
                "text-sm font-semibold text-gray-900 leading-tight",
                className
            )}
            {...props}
        >
            {children}
        </Component>
    )
);
CustomCardTitle.displayName = "CustomCardTitle";

// Custom Card Description Component
const CustomCardDescription = React.forwardRef<HTMLParagraphElement, CustomCardDescriptionProps>(
    ({ className, children, ...props }, ref) => (
        <p
            ref={ref}
            className={cn(
                "text-xs text-gray-600 mt-1",
                className
            )}
            {...props}
        >
            {children}
        </p>
    )
);
CustomCardDescription.displayName = "CustomCardDescription";

// Custom Card Body Component
const CustomCardBody = React.forwardRef<HTMLDivElement, CustomCardBodyProps>(
    ({ className, children, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "p-4",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
);
CustomCardBody.displayName = "CustomCardBody";

// Custom Card Footer Component
const CustomCardFooter = React.forwardRef<HTMLDivElement, CustomCardFooterProps>(
    ({ className, children, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "px-4 py-3 border-t border-gray-100 bg-gray-50/30",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
);
CustomCardFooter.displayName = "CustomCardFooter";

export {
    CustomCard,
    CustomCardHeader,
    CustomCardTitle,
    CustomCardDescription,
    CustomCardBody,
    CustomCardFooter,
};