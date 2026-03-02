"use client";

import { useState, useEffect, use } from "react";
import {
    doc,
    getDoc,
    getDocs,
    query,
    collection,
    where
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { calculateWeightedAverage, GradeRecord, WeightConfig } from "@/lib/utils/grade-utils";
import {
    ArrowLeft,
    Download,
    Printer,
    GraduationCap,
    FileText,
    CheckCircle,
    AlertCircle
} from "lucide-react";
import Link from "next/link";

type SubjectReport = {
    id: string;
    name: string;
    grades: { name: string, type: string, value: number }[];
    average: number;
};

export default function StudentReportCardPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const [student, setStudent] = useState<any>(null);
    const [reports, setReports] = useState<SubjectReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                // 1. Load Student
                const stSnap = await getDoc(doc(db, "students", unwrappedParams.id));
                if (!stSnap.exists()) throw new Error("Estudante não encontrado.");
                setStudent({ id: stSnap.id, ...stSnap.data() });

                // 2. Load Weights
                const weightSnap = await getDocs(collection(db, "gradeConfig"));
                const weights: WeightConfig[] = weightSnap.docs.map(d => d.data() as WeightConfig);

                // 3. Load Enrollments to find the class
                const enrSnap = await getDocs(
                    query(collection(db, "enrollments"), where("studentId", "==", unwrappedParams.id))
                );

                if (enrSnap.empty) {
                    setLoading(false);
                    return;
                }

                const classId = enrSnap.docs[0].data().classId;

                // 4. Load all ClassSubjects (Disciplinas) for this class
                const csSnap = await getDocs(
                    query(collection(db, "classSubjects"), where("classId", "==", classId))
                );

                const subjectReports: SubjectReport[] = await Promise.all(
                    csSnap.docs.map(async (csDoc) => {
                        const csData = csDoc.data();
                        const sSnap = await getDoc(doc(db, "subjects", csData.subjectId));
                        const subjectName = sSnap.exists() ? sSnap.data().name : "Disciplina";

                        // 5. Load Grades for this student in this classSubject
                        const gradesSnap = await getDocs(
                            query(
                                collection(db, "grades"),
                                where("studentId", "==", unwrappedParams.id),
                                where("classSubjectId", "==", csDoc.id)
                            )
                        );

                        const gradesList = await Promise.all(gradesSnap.docs.map(async (gDoc) => {
                            const gData = gDoc.data();
                            const assSnap = await getDoc(doc(db, "assessments", gData.assessmentId));
                            const assData = assSnap.exists() ? assSnap.data() : { name: "Avaliação", type: "Outro" };
                            return {
                                name: assData.name,
                                type: assData.type,
                                value: gData.value
                            };
                        }));

                        const gradeRecords: GradeRecord[] = gradesList.map(g => ({ type: g.type, value: g.value }));
                        const avg = calculateWeightedAverage(gradeRecords, weights);

                        return {
                            id: csDoc.id,
                            name: subjectName,
                            grades: gradesList,
                            average: avg
                        };
                    })
                );

                setReports(subjectReports.sort((a, b) => a.name.localeCompare(b.name)));

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [unwrappedParams.id]);

    if (loading) return <div className="p-8 text-center animate-pulse">Gerando boletim escolar...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between no-print mb-6">
                <div className="flex items-center gap-4">
                    <Link href={`/app/students`}>
                        <Button variant="ghost" size="sm" className="p-2">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800">Boletim Escolar</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </Button>
                    <Button size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        PDF
                    </Button>
                </div>
            </div>

            <Card className="border-t-4 border-t-primary shadow-lg bg-white overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
                <div className="bg-slate-50 border-b border-slate-100 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:bg-white print:p-4">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-black print:w-12 print:h-12 print:text-lg">
                            {student?.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 print:text-xl">{student?.name}</h2>
                            <p className="text-sm text-slate-500 font-medium">Matrícula: {student?.enrollmentNumber || 'N/A'}</p>
                            <div className="mt-1 flex gap-2 no-print">
                                <Badge variant="info">Ano Letivo 2024</Badge>
                                <Badge variant="success">Frequente</Badge>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-center min-w-[120px] print:border-none print:shadow-none">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Média Global</p>
                        <p className="text-3xl font-black text-primary print:text-2xl">
                            {(reports.reduce((acc, r) => acc + r.average, 0) / (reports.length || 1)).toFixed(1)}
                        </p>
                    </div>
                </div>

                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left print:text-sm">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 print:bg-slate-100">
                                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest print:px-4 print:py-2">Disciplina</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest no-print">Avaliações</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center print:px-4 print:py-2">Média Final</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right print:px-4 print:py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reports.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6 print:px-4 print:py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg no-print">
                                                <FileText className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <span className="font-bold text-slate-700">{r.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 no-print">
                                        <div className="flex flex-wrap gap-2 max-w-[300px]">
                                            {r.grades.length > 0 ? (
                                                r.grades.map((g, idx) => (
                                                    <div key={idx} className="flex flex-col items-center p-1.5 px-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{g.type}</span>
                                                        <span className="text-xs font-black text-slate-600">{g.value.toFixed(1)}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Sem notas lançadas</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center print:px-4 print:py-3">
                                        <span className={`text-lg font-black ${r.average >= 7 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {r.average.toFixed(1)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right print:px-4 print:py-3">
                                        <span className={`text-xs font-bold uppercase tracking-widest ${r.average >= 7 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {r.average >= 7 ? 'Aprovado' : r.grades.length > 0 ? 'Recuperação' : 'Pendente'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-3 text-slate-400">
                        <GraduationCap className="w-5 h-5 opacity-50" />
                        <p className="text-[10px] uppercase font-bold tracking-[0.2em]">Secretaria Municipal de Educação - Sistema Gênesis</p>
                    </div>
                </div>
            </Card>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-4 no-print">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-amber-800">Atenção Responsável</h4>
                    <p className="text-xs text-amber-700 leading-relaxed mt-1">
                        Este é um boletim informativo parcial. Médias finais e aprovação oficial serão confirmadas ao encerramento do conselho de classe no final do ano letivo.
                    </p>
                </div>
            </div>
        </div>
    );
}
