"use client";

import { useState, useEffect, use } from "react";
import {
    doc,
    getDoc,
    getDocs,
    query,
    collection,
    where,
    orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    ArrowLeft,
    Printer,
    Download,
    Calendar,
    Users,
    CheckCircle,
    XCircle,
    Clock,
    FileText
} from "lucide-react";
import Link from "next/link";

type AttendanceStats = {
    studentId: string;
    name: string;
    present: number;
    absent: number;
    late: number;
    total: number;
};

export default function AttendanceReportPage({ params }: { params: Promise<{ classSubjectId: string }> }) {
    const unwrappedParams = use(params);
    const [stats, setStats] = useState<AttendanceStats[]>([]);
    const [lessons, setLessons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [classSubject, setClassSubject] = useState<any>(null);

    useEffect(() => {
        async function load() {
            try {
                const csSnap = await getDoc(doc(db, "classSubjects", unwrappedParams.classSubjectId));
                if (!csSnap.exists()) throw new Error("Vínculo não encontrado.");
                const csData = csSnap.data();

                const [cSnap, sSnap] = await Promise.all([
                    getDoc(doc(db, "classes", csData.classId)),
                    getDoc(doc(db, "subjects", csData.subjectId))
                ]);

                setClassSubject({
                    className: cSnap.exists() ? cSnap.data().name : "Turma",
                    subjectName: sSnap.exists() ? sSnap.data().name : "Disciplina"
                });

                // Load Sessions for this classSubject with index fallback
                let sessionIds: string[] = [];
                try {
                    const sessionsSnap = await getDocs(
                        query(collection(db, "attendanceSessions"), where("classSubjectId", "==", unwrappedParams.classSubjectId), orderBy("date", "desc"))
                    );
                    sessionIds = sessionsSnap.docs.map(d => d.id);
                } catch (sErr) {
                    console.warn("Sessions query failed, falling back to simple query:", sErr);
                    const simpleSnap = await getDocs(
                        query(collection(db, "attendanceSessions"), where("classSubjectId", "==", unwrappedParams.classSubjectId))
                    );
                    sessionIds = simpleSnap.docs
                        .map(d => ({ id: d.id, ...d.data() } as any))
                        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
                        .map(d => d.id);
                }

                // Load Enrolled Students
                const enrSnap = await getDocs(
                    query(collection(db, "enrollments"), where("classId", "==", csData.classId))
                );

                const studentStats: AttendanceStats[] = await Promise.all(enrSnap.docs.map(async (d) => {
                    const enr = d.data();
                    const stSnap = await getDoc(doc(db, "students", enr.studentId));
                    const name = stSnap.exists() ? stSnap.data().name : "Aluno";

                    const sStats: AttendanceStats = {
                        studentId: enr.studentId,
                        name,
                        present: 0,
                        absent: 0,
                        late: 0,
                        total: sessionIds.length
                    };

                    if (sessionIds.length > 0) {
                        const entriesSnap = await getDocs(
                            query(collection(db, "attendanceEntries"), where("studentId", "==", enr.studentId), where("sessionId", "in", sessionIds))
                        );
                        entriesSnap.forEach(ed => {
                            const status = ed.data().status;
                            if (status === "present") sStats.present++;
                            else if (status === "absent") sStats.absent++;
                            else if (status === "late") sStats.late++;
                        });
                    }

                    return sStats;
                }));

                setStats(studentStats.sort((a, b) => a.name.localeCompare(b.name)));

                // Load Lessons with fallback for missing indexes
                try {
                    const lessonsSnap = await getDocs(
                        query(collection(db, "lessons"), where("classSubjectId", "==", unwrappedParams.classSubjectId), orderBy("date", "desc"))
                    );
                    setLessons(lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                } catch (idxErr) {
                    console.warn("Lessons query with orderBy failed (likely missing index), falling back to simple query:", idxErr);
                    const simpleSnap = await getDocs(
                        query(collection(db, "lessons"), where("classSubjectId", "==", unwrappedParams.classSubjectId))
                    );
                    const sorted = simpleSnap.docs
                        .map(d => ({ id: d.id, ...d.data() } as any))
                        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
                    setLessons(sorted);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [unwrappedParams.classSubjectId]);

    if (loading) return <div className="p-8 text-center animate-pulse">Gerando relatório de frequência...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <Link href="/app/attendance">
                        <Button variant="ghost" size="sm" className="p-2">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800">Relatório de Frequência</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </Button>
                </div>
            </div>

            <Card className="print:shadow-none print:border-none">
                <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between print:bg-white print:p-4">
                    <div>
                        <CardTitle>{classSubject?.className}</CardTitle>
                        <p className="text-sm text-primary font-bold">{classSubject?.subjectName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400">Total de Aulas</p>
                        <p className="text-2xl font-black text-slate-800">{stats[0]?.total || 0}</p>
                    </div>
                </CardHeader>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Estudante</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Presenças</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Faltas</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Atrasos</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">% Freq.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.map((s) => {
                                const perc = s.total > 0 ? ((s.present + s.late) / s.total) * 100 : 100;
                                return (
                                    <tr key={s.studentId} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-700">{s.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="success" className="gap-1 font-mono">
                                                <CheckCircle className="w-3 h-3" />
                                                {s.present}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="danger" className="gap-1 font-mono">
                                                <XCircle className="w-3 h-3" />
                                                {s.absent}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="warning" className="gap-1 font-mono">
                                                <Clock className="w-3 h-3" />
                                                {s.late}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-black ${perc >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {perc.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card className="print:shadow-none print:border-none">
                <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Histórico de Conteúdos (Aulas)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {lessons.length === 0 ? (
                            <div className="p-8 text-center text-sm text-slate-500 italic">
                                Nenhum conteúdo registrado para esta disciplina ainda.
                            </div>
                        ) : (
                            lessons.map((lesson) => (
                                <div key={lesson.id} className="p-6 space-y-2 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="neutral" className="text-[10px] font-mono tracking-tight bg-white">
                                            {lesson.date ? new Date(lesson.date + 'T12:00:00').toLocaleDateString('pt-BR') : '---'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                                        {lesson.content}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4 no-print">
                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-blue-800">Uso Administrativo</h4>
                    <p className="text-xs text-blue-700 leading-relaxed mt-1">
                        Estudantes com frequência abaixo de 75% são destacados em vermelho para acompanhamento da coordenação pedagógica.
                    </p>
                </div>
            </div>
        </div>
    );
}
