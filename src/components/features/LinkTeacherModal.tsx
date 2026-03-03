"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2, X, BookOpen, User } from "lucide-react";

interface Teacher {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
}

interface LinkTeacherModalProps {
    classId: string;
    className: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function LinkTeacherModal({ classId, className, onClose, onSuccess }: LinkTeacherModalProps) {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [selectedTeacherId, setSelectedTeacherId] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                // Load Teachers
                const tQuery = query(collection(db, "users"), where("role", "==", "professor"));
                const tSnap = await getDocs(tQuery);
                const tList = tSnap.docs.map(d => ({ id: d.id, name: d.data().name || d.id }));
                setTeachers(tList);

                // Load Subjects
                const sSnap = await getDocs(collection(db, "subjects"));
                const sList = sSnap.docs.map(d => ({ id: d.id, name: d.data().name }));
                setSubjects(sList);
            } catch (err) {
                console.error("Error loading modal data:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeacherId || !selectedSubjectId) return;

        setSaving(true);
        try {
            await addDoc(collection(db, "classSubjects"), {
                classId,
                teacherId: selectedTeacherId,
                subjectId: selectedSubjectId,
                createdAt: serverTimestamp(),
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error saving link:", err);
            alert("Erro ao salvar o vínculo.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                    <div>
                        <CardTitle className="text-xl font-bold">Vincular Professor</CardTitle>
                        <p className="text-xs text-slate-500 mt-1">Turma: <span className="font-bold text-slate-700">{className}</span></p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full h-8 w-8 p-0">
                        <X className="w-4 h-4" />
                    </Button>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-slate-500">Buscando dados...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <BookOpen className="w-3 h-3" />
                                    Disciplina
                                </label>
                                <select
                                    required
                                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                >
                                    <option value="">Selecione a disciplina</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    Professor
                                </label>
                                <select
                                    required
                                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    value={selectedTeacherId}
                                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                                >
                                    <option value="">Selecione o professor</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1" loading={saving} disabled={!selectedTeacherId || !selectedSubjectId}>
                                    Salvar Vínculo
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
