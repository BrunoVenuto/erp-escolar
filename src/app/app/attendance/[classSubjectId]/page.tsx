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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    ArrowLeft,
    Save,
    Users,
    BookOpen,
    CheckCircle2,
    XCircle,
    Clock,
    MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Attendee = {
    id: string; // studentId
    name: string;
    status: "present" | "absent" | "late";
};

type ClassSubjectInternal = {
    id: string;
    classId: string;
    subjectId: string;
    className?: string;
    subjectName?: string;
};

export default function AttendanceEntryPage({ params }: { params: Promise<{ classSubjectId: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const { profile } = useAuth();
    const classSubjectId = unwrappedParams.classSubjectId;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [classSubject, setClassSubject] = useState<ClassSubjectInternal | null>(null);
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [lessonContent, setLessonContent] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        async function load() {
            try {
                const csSnap = await getDoc(doc(db, "classSubjects", classSubjectId));
                if (!csSnap.exists()) throw new Error("Vínculo não encontrado.");

                const csDataRaw = csSnap.data();
                const csData: ClassSubjectInternal = {
                    id: csSnap.id,
                    classId: csDataRaw.classId,
                    subjectId: csDataRaw.subjectId
                };

                const [cSnap, sSnap] = await Promise.all([
                    getDoc(doc(db, "classes", csData.classId)),
                    getDoc(doc(db, "subjects", csData.subjectId))
                ]);

                csData.className = cSnap.exists() ? cSnap.data().name : "Turma";
                csData.subjectName = sSnap.exists() ? sSnap.data().name : "Disciplina";

                setClassSubject(csData);

                const enrSnap = await getDocs(
                    query(collection(db, "enrollments"), where("classId", "==", csData.classId))
                );

                const studentPromises = enrSnap.docs.map(async (d) => {
                    const enr = d.data();
                    const stSnap = await getDoc(doc(db, "students", enr.studentId));
                    return stSnap.exists() ? {
                        id: stSnap.id,
                        name: stSnap.data().name,
                        status: "present" as const
                    } : null;
                });

                const rawList = await Promise.all(studentPromises);
                const studentsList = rawList.filter(Boolean) as Attendee[];

                setAttendees(studentsList.sort((a, b) => (a.name || "").localeCompare(b.name || "")));

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [classSubjectId]);

    const toggleStatus = (id: string, newStatus: Attendee["status"]) => {
        setAttendees(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    };

    async function handleSave() {
        if (!lessonContent) {
            alert("Por favor, registre o conteúdo da aula.");
            return;
        }

        setSaving(true);
        try {
            const batch = writeBatch(db);

            const sessionRef = doc(collection(db, "attendanceSessions"));
            batch.set(sessionRef, {
                classSubjectId,
                date,
                teacherId: profile?.teacherId,
                createdAt: serverTimestamp(),
            });

            attendees.forEach(att => {
                const entryRef = doc(collection(db, "attendanceEntries"));
                batch.set(entryRef, {
                    sessionId: sessionRef.id,
                    studentId: att.id,
                    status: att.status,
                    createdAt: serverTimestamp(),
                });
            });

            const lessonRef = doc(collection(db, "lessons"));
            batch.set(lessonRef, {
                classSubjectId,
                date,
                content: lessonContent,
                teacherId: profile?.teacherId,
                createdAt: serverTimestamp(),
            });

            await batch.commit();
            router.push("/app/attendance");
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar diário.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="p-8 text-center animate-pulse">Carregando chamada...</div>;
    if (!classSubject) return <div className="p-8 text-center">Erro ao carregar dados.</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/app/attendance">
                        <Button variant="ghost" size="sm" className="p-2">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Lançar Chamada & Aula</h1>
                        <p className="text-sm text-slate-500">
                            {classSubject.className} • <span className="text-primary font-semibold">{classSubject.subjectName}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="date"
                        className="px-3 py-1.5 bg-white border rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <Button onClick={handleSave} loading={saving} className="gap-2">
                        <Save className="w-4 h-4" />
                        Salvar Diário
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary" />
                                Conteúdo da Aula
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                placeholder="Descreva o que foi trabalhado nesta aula..."
                                className="w-full h-64 p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                                value={lessonContent}
                                onChange={(e) => setLessonContent(e.target.value)}
                            />
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                                <MessageSquare className="w-4 h-4 text-blue-600 mt-1" />
                                <p className="text-xs text-blue-800 leading-relaxed">
                                    Estes dados serão utilizados para compor o histórico pedagógico da turma e ficarão visíveis para a direção.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Lista de Frequência
                            </CardTitle>
                            <span className="text-xs font-bold text-slate-400">{attendees.length} alunos matriculados</span>
                        </CardHeader>
                        <div className="divide-y divide-slate-100">
                            {attendees.map((att) => (
                                <div key={att.id} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${att.status === 'present' ? 'bg-emerald-500' :
                                            att.status === 'absent' ? 'bg-rose-500' : 'bg-amber-500'
                                            }`}>
                                            {att.name.charAt(0)}
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700">{att.name}</span>
                                    </div>

                                    <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
                                        <button
                                            onClick={() => toggleStatus(att.id, "present")}
                                            className={`p-1.5 rounded-md transition-all ${att.status === 'present' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                            title="Presente"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(att.id, "absent")}
                                            className={`p-1.5 rounded-md transition-all ${att.status === 'absent' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                            title="Faltou"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(att.id, "late")}
                                            className={`p-1.5 rounded-md transition-all ${att.status === 'late' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                            title="Atraso"
                                        >
                                            <Clock className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
