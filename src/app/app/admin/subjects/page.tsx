"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, serverTimestamp, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, Plus, Trash2, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface Subject {
    id: string;
    name: string;
    createdAt?: any;
}

export default function AdminSubjectsPage() {
    const { isAdmin } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        loadSubjects();
    }, []);

    async function loadSubjects() {
        setLoading(true);
        try {
            const q = query(collection(db, "subjects"), orderBy("name", "asc"));
            const snap = await getDocs(q);
            setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));
        } catch (err) {
            console.error("Error loading subjects:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;

        setSaving(true);
        try {
            await addDoc(collection(db, "subjects"), {
                name: newName.trim(),
                createdAt: serverTimestamp(),
            });
            setNewName("");
            loadSubjects();
        } catch (err) {
            console.error(err);
            alert("Erro ao criar disciplina.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Tem certeza que deseja excluir a disciplina "${name}"?`)) return;

        try {
            await deleteDoc(doc(db, "subjects", id));
            loadSubjects();
        } catch (err) {
            console.error(err);
            alert("Erro ao excluir disciplina.");
        }
    }

    async function handleSeed() {
        const initialSubjects = ["História", "Geografia", "Artes", "Ensino Religioso"];
        setSaving(true);
        try {
            for (const name of initialSubjects) {
                // Check if already exists
                if (!subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) {
                    await addDoc(collection(db, "subjects"), {
                        name,
                        createdAt: serverTimestamp(),
                    });
                }
            }
            loadSubjects();
        } catch (err) {
            console.error(err);
            alert("Erro ao sincronizar disciplinas.");
        } finally {
            setSaving(false);
        }
    }

    if (!isAdmin) return <div className="p-8 text-center text-slate-500">Acesso negado.</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gestão de Disciplinas</h1>
                    <p className="text-sm text-slate-500">Cadastre e gerencie as matérias lecionadas na escola.</p>
                </div>
                <Button variant="outline" onClick={handleSeed} loading={saving} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Sincronizar Disciplinas Iniciais
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Plus className="w-4 h-4 text-primary" />
                                Nova Disciplina
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <Input
                                    label="Nome da Matéria"
                                    placeholder="Ex: História, Geografia..."
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                />
                                <Button type="submit" className="w-full" loading={saving}>
                                    Adicionar Disciplina
                                </Button>
                            </form>
                            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                                <p className="text-[10px] text-amber-800 leading-relaxed">
                                    Ao adicionar uma nova disciplina, ela ficará imediatamente disponível para vínculo com professores em todas as turmas.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                Lista de Disciplinas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading && subjects.length === 0 ? (
                                <div className="p-12 text-center animate-pulse text-slate-400 text-sm">Carregando...</div>
                            ) : subjects.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 text-sm">Nenhuma disciplina cadastrada.</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {subjects.map((subject) => (
                                        <div key={subject.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{subject.name}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                onClick={() => handleDelete(subject.id, subject.name)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
