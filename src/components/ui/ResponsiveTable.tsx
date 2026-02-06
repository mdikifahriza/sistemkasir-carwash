'use client';

import { ReactNode } from 'react';

interface ResponsiveTableProps {
    children: ReactNode;
    className?: string;
}

export function ResponsiveTable({ children, className = '' }: ResponsiveTableProps) {
    return (
        <div className={`-mx-4 overflow-x-auto sm:mx-0 ${className}`}>
            <table className="w-full text-left text-sm whitespace-nowrap sm:whitespace-normal">
                {children}
            </table>
        </div>
    );
}
