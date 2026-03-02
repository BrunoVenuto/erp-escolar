"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Save, GraduationCap, Clock, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { logAudit } from "@/lib/utils/audit-logger";

export default function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [classData, setClassData] = useState<any>(null);

    useEffect(() => {
        async function loadClass() {
            try {
                const docRef = doc(db, "classes", unwrappedParams.id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setClassData(docSnap.data());
                } else {
                    setError("Turma não encontrada.");
                }
            } catch (err) {
                console.error(err);
                setError("Erro ao carregar dados da turma.");
            } finally {
                setLoading(false);
            }
        }
        loadClass();
    }, [unwrappedParams.id]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            shift: formData.get("shift") as string,
            yearId: formData.get("yearId") as string,
            updatedAt: serverTimestamp(),
        };

        try {
            if (!data.name) throw new Error("O nome da turma é obrigatório.");

            const docRef = doc(db, "classes", unwrappedParams.id);
            await updateDoc(docRef, data);

            // Log Audit
            await logAudit({
                action: "CLASS_UPDATE",
                userId: profile?.uid || "unknown",
                userName: profile?.name || "Sistema",
                targetId: unwrappedParams.id,
                details: `Turma ${data.name} atualizada.`
            });

            router.push(`/app/classes/${unwrappedParams.id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/app/classes/${unwrappedParams.id}`}>
                    <Button variant="ghost" size="sm" className="p-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">Editar Turma</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-primary" />
                            Dados da Turma
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            label="Nome da Turma"
                            name="name"
                            defaultValue={classData?.name}
                            placeholder="Ex: 9º Ano A"
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Turno
                                </label>
                                <select
                                    name="shift"
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    defaultValue={classData?.shift}
                                >
                                    <option value="morning">Manhã</option>
                                    <option value="afternoon">Tarde</option>
                                    <option value="night">Noite</option>
                                </select>
                            </div>

                            <Input
                                label="Ano Letivo"
                                name="yearId"
                                defaultValue={classData?.yearId || "2024"}
                                placeholder="2024"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="pt-4">
                            <Button type="submit" className="w-full gap-2 py-6" loading={saving}>
                                <Save className="w-4 h-4" />
                                Salvar Alterações
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
