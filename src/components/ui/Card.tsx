"use client";

import React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`p-6 border-b border-slate-100 ${className}`}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <h3 className={`text-lg font-bold text-slate-800 ${className}`}>
            {children}
        </h3>
    );
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`p-6 ${className}`}>
            {children}
        </div>
    );
}
