"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Save, GraduationCap, Clock, Calendar } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { logAudit } from "@/lib/utils/audit-logger";

export default function NewClassPage() {
    const router = useRouter();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            shift: formData.get("shift") as string,
            yearId: formData.get("yearId") as string || "2026",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        try {
            if (!data.name) throw new Error("O nome da turma é obrigatório.");

            const docRef = await addDoc(collection(db, "classes"), data);

            // Log Audit
            await logAudit({
                action: "CLASS_CREATE",
                userId: profile?.uid || "unknown",
                userName: profile?.name || "Sistema",
                targetId: docRef.id,
                details: `Turma ${data.name} criada para o ano ${data.yearId}.`
            });

            router.push("/app/classes");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/app/classes">
                    <Button variant="ghost" size="sm" className="p-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">Nova Turma</h1>
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
                                    defaultValue="morning"
                                >
                                    <option value="morning">Manhã</option>
                                    <option value="afternoon">Tarde</option>
                                    <option value="night">Noite</option>
                                </select>
                            </div>

                            <Input
                                label="Ano Letivo"
                                name="yearId"
                                defaultValue="2026"
                                placeholder="2026"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="pt-4">
                            <Button type="submit" className="w-full gap-2 py-6" loading={loading}>
                                <Save className="w-4 h-4" />
                                Salvar Turma
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
