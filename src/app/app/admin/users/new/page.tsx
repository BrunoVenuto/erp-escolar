"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setDoc, doc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Save, Shield, Mail, User } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { logAudit } from "@/lib/utils/audit-logger";

export default function NewUserAdminPage() {
    const router = useRouter();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = (formData.get("email") as string).toLowerCase().trim();
        const role = formData.get("role") as string;
        const name = formData.get("name") as string;

        try {
            if (!email || !name) throw new Error("Nome e Email são obrigatórios.");

            // We create a profile document with an ID that is just a placeholder 
            // OR use the email as an ID? Better to use a random ID but Store the email.
            // When the user registers with this email, the app will find this profile.

            // Actually, we can't use email as doc ID easily due to special chars,
            // but we can query by email later.

            await addDoc(collection(db, "users"), {
                name,
                email,
                role,
                status: "pending",
                createdAt: serverTimestamp(),
                createdBy: profile?.uid || "admin"
            });

            // Log Audit
            await logAudit({
                action: "USER_ROLE_CHANGE", // Generic for now
                userId: profile?.uid || "unknown",
                userName: profile?.name || "Sistema",
                targetId: email,
                details: `Convite enviado/Perfil pré-criado para ${name} (${email}) como ${role}.`
            });

            router.push("/app/admin/users");
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
                <Link href="/app/admin/users">
                    <Button variant="ghost" size="sm" className="p-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">Convidar Usuário</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Dados do Funcionário
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            label="Nome Completo"
                            name="name"
                            placeholder="Ex: Helena Oliveira"
                            required
                        />

                        <Input
                            label="E-mail"
                            name="email"
                            type="email"
                            placeholder="helena@escola.br"
                            required
                        />

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Nível de Acesso
                            </label>
                            <select
                                name="role"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                defaultValue="professor"
                            >
                                <option value="professor">Professor(a)</option>
                                <option value="secretaria">Secretaria</option>
                                <option value="direcao">Direção</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>

                        <div className="p-4 bg-sky-50 border border-sky-100 rounded-lg text-[11px] text-sky-800 leading-relaxed">
                            <p className="font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Como funciona o acesso?
                            </p>
                            Você está reservando este e-mail no sistema. Após salvar, peça ao funcionário para se cadastrar no site usando **este mesmo e-mail**. O perfil e as permissões serão vinculados automaticamente.
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="pt-4">
                            <Button type="submit" className="w-full gap-2 py-6" loading={loading}>
                                <Save className="w-4 h-4" />
                                Salvar Perfil de Acesso
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
