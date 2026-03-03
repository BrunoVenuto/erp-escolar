"use client";

import { useState, useEffect, use } from "react";
import { doc, getDoc, getDocs, deleteDoc, query, collection, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    ArrowLeft,
    Users,
    BookOpen,
    User,
    GraduationCap,
    Calendar,
    Clock,
    Pencil,
    Trash2,
    Loader2,
    X,
    Plus
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { logAudit } from "@/lib/utils/audit-logger";
import { LinkTeacherModal } from "@/components/features/LinkTeacherModal";

export default function ClassDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const { profile } = useAuth();
    const [schoolClass, setSchoolClass] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [classSubjects, setClassSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [deletingLink, setDeletingLink] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // 1. Fetch Class
                const classSnap = await getDoc(doc(db, "classes", unwrappedParams.id));
                if (classSnap.exists()) {
                    setSchoolClass({ id: classSnap.id, ...classSnap.data() });
                }

                // 2. Fetch Enrollments for this class
                const enrSnap = await getDocs(
                    query(collection(db, "enrollments"), where("classId", "==", unwrappedParams.id))
                );
                const enrData = enrSnap.docs.map(d => ({ enrollmentId: d.id, ...d.data() }));

                // 3. Fetch Student details
                const studentPromises = enrData.map(async (enr: any) => {
                    const stSnap = await getDoc(doc(db, "students", enr.studentId));
                    return stSnap.exists() ? { id: stSnap.id, enrollmentId: enr.enrollmentId, ...stSnap.data() } : null;
                });

                const studentsList = (await Promise.all(studentPromises)).filter(Boolean);
                setStudents(studentsList);

                // 4. Fetch linked Subjects and Teachers
                const csSnap = await getDocs(
                    query(collection(db, "classSubjects"), where("classId", "==", unwrappedParams.id))
                );

                const csList = await Promise.all(csSnap.docs.map(async (d) => {
                    const data = d.data();
                    const [sSnap, tSnap] = await Promise.all([
                        getDoc(doc(db, "subjects", data.subjectId)),
                        getDoc(doc(db, "users", data.teacherId))
                    ]);
                    return {
                        id: d.id,
                        subjectName: sSnap.exists() ? sSnap.data().name : "---",
                        teacherName: tSnap.exists() ? tSnap.data().name : "---"
                    };
                }));
                setClassSubjects(csList);

            } catch (err) {
                console.error("Error loading class data:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [unwrappedParams.id, refreshTrigger]);

    async function handleDeleteLink(linkId: string) {
        if (!confirm("Remover este vínculo de professor?")) return;
        setDeletingLink(linkId);
        try {
            await deleteDoc(doc(db, "classSubjects", linkId));
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error(err);
            alert("Erro ao remover vínculo.");
        } finally {
            setDeletingLink(null);
        }
    }

    async function handleRemoveStudent(enrollmentId: string, studentId: string, studentName: string) {
        if (!confirm(`Remover o aluno ${studentName} desta turma?`)) return;

        try {
            await deleteDoc(doc(db, "enrollments", enrollmentId));

            await logAudit({
                action: "STUDENT_UNENROLL",
                userId: profile?.uid || "unknown",
                userName: profile?.name || "Sistema",
                targetId: unwrappedParams.id,
                details: `Aluno ${studentName} (${studentId}) removido da turma ${schoolClass?.name}.`
            });

            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error("Error removing student:", err);
            alert("Erro ao remover aluno.");
        }
    }

    async function handleDelete() {
        if (!confirm(`Tem certeza que deseja EXCLUIR a turma ${schoolClass?.name}?\n\nIsso NÃO removerá os alunos do sistema, mas as enturmações desta turma serão perdidas.`)) return;

        setDeleting(true);
        try {
            await deleteDoc(doc(db, "classes", unwrappedParams.id));

            // Log Audit
            await logAudit({
                action: "CLASS_DELETE",
                userId: profile?.uid || "unknown",
                userName: profile?.name || "Sistema",
                targetId: unwrappedParams.id,
                details: `Turma ${schoolClass?.name} excluída.`
            });

            router.push("/app/classes");
            router.refresh();
        } catch (err) {
            console.error("Delete error:", err);
            alert("Erro ao excluir turma.");
        } finally {
            setDeleting(false);
        }
    }

    if (loading) return <div className="p-8 text-center animate-pulse">Carregando detalhes da turma...</div>;
    if (!schoolClass) return <div className="p-8 text-center">Turma não encontrada.</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/app/classes">
                        <Button variant="ghost" size="sm" className="p-2">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800">{schoolClass.name}</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Link href={`/app/classes/${unwrappedParams.id}/edit`}>
                        <Button variant="outline" className="gap-2">
                            <Pencil className="w-4 h-4" />
                            Editar Turma
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        className="text-rose-600 hover:bg-rose-50 gap-2"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                        Excluir
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                Informações da Turma
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500">Turno</span>
                                <Badge variant="info">{schoolClass.shift}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">{schoolClass.yearId || '2026'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500">Total de Alunos</span>
                                <span className="text-sm font-semibold">{students.length}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Disciplinas & Professores
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {classSubjects.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">Nenhuma disciplina vinculada ainda.</p>
                            ) : (
                                <div className="space-y-3">
                                    {classSubjects.map(cs => (
                                        <div key={cs.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-xs font-black text-primary uppercase tracking-widest">{cs.subjectName}</p>
                                                <button
                                                    onClick={() => handleDeleteLink(cs.id)}
                                                    disabled={deletingLink === cs.id}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all disabled:opacity-50"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                <User className="w-3 h-3 text-slate-400" />
                                                {cs.teacherName}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Button variant="outline" className="w-full mt-4 text-xs h-8" onClick={() => setShowLinkModal(true)}>Vincular Professor</Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Students List */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Lista de Alunos
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Link href={`/app/students?classId=${unwrappedParams.id}`}>
                                    <Button size="sm" className="text-xs h-8">Enturmar Aluno</Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <div className="divide-y divide-slate-100">
                            {students.length === 0 ? (
                                <div className="p-6 text-center text-sm text-slate-500">
                                    Nenhum aluno vinculado a esta turma.
                                </div>
                            ) : (
                                students.map((student) => (
                                    <div key={student.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                                                {student.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{student.name}</p>
                                                <p className="text-[10px] text-slate-400">Matrícula: {student.enrollmentNumber || '---'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="success">Frequente</Badge>
                                            <button
                                                onClick={() => handleRemoveStudent(student.enrollmentId, student.id, student.name)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                title="Remover da Turma"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {showLinkModal && (
                <LinkTeacherModal
                    classId={unwrappedParams.id}
                    className={schoolClass.name}
                    onClose={() => setShowLinkModal(false)}
                    onSuccess={() => setRefreshTrigger(prev => prev + 1)}
                />
            )}
        </div>
    );
}
