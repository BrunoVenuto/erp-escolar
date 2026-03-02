"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FileSpreadsheet, BookOpen, Clock, Users, ArrowRight, Settings } from "lucide-react";
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

export default function GradesDashboardPage() {
    const { profile, isAdmin } = useAuth();
    const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMyClasses() {
            if (!profile?.teacherId && !isAdmin) {
                setLoading(false);
                return;
            }

            try {
                let q;
                if (isAdmin) {
                    q = query(collection(db, "classSubjects"));
                } else {
                    q = query(
                        collection(db, "classSubjects"),
                        where("teacherId", "==", profile?.teacherId)
                    );
                }

                const snap = await getDocs(q);

                const data = await Promise.all(snap.docs.map(async (d) => {
                    const cs = { id: d.id, ...d.data() } as ClassSubject;
                    const [clsSnap, subSnap] = await Promise.all([
                        getDoc(doc(db, "classes", cs.classId)),
                        getDoc(doc(db, "subjects", cs.subjectId))
                    ]);

                    if (clsSnap.exists()) {
                        cs.className = clsSnap.data().name;
                        cs.shift = clsSnap.data().shift;
                    }
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
    }, [profile?.teacherId, isAdmin]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Notas & Avaliações</h1>
                    <p className="text-sm text-slate-500">Gerencie avaliações e lance as notas dos estudantes.</p>
                </div>
                {isAdmin && (
                    <Link href="/app/grades/config">
                        <Button variant="outline" className="gap-2">
                            <Settings className="w-4 h-4" />
                            Configurar Pesos
                        </Button>
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white border rounded-xl h-40 animate-pulse"></div>
                    ))
                ) : classSubjects.length === 0 ? (
                    <Card className="col-span-full border-dashed p-12 text-center text-slate-500">
                        <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                        <p>Nenhuma turma encontrada para lançamento de notas.</p>
                    </Card>
                ) : (
                    classSubjects.map((cs) => (
                        <Card key={cs.id} className="hover:border-primary/50 transition-all flex flex-col">
                            <CardHeader className="pb-2">
                                <Badge variant="success" className="w-fit mb-2 uppercase tracking-tighter">
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
                                        Lançamento Bimestral
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50">
                                    <Link href={`/app/grades/${cs.id}`}>
                                        <Button className="w-full gap-2 group variant-primary">
                                            Gerenciar Avaliações
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
