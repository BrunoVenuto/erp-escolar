"use client";

import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    User,
    Settings,
    Bell,
    Shield,
    Moon,
    Globe,
    Info,
    Smartphone,
    LogOut
} from "lucide-react";
import { auth } from "@/lib/firebase/client";

export default function SettingsPage() {
    const { profile } = useAuth();

    const sections = [
        {
            title: "Meu Perfil",
            icon: User,
            items: [
                { label: "Nome", value: profile?.name || "---" },
                { label: "E-mail", value: profile?.email || "---" },
                { label: "Cargo", value: profile?.role?.toUpperCase() || "---" },
            ]
        },
        {
            title: "Preferências de Interface",
            icon: Moon,
            items: [
                { label: "Tema", value: "Sistêmico", action: "Alterar" },
                { label: "Idioma", value: "Português (Brasil)", action: "Alterar" },
                { label: "Densidade Visual", value: "Moderno", action: "Alterar" },
            ]
        },
        {
            title: "Notificações",
            icon: Bell,
            items: [
                { label: "Alertas de Frequência", value: "Ativado", action: "Configurar" },
                { label: "Lembretes de Prazo", value: "Ativado", action: "Configurar" },
                { label: "Comunicados da Secretaria", value: "E-mail & Push", action: "Configurar" },
            ]
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Settings className="w-7 h-7 text-primary" />
                        Configurações do Sistema
                    </h1>
                    <p className="text-sm text-slate-500">Gerencie sua conta e preferências globais do ERP.</p>
                </div>
                <Button
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50 gap-2 font-bold"
                    onClick={() => auth.signOut()}
                >
                    <LogOut className="w-4 h-4" />
                    Sair da Conta
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Navigation (Desktop) */}
                <div className="hidden md:block space-y-1">
                    {sections.map(s => (
                        <button
                            key={s.title}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 font-semibold text-sm ${s.title === "Meu Perfil" ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"
                                }`}
                        >
                            <s.icon className="w-4 h-4" />
                            {s.title}
                        </button>
                    ))}
                    <div className="pt-4 mt-4 border-t border-slate-100">
                        <button className="w-full text-left px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 transition-all flex items-center gap-3 font-semibold text-sm">
                            <Shield className="w-4 h-4" />
                            Segurança
                        </button>
                        <button className="w-full text-left px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 transition-all flex items-center gap-3 font-semibold text-sm">
                            <Smartphone className="w-4 h-4" />
                            Sessões Ativas
                        </button>
                    </div>
                </div>

                {/* Right Content */}
                <div className="md:col-span-2 space-y-6">
                    {sections.map((section) => (
                        <Card key={section.title}>
                            <CardHeader className="border-b border-slate-50 pb-4">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <section.icon className="w-4 h-4" />
                                    {section.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-50">
                                    {section.items.map((item) => (
                                        <div key={item.label} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">{item.label}</p>
                                                <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                                            </div>
                                            {item.action && (
                                                <Button variant="ghost" size="sm" className="text-primary font-bold text-xs h-8">
                                                    {item.action}
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden group">
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-2 opacity-60">
                                <Info className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Informações Técnicas</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">ERP Escolar "Gênesis"</h3>
                                <p className="text-xs text-white/60">Versão 0.1.0-alpha • Março de 2026</p>
                            </div>
                            <div className="flex items-center gap-4 pt-2">
                                <Badge className="bg-white/10 text-white border-white/20">Turbo Enabled</Badge>
                                <Badge className="bg-white/10 text-white border-white/20">Firebase Connected</Badge>
                            </div>
                        </div>
                        <Settings className="absolute -bottom-8 -right-8 w-40 h-40 text-white/5 group-hover:rotate-45 transition-transform duration-1000" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Badge({ children, className }: any) {
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${className}`}>
            {children}
        </span>
    );
}
