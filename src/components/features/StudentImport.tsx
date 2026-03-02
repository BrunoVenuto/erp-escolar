"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { logAudit } from "@/lib/utils/audit-logger";

interface StudentImportProps {
    classId: string;
    className: string;
    onComplete: () => void;
}

export function StudentImport({ classId, className, onComplete }: StudentImportProps) {
    const { profile } = useAuth();
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [error, setError] = useState("");

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "text/plain" && !file.name.endsWith(".txt")) {
            setError("Por favor, selecione um arquivo .txt");
            setStatus("error");
            return;
        }

        setImporting(true);
        setStatus("processing");
        setError("");

        try {
            const text = await file.text();
            const names = text.split(/\r?\n/).map(name => name.trim()).filter(name => name.length > 0);

            setProgress({ current: 0, total: names.length });

            for (let i = 0; i < names.length; i++) {
                const name = names[i];

                // 1. Create Student
                const studentData = {
                    name,
                    status: "active",
                    enrollmentNumber: `2026${Math.floor(1000 + Math.random() * 9000)}`, // Simple auto-gen
                    createdAt: serverTimestamp(),
                };

                const studentRef = await addDoc(collection(db, "students"), studentData);

                // 2. Create Enrollment
                await setDoc(doc(db, "enrollments", `${studentRef.id}_${classId}`), {
                    studentId: studentRef.id,
                    classId: classId,
                    academicYear: 2026,
                    status: 'active',
                    enrolledAt: serverTimestamp(),
                });

                setProgress(prev => ({ ...prev, current: i + 1 }));
            }

            // Log Audit
            await logAudit({
                action: "STUDENT_IMPORT_BATCH",
                userId: profile?.uid || "unknown",
                userName: profile?.name || "Sistema",
                targetId: classId,
                details: `Importação em lote de ${names.length} alunos para a turma ${className}.`
            });

            setStatus("success");
            setTimeout(() => {
                onComplete();
                setStatus("idle");
                setImporting(false);
            }, 2000);

        } catch (err: any) {
            console.error("Import error:", err);
            setError("Erro ao processar importação: " + err.message);
            setStatus("error");
            setImporting(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                    <input
                        type="file"
                        accept=".txt"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={importing}
                    />
                    <div
                        className={`inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg h-8 px-3 text-xs border border-slate-300 text-slate-700 hover:bg-slate-50 gap-2 ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {importing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <FileText className="w-3.5 h-3.5" />
                        )}
                        Importar Alunos (.txt)
                    </div>
                </label>

                {status === "success" && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold animate-in fade-in slide-in-from-left-2">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Concluído!
                    </div>
                )}
            </div>

            {status === "processing" && (
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>Processando Alunos...</span>
                        <span>{progress.current} / {progress.total}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {status === "error" && (
                <div className="flex items-center gap-1.5 text-rose-600 text-[10px] font-bold uppercase">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                </div>
            )}
        </div>
    );
}
