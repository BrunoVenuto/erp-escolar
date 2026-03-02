"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, containerClassName = "", className = "", ...props }, ref) => {
        return (
            <div className={`space-y-1.5 ${containerClassName}`}>
                {label && (
                    <label className="block text-sm font-semibold text-slate-700">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
            w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200
            ${error ? "border-red-500 focus:ring-red-50 focus:border-red-500" : ""}
            ${className}
          `}
                    {...props}
                />
                {error && <p className="text-xs font-medium text-red-500">{error}</p>}
            </div>
        );
    }
);

Input.displayName = "Input";
