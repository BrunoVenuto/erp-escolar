"use client";

import { useAuth } from "@/components/AuthProvider";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }

        // Initialize Theme
        const theme = localStorage.getItem("erp-theme") || "light";
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Carregando ERP Escolar...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    // Simple Page Title logic based on pathname
    const getPageTitle = () => {
        if (pathname === "/app") return "Painel Geral";
        if (pathname.includes("/students")) return "Gestão de Alunos";
        if (pathname.includes("/classes")) return "Gestão de Turmas";
        if (pathname.includes("/attendance")) return "Diário & Frequência";
        if (pathname.includes("/grades")) return "Avaliações & Notas";
        if (pathname.includes("/documents")) return "Central de Documentos";
        if (pathname.includes("/settings")) return "Configurações";
        return "ERP Escolar";
    };

    return (
        <div id="app-root" className="flex min-h-screen bg-slate-50 transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Topbar title={getPageTitle()} />
                <main className="p-8 flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
