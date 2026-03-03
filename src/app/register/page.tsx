"use client";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { auth, db } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, updateDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { GraduationCap, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // 1. Create Auth Account First
            // This ensures we have the necessary permissions for Firestore queries
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Now check if a profile exists for this email
            const staffQuery = query(collection(db, "users"), where("email", "==", email.toLowerCase().trim()));
            const staffSnap = await getDocs(staffQuery);

            let profileId = null;
            let existingData = null;

            if (!staffSnap.empty) {
                // Find a profile that doesn't have a UID yet or matches this email
                // We prefer profiles where UID is not the document ID yet
                const matchingDoc = staffSnap.docs.find(d => d.id !== user.uid) || staffSnap.docs[0];
                profileId = matchingDoc.id;
                existingData = matchingDoc.data();
            }

            // 3. Link or Create Firestore Profile
            if (profileId && existingData) {
                // Link existing pre-created profile to this UID
                await setDoc(doc(db, "users", user.uid), {
                    ...existingData,
                    uid: user.uid,
                    status: "active",
                    updatedAt: serverTimestamp()
                });

                // If the old profile had a different ID, we can optionally delete it
                // but usually, it's safer to keep it for a while or mark it as migrated.
            } else {
                // Create new basic profile
                await setDoc(doc(db, "users", user.uid), {
                    name,
                    email: email.toLowerCase().trim(),
                    role: "responsavel", // Default for self-registration
                    status: "active",
                    createdAt: serverTimestamp(),
                    uid: user.uid
                });
            }

            router.push("/app");
        } catch (err: any) {
            console.error("Register Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-8 pb-0 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Primeiro Acesso</h1>
                    <p className="text-slate-500 text-sm mt-2">Crie sua conta no Sistema Gênesis</p>
                </div>

                <form onSubmit={handleRegister} className="p-8 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Seu Nome Completo</label>
                        <input
                            type="text"
                            required
                            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            placeholder="Maria Silva Helena"
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">E-mail Corporativo ou Pessoal</label>
                        <input
                            type="email"
                            required
                            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            placeholder="helena@escola.br"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Escolha uma Senha</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            placeholder="No mínimo 6 caracteres"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-600">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <p className="text-xs font-bold leading-relaxed">{error}</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full py-6 rounded-xl font-black uppercase tracking-widest text-xs gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                Criar Minha Conta
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </Button>

                    <div className="pt-4 text-center">
                        <p className="text-xs text-slate-500 font-medium">
                            Já tem uma conta?{" "}
                            <Link href="/login" className="text-primary font-black hover:underline underline-offset-4">
                                Fazer Login
                            </Link>
                        </p>
                    </div>
                </form>

                <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest leading-relaxed">
                        Ao se cadastrar, você concorda com os termos de uso e a LGPD para sistemas de ensino municipal.
                    </p>
                </div>
            </div>
        </main>
    );
}
