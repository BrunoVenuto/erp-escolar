"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ClipboardCheck, BookOpen, Clock, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

type ClassSubject = {
    id: string;
    classId: string;
    subjectId: string;
    teacherId: string;
    className?: string;
    subjectName?: string;
    shift?: string;
};

export default function AttendanceDashboardPage() {
    const { profile } = useAuth();
    const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMyClasses() {
            if (!profile?.teacherId) {
                setLoading(false);
                return;
            }

            try {
                const q = query(
                    collection(db, "classSubjects"),
                    where("teacherId", "==", profile.teacherId)
                );
                const snap = await getDocs(q);

                const data = await Promise.all(snap.docs.map(async (d) => {
                    const cs = { id: d.id, ...d.data() } as ClassSubject;

                    // Fetch Class Name
                    const clsSnap = await getDoc(doc(db, "classes", cs.classId));
                    if (clsSnap.exists()) {
                        cs.className = clsSnap.data().name;
                        cs.shift = clsSnap.data().shift;
                    }

                    // Fetch Subject Name
                    const subSnap = await getDoc(doc(db, "subjects", cs.subjectId));
                    if (subSnap.exists()) {
                        cs.subjectName = subSnap.data().name;
                    }

                    return cs;
                }));

                setClassSubjects(data);
            } catch (err) {
                console.error("Error fetching teacher classes:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchMyClasses();
    }, [profile?.teacherId]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Diário & Frequência</h1>
                <p className="text-sm text-slate-500">Selecione uma turma para realizar a chamada e registrar o conteúdo da aula.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white border rounded-xl h-40 animate-pulse"></div>
                    ))
                ) : classSubjects.length === 0 ? (
                    <Card className="col-span-full border-dashed p-12 text-center text-slate-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                        <p>Você não possui turmas ou disciplinas vinculadas.</p>
                        <p className="text-xs mt-1">Entre em contato com a secretaria para configurar seus vínculos.</p>
                    </Card>
                ) : (
                    classSubjects.map((cs) => (
                        <Card key={cs.id} className="hover:border-primary/50 transition-all flex flex-col">
                            <CardHeader className="pb-2">
                                <Badge variant="info" className="w-fit mb-2 uppercase tracking-tighter">
                                    {cs.subjectName || "Disciplina"}
                                </Badge>
                                <CardTitle>{cs.className || "Turma"}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {cs.shift === 'morning' ? 'Manhã' : 'Tarde'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        Lista de presença
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50">
                                    <Link href={`/app/attendance/${cs.id}`}>
                                        <Button className="w-full gap-2 group">
                                            Iniciar Chamada
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
