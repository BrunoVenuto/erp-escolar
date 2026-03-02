"use client";

import { useState, useEffect, use } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Plus, ArrowLeft, FileText, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";

type Assessment = {
    id: string;
    name: string;
    type: string;
    date: string;
    weight: number;
};

export default function ClassGradesPage({ params }: { params: Promise<{ classSubjectId: string }> }) {
    const unwrappedParams = use(params);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewForm, setShowNewForm] = useState(false);
    const [classSubject, setClassSubject] = useState<any>(null);

    // New Assessment Form
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState("Prova");
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        async function load() {
            try {
                const csSnap = await getDoc(doc(db, "classSubjects", unwrappedParams.classSubjectId));
                if (csSnap.exists()) {
                    const csData = csSnap.data();
                    const [cSnap, sSnap] = await Promise.all([
                        getDoc(doc(db, "classes", csData.classId)),
                        getDoc(doc(db, "subjects", csData.subjectId))
                    ]);
                    setClassSubject({
                        id: csSnap.id,
                        className: cSnap.exists() ? cSnap.data().name : "Turma",
                        subjectName: sSnap.exists() ? sSnap.data().name : "Disciplina"
                    });
                }

                const q = query(
                    collection(db, "assessments"),
                    where("classSubjectId", "==", unwrappedParams.classSubjectId)
                );
                const snap = await getDocs(q);
                setAssessments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Assessment)));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [unwrappedParams.classSubjectId]);

    async function handleCreate() {
        if (!newName) return;
        setLoading(true);
        try {
            const docRef = await addDoc(collection(db, "assessments"), {
                classSubjectId: unwrappedParams.classSubjectId,
                name: newName,
                type: newType,
                date: newDate,
                createdAt: serverTimestamp(),
            });
            setAssessments([...assessments, { id: docRef.id, name: newName, type: newType, date: newDate, weight: 0 }]);
            setShowNewForm(false);
            setNewName("");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    if (loading && !classSubject) return <div className="p-8 text-center animate-pulse">Carregando avaliações...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/app/grades">
                        <Button variant="ghost" size="sm" className="p-2">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Avaliações: {classSubject?.className}</h1>
                        <p className="text-sm text-primary font-medium">{classSubject?.subjectName}</p>
                    </div>
                </div>
                <Button className="gap-2" onClick={() => setShowNewForm(true)}>
                    <Plus className="w-4 h-4" />
                    Nova Avaliação
                </Button>
            </div>

            {showNewForm && (
                <Card className="border-primary bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-lg">Criar Nova Avaliação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="Nome da Avaliação" placeholder="Ex: Prova Mensal 1" value={newName} onChange={(e) => setNewName(e.target.value)} />
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                                <select
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value)}
                                >
                                    <option>Prova</option>
                                    <option>Trabalho</option>
                                    <option>Simulado</option>
                                    <option>Outro</option>
                                </select>
                            </div>
                            <Input label="Data" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setShowNewForm(false)}>Cancelar</Button>
                            <Button onClick={handleCreate}>Criar Avaliação</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessments.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-dashed rounded-xl">
                        Nenhuma avaliação criada para esta turma ainda.
                    </div>
                ) : (
                    assessments.map((ass) => (
                        <Card key={ass.id} className="hover:border-primary/50 transition-all flex flex-col">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="info" className="uppercase tracking-tighter">{ass.type}</Badge>
                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(ass.date).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                <CardTitle className="mt-2">{ass.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs font-bold text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        Média da Turma
                                    </div>
                                    <span className="text-slate-400">--</span>
                                </div>

                                <div className="pt-4 border-t border-slate-50">
                                    <Link href={`/app/grades/${unwrappedParams.classSubjectId}/${ass.id}`}>
                                        <Button variant="outline" className="w-full gap-2 group">
                                            <FileText className="w-4 h-4" />
                                            Lançar Notas
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
