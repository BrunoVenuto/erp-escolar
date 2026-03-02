"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Save, User, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export default function NewStudentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            enrollmentNumber: formData.get("enrollmentNumber") as string,
            status: "active",
            parentName: formData.get("parentName") as string,
            emergencyPhone: formData.get("emergencyPhone") as string,
            birthDate: formData.get("birthDate") as string,
            address: formData.get("address") as string,
            createdAt: serverTimestamp(),
        };

        try {
            if (!data.name) throw new Error("O nome é obrigatório.");

            await addDoc(collection(db, "students"), data);
            router.push("/app/students");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/app/students">
                    <Button variant="ghost" size="sm" className="p-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">Cadastrar Novo Aluno</h1>
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
                                <Input label="Nome Completo" name="name" placeholder="Ex: João da Silva" required />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="E-mail" name="email" type="email" placeholder="aluno@escola.br" />
                                    <Input label="Matrícula" name="enrollmentNumber" placeholder="2024001" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Data de Nascimento" name="birthDate" type="date" />
                                    <Input label="Telefone Emergência" name="emergencyPhone" placeholder="(00) 00000-0000" />
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
                                <Input name="address" placeholder="Rua, Número, Bairro, CEP" />
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
                                <Input label="Nome do Responsável" name="parentName" placeholder="Pai, Mãe ou Tutor" />
                            </CardContent>
                        </Card>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full gap-2 py-6" loading={loading}>
                            <Save className="w-4 h-4" />
                            Salvar Cadastro
                        </Button>

                        <p className="text-center text-xs text-slate-500">
                            * O aluno será cadastrado como ativo por padrão após a criação.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
