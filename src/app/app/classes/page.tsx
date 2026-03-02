"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, Users, Clock, GraduationCap, ChevronRight, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { logAudit } from "@/lib/utils/audit-logger";

type SchoolClass = {
    id: string;
    name: string;
    shift: "morning" | "afternoon" | "night";
    yearId: string;
    grade?: string;
};

export default function ClassesPage() {
    const { profile } = useAuth();
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchClasses() {
            setLoading(true);
            try {
                const q = query(collection(db, "classes"), orderBy("name"));
                const snap = await getDocs(q);
                const data = snap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as SchoolClass));
                setClasses(data);
            } catch (err) {
                console.error("Error fetching classes:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchClasses();
    }, []);

    const shiftLabels = {
        morning: "Manhã",
        afternoon: "Tarde",
        night: "Noite",
    };

    async function handleDelete(cls: SchoolClass) {
        if (!confirm(`Tem certeza que deseja EXCLUIR a turma ${cls.name}? Isso não remove os alunos do sistema.`)) return;

        setDeletingId(cls.id);
        try {
            await deleteDoc(doc(db, "classes", cls.id));

            // Log Audit
            await logAudit({
                action: "CLASS_DELETE",
                userId: profile?.uid || "unknown",
                userName: profile?.name || "Sistema",
                targetId: cls.id,
                details: `Turma ${cls.name} excluída da listagem geral.`
            });

            setClasses(prev => prev.filter(c => c.id !== cls.id));
        } catch (err) {
            console.error("Delete error:", err);
            alert("Erro ao excluir turma.");
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Turmas</h1>
                    <p className="text-sm text-slate-500">Gestão de turmas e enturmação de alunos.</p>
                </div>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nova Turma
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-white border rounded-xl h-48 animate-pulse"></div>
                    ))
                ) : classes.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-dashed rounded-xl">
                        Nenhuma turma cadastrada.
                    </div>
                ) : (
                    classes.map((cls) => (
                        <Card key={cls.id} className="group hover:border-primary/50 transition-all cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xl">{cls.name}</CardTitle>
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        {shiftLabels[cls.shift] || cls.shift}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-slate-400" />
                                        -- Alunos
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex gap-2">
                                        <Badge variant="info">{cls.yearId || "2024"}</Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-rose-500 hover:bg-rose-50 p-1 h-auto"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDelete(cls);
                                            }}
                                            disabled={deletingId === cls.id}
                                        >
                                            {deletingId === cls.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                        </Button>
                                    </div>
                                    <Link href={`/app/classes/${cls.id}`}>
                                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 p-0 h-auto font-bold gap-1 group">
                                            Gerenciar
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
