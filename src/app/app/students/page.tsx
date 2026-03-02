"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Search, UserPlus, Filter, Pencil, Trash2, GraduationCap, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { logAudit } from "@/lib/utils/audit-logger";

type Student = {
    id: string;
    name: string;
    enrollmentNumber?: string;
    status: "active" | "inactive" | "pending";
    email?: string;
};

export default function StudentsPage() {
    const { profile } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStudents() {
            setLoading(true);
            try {
                const q = query(collection(db, "students"), orderBy("name"));
                const snap = await getDocs(q);
                const data = snap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Student));
                setStudents(data);
            } catch (err) {
                console.error("Error fetching students:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStudents();
    }, []);

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.enrollmentNumber?.includes(searchTerm));
        const matchesStatus = statusFilter === "all" || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    async function handleDelete(student: Student) {
        if (!confirm(`Tem certeza que deseja excluir o aluno ${student.name}? Esta ação não pode ser desfeita.`)) return;

        setDeletingId(student.id);
        try {
            await deleteDoc(doc(db, "students", student.id));

            // Log Audit
            await logAudit({
                action: "STUDENT_DELETE",
                userId: profile?.uid || "unknown",
                userName: profile?.name || "Sistema",
                targetId: student.id,
                details: `Aluno ${student.name} removido do sistema.`
            });

            setStudents(prev => prev.filter(s => s.id !== student.id));
        } catch (err) {
            console.error("Delete error:", err);
            alert("Erro ao excluir aluno. Verifique suas permissões.");
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Alunos</h1>
                    <p className="text-sm text-slate-500">Gerencie o cadastro e histórico dos estudantes.</p>
                </div>
                <Link href="/app/students/new">
                    <Button className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Novo Aluno
                    </Button>
                </Link>
            </div>

            {/* Filters Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Buscar por nome ou matrícula..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Todos os Status</option>
                                <option value="active">Ativos</option>
                                <option value="inactive">Inativos</option>
                                <option value="pending">Pendentes</option>
                            </select>
                            <Button variant="outline" className="gap-2">
                                <Filter className="w-4 h-4" />
                                Mais Filtros
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Students Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aluno</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Matrícula</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            Carregando alunos...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        Nenhum aluno encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 group-hover:bg-white transition-colors">
                                                    <GraduationCap className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{student.name}</p>
                                                    <p className="text-xs text-slate-500">{student.email || 'Sem e-mail'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                                            {student.enrollmentNumber || '---'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={
                                                student.status === 'active' ? 'success' :
                                                    student.status === 'pending' ? 'warning' : 'danger'
                                            }>
                                                {student.status === 'active' ? 'Ativo' :
                                                    student.status === 'pending' ? 'Pendente' : 'Inativo'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2 text-xs">
                                            <Link href={`/app/students/${student.id}/report-card`}>
                                                <Button variant="ghost" size="sm" className="h-8 text-xs font-bold gap-1 text-primary">
                                                    Boletim
                                                </Button>
                                            </Link>
                                            <Link href={`/app/students/${student.id}/edit`}>
                                                <Button variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 text-slate-600">
                                                    <Pencil className="w-3 h-3" />
                                                    Editar
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs font-bold gap-1 text-rose-600 hover:bg-rose-50"
                                                onClick={() => handleDelete(student)}
                                                disabled={deletingId === student.id}
                                            >
                                                {deletingId === student.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3 h-3" />
                                                )}
                                                Excluir
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
