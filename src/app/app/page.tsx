"use client";

import { useAuth } from "@/components/AuthProvider";
import {
    Users,
    GraduationCap,
    ClipboardCheck,
    TrendingUp,
    AlertCircle,
    Clock,
    UserPlus,
    ShieldCheck,
    Bug
} from "lucide-react";
import { doc, setDoc, serverTimestamp, collection, getCountFromServer, addDoc, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardPage() {
    const { user, profile } = useAuth();
    const [stats, setStats] = useState({
        students: "...",
        classes: "...",
        attendance: "94%",
        pending: "..."
    });
    const [diagResult, setDiagResult] = useState<string | null>(null);

    const isAdmin = profile?.role === "admin";

    useEffect(() => {
        async function loadStats() {
            try {
                const [stCount, clCount] = await Promise.all([
                    getCountFromServer(collection(db, "students")),
                    getCountFromServer(collection(db, "classes"))
                ]);
                setStats(prev => ({
                    ...prev,
                    students: stCount.data().count.toString(),
                    classes: clCount.data().count.toString(),
                }));
            } catch (err) {
                console.error("Dashboard Stats Error:", err);
            }
        }
        if (user) loadStats();
    }, [user]);

    async function runDiagnostics() {
        setDiagResult("Iniciando testes...");
        try {
            // Test 1: Write to Test Collection
            const testRef = await addDoc(collection(db, "_diagnostics"), {
                uid: user?.uid,
                timestamp: serverTimestamp(),
                v: "1.0"
            });
            setDiagResult(prev => prev + "\n✅ Escrita OK (" + testRef.id + ")");

            // Test 2: Read from Users
            const userSnap = await getDocs(query(collection(db, "users"), limit(1)));
            setDiagResult(prev => prev + "\n✅ Leitura Users OK (" + userSnap.size + ")");

            // Test 3: Read from Students
            const stSnap = await getDocs(query(collection(db, "students"), limit(1)));
            setDiagResult(prev => prev + "\n✅ Leitura Alunos OK (" + stSnap.size + ")");

            setDiagResult(prev => prev + "\n\nSISTEMA OPERACIONAL!");
        } catch (err: any) {
            setDiagResult(prev => prev + "\n❌ ERRO: " + err.message);
            console.error(err);
        }
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <section className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Olá, {profile?.name || "Usuário"}! 👋
                    </h1>
                    <p className="text-slate-500">Bem-vindo ao sistema de gestão escolar municipal.</p>
                </div>
                {!profile && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex-1">
                            <p className="text-sm font-bold text-amber-800">Perfil não encontrado!</p>
                            <p className="text-xs text-amber-700">O seu usuário do Firebase Auth não tem um perfil no Firestore.</p>
                        </div>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                                const name = prompt("Qual seu nome completo?");
                                if (!name) return;
                                await setDoc(doc(db, "users", user?.uid || ""), {
                                    name,
                                    role: "admin",
                                    email: user?.email || "",
                                    createdAt: serverTimestamp()
                                });
                                alert("Perfil de Administrador criado! Recarregue a página.");
                                window.location.reload();
                            }}
                        >
                            Criar Perfil Admin
                        </Button>
                    </div>
                )}
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total de Alunos"
                    value={stats.students}
                    icon={Users}
                    trend="+12 este mês"
                    color="bg-blue-500"
                />
                <StatCard
                    title="Turmas Ativas"
                    value={stats.classes}
                    icon={GraduationCap}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Frequência Média"
                    value={stats.attendance}
                    icon={ClipboardCheck}
                    trend="-2% hoje"
                    color="bg-amber-500"
                />
                <StatCard
                    title="Matrículas Pendentes"
                    value={stats.pending === "..." ? "0" : stats.pending}
                    icon={AlertCircle}
                    color="bg-rose-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Areas based on Role */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Atividades Recentes
                        </h3>
                        <div className="space-y-4">
                            <ActivityItem
                                title="Chamada finalizada"
                                desc="9º Ano A - Matemática"
                                time="10 min atrás"
                            />
                            <ActivityItem
                                title="Nova matrícula"
                                desc="Aluno: João Silva"
                                time="1 hora atrás"
                            />
                            <ActivityItem
                                title="Boletim gerado"
                                desc="Finalização do 2º Bimestre"
                                time="Ontem"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Widgets */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-4">Acesso Rápido</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <QuickAction label="Nova Chamada" icon={ClipboardCheck} href="/app/attendance" />
                            <QuickAction label="Matricular" icon={Users} href="/app/students" />
                            <QuickAction label="Ver Notas" icon={TrendingUp} href="/app/grades" />
                            <QuickAction label="Turmas" icon={GraduationCap} href="/app/classes" />
                        </div>
                    </div>

                    {/* Diagnostics Panel */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            Diagnóstico do Sistema
                        </h3>
                        {diagResult ? (
                            <pre className="text-[10px] bg-slate-50 p-3 rounded font-mono text-slate-600 whitespace-pre-wrap">
                                {diagResult}
                            </pre>
                        ) : (
                            <p className="text-xs text-slate-500 mb-4">Verifique se as permissões do banco de dados estão OK.</p>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={runDiagnostics}
                        >
                            Executar Teste Médico
                        </Button>
                    </div>

                    {/* Debug Panel */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl text-slate-300 font-mono text-xs">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <Bug className="w-4 h-4 text-amber-400" />
                            DEBUG: Perfil Atual
                        </h3>
                        <pre className="overflow-auto max-h-40">
                            {JSON.stringify({
                                uid: user?.uid,
                                email: user?.email,
                                profile: profile || "NÃO CARREGADO"
                            }, null, 2)}
                        </pre>
                        <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                            <p>Admin: {isAdmin ? "SIM" : "NÃO"}</p>
                            <p>Teacher ID: {profile?.teacherId || "NENHUM"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
                    <h4 className="text-3xl font-bold text-slate-800 mt-2">{value}</h4>
                    {trend && (
                        <p className={`text-xs mt-2 ${trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'} font-medium`}>
                            {trend}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${color} text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}

function ActivityItem({ title, desc, time }: any) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
            <div>
                <p className="text-sm font-semibold text-slate-800">{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">{time}</span>
        </div>
    );
}

function QuickAction({ label, icon: Icon, href }: { label: string, icon: any, href: string }) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all gap-2 group">
            <Icon className="w-5 h-5 text-slate-400 group-hover:text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
        </Link>
    );
}
