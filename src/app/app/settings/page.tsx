"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Input } from "@/components/ui/Input";
import {
    User,
    Settings as SettingsIcon,
    Bell,
    Shield,
    Moon,
    Info,
    LogOut,
    Check,
    Pencil,
    Loader2
} from "lucide-react";
import { auth, db } from "@/lib/firebase/client";
import { doc, updateDoc } from "firebase/firestore";

export default function SettingsPage() {
    const { profile } = useAuth();
    const [isDark, setIsDark] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState("");
    const [saving, setSaving] = useState(false);

    // Initialize state from profile
    useEffect(() => {
        if (profile) {
            setNewName(profile.name || "");
        }
    }, [profile]);

    // Initialize Theme State
    useEffect(() => {
        const theme = localStorage.getItem("erp-theme") || "light";
        setIsDark(theme === "dark");
    }, []);

    const toggleTheme = (dark: boolean) => {
        setIsDark(dark);
        const theme = dark ? "dark" : "light";
        localStorage.setItem("erp-theme", theme);
        if (dark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    const handleUpdateProfile = async () => {
        if (!profile?.uid || !newName.trim()) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "users", profile.uid), {
                name: newName.trim()
            });
            setEditingName(false);
        } catch (err) {
            console.error(err);
            alert("Erro ao atualizar nome.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleNotification = async (key: string, value: boolean) => {
        if (!profile?.uid) return;
        try {
            await updateDoc(doc(db, "users", profile.uid), {
                [`preferences.notifications.${key}`]: value
            });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <SettingsIcon className="w-7 h-7 text-primary" />
                        Configurações do Sistema
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie sua conta e preferências globais do ERP.</p>
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
                    <button className="w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 font-semibold text-sm bg-primary text-white shadow-lg">
                        <User className="w-4 h-4" />
                        Geral
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-3 font-semibold text-sm">
                        <Bell className="w-4 h-4" />
                        Notificações
                    </button>
                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                        <button className="w-full text-left px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-3 font-semibold text-sm">
                            <Shield className="w-4 h-4" />
                            Segurança
                        </button>
                    </div>
                </div>

                {/* Right Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Profile Section */}
                    <Card>
                        <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Meu Perfil
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex-1 mr-4">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Nome Completo</p>
                                        {editingName ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <Input
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    className="h-8 text-sm"
                                                    autoFocus
                                                />
                                                <Button size="sm" onClick={handleUpdateProfile} disabled={saving} className="h-8">
                                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => { setEditingName(false); setNewName(profile?.name || ""); }} className="h-8">X</Button>
                                            </div>
                                        ) : (
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{profile?.name || "---"}</p>
                                        )}
                                    </div>
                                    {!editingName && (
                                        <Button variant="ghost" size="sm" onClick={() => setEditingName(true)} className="text-primary font-bold text-xs h-8">
                                            <Pencil className="w-3 h-3 mr-1" /> Editar
                                        </Button>
                                    )}
                                </div>
                                <div className="p-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">E-mail</p>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{profile?.email || "---"}</p>
                                </div>
                                <div className="p-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Cargo</p>
                                    <div className="mt-1">
                                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                            {profile?.role || "visitante"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Interface Section */}
                    <Card>
                        <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Moon className="w-4 h-4" />
                                Aparência
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                <div className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">Modo Escuro</p>
                                        <p className="text-xs text-slate-500">Alternar entre tema claro e escuro</p>
                                    </div>
                                    <Switch checked={isDark} onChange={toggleTheme} />
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">Idioma</p>
                                        <p className="text-xs text-slate-500">Português (Brasil)</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-slate-400 font-bold text-xs h-8" disabled>
                                        Padrão
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications Section */}
                    <Card>
                        <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Bell className="w-4 h-4" />
                                Notificações
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                <div className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">Alertas de Frequência</p>
                                        <p className="text-xs text-slate-500">Avisar quando o aluno faltar 2 dias seguidos</p>
                                    </div>
                                    <Switch
                                        checked={(profile as any)?.preferences?.notifications?.attendance ?? true}
                                        onChange={(v) => handleToggleNotification("attendance", v)}
                                    />
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">Comunicados Internos</p>
                                        <p className="text-xs text-slate-500">Receber avisos da direção e secretaria</p>
                                    </div>
                                    <Switch
                                        checked={(profile as any)?.preferences?.notifications?.internal ?? true}
                                        onChange={(v) => handleToggleNotification("internal", v)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden group">
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-2 opacity-60">
                                <Info className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Informações Técnicas</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">ERP Escolar "Gênesis"</h3>
                                <p className="text-xs text-white/60">Versão 0.1.1-stable • Março de 2026</p>
                            </div>
                            <div className="flex items-center gap-4 pt-2">
                                <Badge className="bg-white/10 text-white border-white/20">Turbo Active</Badge>
                                <Badge className="bg-white/10 text-white border-white/20">v2 Engine</Badge>
                            </div>
                        </div>
                        <SettingsIcon className="absolute -bottom-8 -right-8 w-40 h-40 text-white/5 group-hover:rotate-45 transition-transform duration-1000" />
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
