"use client";

import { useState, useEffect, use } from "react";
import {
    doc,
    getDoc,
    getDocs,
    query,
    collection,
    where,
    serverTimestamp,
    writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import { logAudit } from "@/lib/utils/audit-logger";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Save, Users, FileText, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type StudentGrade = {
    studentId: string;
    name: string;
    gradeId?: string;
    value: string;
};

export default function GradeEntryPage({ params }: { params: Promise<{ classSubjectId: string, assessmentId: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const { profile } = useAuth();
    const [assessment, setAssessment] = useState<any>(null);
    const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const assSnap = await getDoc(doc(db, "assessments", unwrappedParams.assessmentId));
                if (!assSnap.exists()) throw new Error("Avaliação não encontrada.");
                setAssessment({ id: assSnap.id, ...assSnap.data() });

                const csSnap = await getDoc(doc(db, "classSubjects", unwrappedParams.classSubjectId));
                if (!csSnap.exists()) throw new Error("Vínculo não encontrado.");
                const classId = csSnap.data().classId;

                const enrSnap = await getDocs(
                    query(collection(db, "enrollments"), where("classId", "==", classId))
                );

                const gradesSnap = await getDocs(
                    query(collection(db, "grades"), where("assessmentId", "==", unwrappedParams.assessmentId))
                );
                const existingGrades: Record<string, { id: string, value: number }> = {};
                gradesSnap.forEach(d => {
                    const data = d.data();
                    existingGrades[data.studentId] = { id: d.id, value: data.value };
                });

                const studentPromises = enrSnap.docs.map(async (d) => {
                    const enr = d.data();
                    const stSnap = await getDoc(doc(db, "students", enr.studentId));
                    if (!stSnap.exists()) return null;

                    const studentId = stSnap.id;
                    const res: StudentGrade = {
                        studentId,
                        name: stSnap.data().name as string,
                        gradeId: existingGrades[studentId]?.id,
                        value: existingGrades[studentId] ? existingGrades[studentId].value.toString() : ""
                    };
                    return res;
                });

                const results = await Promise.all(studentPromises);
                const list = results.filter((s): s is StudentGrade => s !== null);
                setStudentGrades(list.sort((a, b) => a.name.localeCompare(b.name)));

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [unwrappedParams.classSubjectId, unwrappedParams.assessmentId]);

    const updateGrade = (studentId: string, value: string) => {
        if (value !== "" && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 10)) return;
        setStudentGrades(prev => prev.map(sg => sg.studentId === studentId ? { ...sg, value } : sg));
    };

    async function handleSave() {
        setSaving(true);
        try {
            const batch = writeBatch(db);

            studentGrades.forEach(sg => {
                if (sg.value === "") return;

                const gradeRef = sg.gradeId ? doc(db, "grades", sg.gradeId) : doc(collection(db, "grades"));
                batch.set(gradeRef, {
                    studentId: sg.studentId,
                    assessmentId: unwrappedParams.assessmentId,
                    classSubjectId: unwrappedParams.classSubjectId,
                    value: Number(sg.value),
                    updatedAt: serverTimestamp(),
                }, { merge: true });
            });

            await batch.commit();

            // Log Audit
            await logAudit({
                action: "GRADE_UPDATE",
                userId: profile?.uid || "unknown",
                userName: profile?.name || "Sistema",
                targetId: unwrappedParams.assessmentId,
                details: `Lançamento de notas para a avaliação ${assessment?.name || unwrappedParams.assessmentId}.`
            });

            alert("Notas salvas com sucesso!");
            router.back();
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar notas.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="p-8 text-center animate-pulse">Carregando lista de alunos...</div>;

    const average = studentGrades
        .filter(sg => sg.value !== "")
        .reduce((acc, sg, _, arr) => acc + (Number(sg.value) / arr.length), 0);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <Link href={`/app/grades/${unwrappedParams.classSubjectId}`}>
                        <Button variant="ghost" size="sm" className="p-2">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Lançamento de Notas</h1>
                        <p className="text-sm text-slate-500">
                            {assessment?.name} • <Badge variant="info">{assessment?.type}</Badge>
                        </p>
                    </div>
                </div>
                <Button onClick={handleSave} loading={saving} className="gap-2 px-8">
                    <Save className="w-4 h-4" />
                    Salvar Notas
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Estudantes
                            </CardTitle>
                        </CardHeader>
                        <div className="overflow-hidden bg-white">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Aluno</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Nota (0-10)</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {studentGrades.map((sg) => (
                                        <tr key={sg.studentId} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-slate-700">{sg.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="10"
                                                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-center focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    value={sg.value}
                                                    onChange={(e) => updateGrade(sg.studentId, e.target.value)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {sg.value !== "" ? (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 inline-block" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-dashed inline-block" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Resumo da Turma
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center py-4">
                                <p className="text-3xl font-black text-primary">{average.toFixed(1)}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Média Geral</p>
                            </div>
                            <div className="space-y-2 border-t pt-4">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Total de Alunos</span>
                                    <span className="font-bold">{studentGrades.length}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Notas Lançadas</span>
                                    <span className="font-bold text-emerald-600">{studentGrades.filter(sg => sg.value !== "").length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-2">
                        <h4 className="text-xs font-bold text-primary flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            Dica Pro
                        </h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed italic">
                            Use o ponto (.) para casas decimais. Ex: 8.5. O sistema salva automaticamente as alterações ao clicar no botão superior.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
