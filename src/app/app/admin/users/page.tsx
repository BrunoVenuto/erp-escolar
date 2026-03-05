"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, orderBy, query, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { UserPlus, Mail, Shield, Loader2, Search, X, Trash2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/components/AuthProvider";

export default function UsersAdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingUser, setEditingUser] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchUsers() {
            setLoading(true);
            try {
                const q = query(collection(db, "users"), orderBy("name"));
                const snap = await getDocs(q);
                setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error fetching users:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, []);

    async function handleUpdateUser(e: React.FormEvent) {
        e.preventDefault();
        if (!editingUser) return;
        setSaving(true);
        try {
            const userRef = doc(db, "users", editingUser.id);
            await updateDoc(userRef, {
                role: editingUser.role,
                status: editingUser.status
            });
            // Update local state
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: editingUser.role, status: editingUser.status } : u));
            setEditingUser(null);
        } catch (err) {
            console.error("Error updating user:", err);
            alert("Erro ao atualizar usuário.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteUser() {
        if (!editingUser) return;
        if (!confirm(`Tem certeza que deseja excluir o usuário ${editingUser.name}?`)) return;
        setSaving(true);
        try {
            await deleteDoc(doc(db, "users", editingUser.id));
            setUsers(users.filter(u => u.id !== editingUser.id));
            setEditingUser(null);
        } catch (err) {
            console.error("Error deleting user:", err);
            alert("Erro ao excluir usuário.");
        } finally {
            setSaving(false);
        }
    }

    const roleLabels: Record<UserRole, string> = {
        admin: "Administrador",
        direcao: "Direção",
        secretaria: "Secretaria",
        professor: "Professor",
        responsavel: "Responsável"
    };

    const roleColors: Record<UserRole, string> = {
        admin: "bg-rose-50 text-rose-700 border-rose-100",
        direcao: "bg-amber-50 text-amber-700 border-amber-100",
        secretaria: "bg-blue-50 text-blue-700 border-blue-100",
        professor: "bg-emerald-50 text-emerald-700 border-emerald-100",
        responsavel: "bg-slate-50 text-slate-700 border-slate-100"
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Usuários do Sistema</h1>
                    <p className="text-sm text-slate-500">Gerencie o acesso de professores, direção e funcionários.</p>
                </div>
                <Link href="/app/admin/users/new">
                    <Button className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Convidar Usuário
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader className="pb-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="text-sm">Carregando usuários...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 italic border border-dashed rounded-xl">
                            Nenhum usuário encontrado.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nome</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Perfil</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                                        {u.name?.substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                            <Mail className="w-3 h-3" />
                                                            {u.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${roleColors[u.role as UserRole] || 'bg-slate-100'}`}>
                                                    {roleLabels[u.role as UserRole] || u.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge variant={u.status === "active" ? "success" : "warning"}>
                                                    {u.status === "active" ? "Ativo" : (u.status === "pending" ? "Pendente" : "Inativo")}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => setEditingUser(u)}
                                                >
                                                    Editar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Edição */}
            {editingUser && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                Editar Usuário
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingUser(null)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{editingUser.name}</p>
                                    <p className="text-xs text-slate-500">{editingUser.email}</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">
                                        Nível de Acesso
                                    </label>
                                    <select
                                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                        value={editingUser.role}
                                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                    >
                                        <option value="professor">Professor(a)</option>
                                        <option value="secretaria">Secretaria</option>
                                        <option value="direcao">Direção</option>
                                        <option value="admin">Administrador</option>
                                        <option value="responsavel">Responsável</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">
                                        Status
                                    </label>
                                    <select
                                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                        value={editingUser.status || "active"}
                                        onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                        <option value="pending">Pendente (Aguardando Registro)</option>
                                    </select>
                                </div>

                                <div className="pt-4 flex items-center justify-between gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                        onClick={handleDeleteUser}
                                        disabled={saving}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                    </Button>

                                    <div className="flex gap-2">
                                        <Button type="button" variant="ghost" onClick={() => setEditingUser(null)} disabled={saving}>
                                            Cancelar
                                        </Button>
                                        <Button type="submit" loading={saving}>
                                            Salvar Alterações
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
