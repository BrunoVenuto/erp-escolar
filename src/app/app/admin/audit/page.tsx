"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, User, Calendar, Activity, Info, Search } from "lucide-react";

type AuditEntry = {
    id: string;
    action: string;
    userName: string;
    details: string;
    timestamp: any;
    targetId: string;
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeUsersCount, setActiveUsersCount] = useState<number>(0);

    useEffect(() => {
        async function fetchLogs() {
            try {
                const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(100));
                const snap = await getDocs(q);
                setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditEntry)));

                // Fetch active users count
                const usersSnap = await getDocs(collection(db, "users"));
                const active = usersSnap.docs.filter(d => d.data().status === "active");
                setActiveUsersCount(active.length);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const acoesHoje = logs.filter(log => {
        if (!log.timestamp) return false;
        const logDate = log.timestamp.toDate();
        return logDate >= today;
    }).length;

    const securityAlerts = logs.filter(log =>
        log.action.includes("SECURITY") || log.action.includes("DELETE") || log.action.includes("ERROR")
    ).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Painel de Auditoria</h1>
                    <p className="text-sm text-slate-500">Rastreamento de ações críticas para conformidade LGPD.</p>
                </div>
                <div className="flex items-center gap-2 p-2 px-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                    <ShieldCheck className="w-4 h-4" />
                    Sistema Seguro
                </div>
            </div>

            <Card>
                <CardHeader className="border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Logs de Atividade Recentes
                    </CardTitle>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar logs..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Data/Hora</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Usuário</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Ação</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-6 py-4 bg-slate-50/20 h-10"></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Nenhum log encontrado.</td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Calendar className="w-3 h-3" />
                                                {log.timestamp?.toDate().toLocaleString('pt-BR')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                    {log.userName.charAt(0)}
                                                </div>
                                                <span className="text-xs font-semibold text-slate-700">{log.userName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant="info" className="uppercase tracking-tighter text-[9px] px-1.5 py-0">
                                                {log.action}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 max-w-sm truncate">
                                            <div className="flex items-center gap-2 text-xs text-slate-600 truncate" title={log.details}>
                                                <Info className="w-3 h-3 text-slate-300 min-w-3" />
                                                <span className="truncate">{log.details}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-white border rounded-xl shadow-sm border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações hoje</p>
                    <p className="text-2xl font-black text-slate-800">{loading ? "--" : acoesHoje}</p>
                    <div className="mt-2 h-1 w-full bg-emerald-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-emerald-500 ${acoesHoje > 0 ? "w-1/3" : "w-0"}`} />
                    </div>
                </div>
                <div className="p-4 bg-white border rounded-xl shadow-sm border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Usuários Ativos</p>
                    <p className="text-2xl font-black text-slate-800">{loading ? "--" : activeUsersCount}</p>
                    <div className="mt-2 h-1 w-full bg-blue-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-blue-500 w-1/2`} />
                    </div>
                </div>
                <div className="p-4 bg-white border rounded-xl shadow-sm border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Alertas de Segurança</p>
                    <p className={`text-2xl font-black ${securityAlerts > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {loading ? "--" : securityAlerts}
                    </p>
                    <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${securityAlerts > 0 ? 'bg-rose-500 w-full' : 'bg-emerald-500 w-full'}`} />
                    </div>
                </div>
            </div>
        </div>
    );
}
