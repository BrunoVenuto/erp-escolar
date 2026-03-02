"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Save, User, MapPin, Phone, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { logAudit } from "@/lib/utils/audit-logger";

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [studentData, setStudentData] = useState<any>(null);

    useEffect(() => {
        async function loadStudent() {
            try {
                const docRef = doc(db, "students", unwrappedParams.id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setStudentData(docSnap.data());
                } else {
                    setError("Estudante não encontrado.");
                }
            } catch (err) {
                console.error(err);
                setError("Erro ao carregar dados do estudante.");
            } finally {
                setLoading(false);
            }
        }
        loadStudent();
    }, [unwrappedParams.id]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            enrollmentNumber: formData.get("enrollmentNumber") as string,
            parentName: formData.get("parentName") as string,
            emergencyPhone: formData.get("emergencyPhone") as string,
            birthDate: formData.get("birthDate") as string,
            address: formData.get("address") as string,
            updatedAt: serverTimestamp(),
        };

        try {
            if (!data.name) throw new Error("O nome é obrigatório.");

            const docRef = doc(db, "students", unwrappedParams.id);
            await updateDoc(docRef, data);

            // Log Audit
            await logAudit({
                action: "STUDENT_UPDATE",
                userId: profile?.uid || "unknown",
                userName: profile?.name || "Sistema",
                targetId: unwrappedParams.id,
                details: `Dados do aluno ${data.name} atualizados.`
            });

            router.push("/app/students");
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

    if (error && !studentData) return (
        <div className="p-8 text-center space-y-4">
            <p className="text-rose-600 font-bold">{error}</p>
            <Link href="/app/students">
                <Button variant="outline">Voltar para Lista</Button>
            </Link>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/app/students">
                    <Button variant="ghost" size="sm" className="p-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">Editar Aluno</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    Informações Pessoais
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    label="Nome Completo"
                                    name="name"
                                    defaultValue={studentData?.name}
                                    placeholder="Ex: João da Silva"
                                    required
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="E-mail"
                                        name="email"
                                        type="email"
                                        defaultValue={studentData?.email}
                                        placeholder="aluno@escola.br"
                                    />
                                    <Input
                                        label="Matrícula"
                                        name="enrollmentNumber"
                                        defaultValue={studentData?.enrollmentNumber}
                                        placeholder="2026001"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Data de Nascimento"
                                        name="birthDate"
                                        type="date"
                                        defaultValue={studentData?.birthDate}
                                    />
                                    <Input
                                        label="Telefone Emergência"
                                        name="emergencyPhone"
                                        defaultValue={studentData?.emergencyPhone}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    Endereço
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Input
                                    name="address"
                                    defaultValue={studentData?.address}
                                    placeholder="Rua, Número, Bairro, CEP"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Phone className="w-5 h-5 text-primary" />
                                    Família
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    label="Nome do Responsável"
                                    name="parentName"
                                    defaultValue={studentData?.parentName}
                                    placeholder="Pai, Mãe ou Tutor"
                                />
                            </CardContent>
                        </Card>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full gap-2 py-6" loading={saving}>
                            <Save className="w-4 h-4" />
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
