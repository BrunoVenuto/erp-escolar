"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserRole } from "@/components/AuthProvider";
import {
    Home,
    Users,
    BookOpen,
    Calendar,
    FileText,
    Settings,
    LogOut,
    GraduationCap,
    ClipboardCheck,
    ShieldAlert
} from "lucide-react";
import { auth } from "@/lib/firebase/client";

type NavItem = {
    label: string;
    href: string;
    icon: any;
    roles: UserRole[];
};

const navItems: NavItem[] = [
    { label: "Início", href: "/app", icon: Home, roles: ["admin", "direcao", "secretaria", "professor", "responsavel"] },
    { label: "Alunos", href: "/app/students", icon: Users, roles: ["admin", "direcao", "secretaria"] },
    { label: "Turmas", href: "/app/classes", icon: GraduationCap, roles: ["admin", "direcao", "secretaria", "professor"] },
    { label: "Disciplinas", href: "/app/admin/subjects", icon: BookOpen, roles: ["admin", "secretaria"] },
    { label: "Frequência", href: "/app/attendance", icon: ClipboardCheck, roles: ["admin", "professor"] },
    { label: "Avaliações", href: "/app/grades", icon: BookOpen, roles: ["admin", "professor"] },
    { label: "Calendário", href: "/app/calendar", icon: Calendar, roles: ["admin", "direcao", "secretaria", "professor", "responsavel"] },
    { label: "Documentos", href: "/app/documents", icon: FileText, roles: ["admin", "direcao", "secretaria"] },
    { label: "Auditoria", href: "/app/admin/audit", icon: ShieldAlert, roles: ["admin"] },
    { label: "Usuários", href: "/app/admin/users", icon: Users, roles: ["admin"] },
    { label: "Configurações", href: "/app/settings", icon: Settings, roles: ["admin"] },
];

export function Sidebar() {
    const pathname = usePathname();
    const { profile } = useAuth();

    const filteredItems = navItems.filter(item =>
        profile?.role && item.roles.includes(profile.role)
    );

    return (
        <aside className="w-64 sidebar-gradient text-white flex flex-col h-screen sticky top-0 border-r border-white/10">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <BookOpen className="w-6 h-6" />
                    <span>ERP Escolar</span>
                </h1>
                <p className="text-white/60 text-xs mt-1">Escola Municipal</p>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                ? "bg-white/20 text-white shadow-lg"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-white/60"}`} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <button
                    onClick={() => auth.signOut()}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
                >
                    <LogOut className="w-5 h-5 text-white/60" />
                    Sair do Sistema
                </button>
            </div>
        </aside>
    );
}
