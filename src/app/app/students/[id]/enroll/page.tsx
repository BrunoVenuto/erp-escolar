"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import { logAudit } from "@/lib/utils/audit-logger";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileUploader } from "@/components/ui/FileUploader";
import { ArrowLeft, Check, GraduationCap, FileCheck, Landmark } from "lucide-react";
import Link from "next/link";

export default function EnrollmentPage({ params, searchParams }: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ classId?: string }>
}) {
    const unwrappedParams = use(params);
    const { classId } = use(searchParams);
    const router = useRouter();
    const { profile } = useAuth();
    const [student, setStudent] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [selectedClassId, setSelectedClassId] = useState("");
    const [documents, setDocuments] = useState<Record<string, string>>({});

    useEffect(() => {
        async function load() {
            try {
                const sSnap = await getDoc(doc(db, "students", unwrappedParams.id));
                if (sSnap.exists()) {
                    setStudent({ id: sSnap.id, ...sSnap.data() });
                } else {
                    alert("Aluno não encontrado.");
                    router.push("/app/students");
                }

                const cSnap = await getDocs(collection(db, "classes"));
                const classesData = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setClasses(classesData);

                if (classId) {
                    setSelectedClassId(classId);
                }
            } catch (err) {
                console.error(err);
                alert("Erro ao carregar dados. Verifique sua conexão.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [unwrappedParams.id, classId, router]);

    async function handleFinish() {
        if (!selectedClassId) {
            alert("Por favor, selecione uma turma.");
            return;
        }

        setLoading(true);
        try {
            const enrollmentId = `${unwrappedParams.id}_${selectedClassId}`;

            // Check if already enrolled
            const existingSnap = await getDoc(doc(db, "enrollments", enrollmentId));
            if (existingSnap.exists() && existingSnap.data()?.status === 'active') {
                alert("Este aluno já está matriculado nesta turma.");
                setLoading(false);
                return;
            }

            await setDoc(doc(db, "enrollments", enrollmentId), {
                studentId: unwrappedParams.id,
                classId: selectedClassId,
                academicYear: 2026,
                status: 'active',
                documents: documents,
                enrolledAt: serverTimestamp(),
            });

            // Update student status if needed
            await setDoc(doc(db, "students", unwrappedParams.id), {
                status: "active"
            }, { merge: true });

            // Log Audit
            await logAudit({
                action: "STUDENT_ENROLL",
                userId: profile?.uid || "unknown",
                userName: profile?.name || "Sistema",
                targetId: unwrappedParams.id,
                details: `Aluno ${student?.name} matriculado na turma com ID ${selectedClassId}.`
            });

            alert("Matrícula realizada com sucesso!");
            router.push(`/app/classes/${selectedClassId}`);
        } catch (err: any) {
            console.error(err);
            alert("Erro ao realizar matrícula: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading && !student) return <div className="p-8 text-center animate-pulse">Carregando aluno...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/app/students">
                    <Button variant="ghost" size="sm" className="p-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Efetivar Matrícula</h1>
                    <p className="text-sm text-slate-500">Aluno: <span className="font-semibold text-slate-700">{student?.name}</span></p>
                </div>
            </div>

            {/* Wizard Steps Indicator */}
            <div className="flex items-center justify-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= 1 ? "bg-primary text-white" : "bg-slate-200 text-slate-500"}`}>1</div>
                <div className={`h-1 w-12 rounded-full ${step >= 2 ? "bg-primary" : "bg-slate-200"}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= 2 ? "bg-primary text-white" : "bg-slate-200 text-slate-500"}`}>2</div>
                <div className={`h-1 w-12 rounded-full ${step >= 3 ? "bg-primary" : "bg-slate-200"}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= 3 ? "bg-primary text-white" : "bg-slate-200 text-slate-500"}`}>3</div>
            </div>

            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-primary" />
                            Escolha a Turma
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                            {classes.map((cls) => (
                                <button
                                    key={cls.id}
                                    onClick={() => setSelectedClassId(cls.id)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${selectedClassId === cls.id
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-slate-100 hover:border-slate-200"
                                        }`}
                                >
                                    <div>
                                        <p className="font-bold text-slate-800">{cls.name}</p>
                                        <p className="text-xs text-slate-500 uppercase tracking-tighter">{cls.shift === 'morning' ? 'Manhã' : 'Tarde'} • {cls.yearId || '2026'}</p>
                                    </div>
                                    {selectedClassId === cls.id && <Check className="w-5 h-5 text-primary" />}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button disabled={!selectedClassId} onClick={() => setStep(2)}>Próximo Passo</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-primary" />
                            Anexar Documentos
                        </CardTitle>
                        <p className="text-xs text-slate-500">Obrigatório para efetivar a matrícula no sistema municipal.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FileUploader
                            studentId={unwrappedParams.id}
                            docType="RG_ALUNO"
                            onUploadComplete={(url) => setDocuments(prev => ({ ...prev, rg: url }))}
                        />
                        <FileUploader
                            studentId={unwrappedParams.id}
                            docType="CPF_ALUNO"
                            onUploadComplete={(url) => setDocuments(prev => ({ ...prev, cpf: url }))}
                        />
                        <FileUploader
                            studentId={unwrappedParams.id}
                            docType="RESIDENCIA"
                            onUploadComplete={(url) => setDocuments(prev => ({ ...prev, residence: url }))}
                        />

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                            <Button onClick={() => setStep(3)}>Revisar e Finalizar</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Landmark className="w-5 h-5 text-primary" />
                            Revisão Final
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Aluno</span>
                                <span className="font-bold text-slate-800">{student?.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Turma Selecionada</span>
                                <span className="font-bold text-primary">{classes.find(c => c.id === selectedClassId)?.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Documentos Anexados</span>
                                <span className="font-bold text-emerald-600">{Object.keys(documents).length} arquivos</span>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 leading-relaxed">
                            Ao confirmar, o aluno será oficialmente enturmado e os registros de auditoria serão gerados conforme a LGPD.
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
                            <Button loading={loading} onClick={handleFinish} className="px-10">Confirmar Matrícula</Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
