"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save, Plus, Trash2, Settings2 } from "lucide-react";

type AssessmentWeight = {
    id: string;
    type: string;
    weight: number;
};

export default function GradeConfigPage() {
    const [weights, setWeights] = useState<AssessmentWeight[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadConfig() {
            try {
                const snap = await getDocs(collection(db, "gradeConfig"));
                if (!snap.empty) {
                    setWeights(snap.docs.map(d => ({ id: d.id, ...d.data() } as AssessmentWeight)));
                } else {
                    // Default config if none exists
                    setWeights([
                        { id: "1", type: "Prova", weight: 6 },
                        { id: "2", type: "Trabalho", weight: 4 },
                    ]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadConfig();
    }, []);

    const addWeight = () => {
        setWeights([...weights, { id: Math.random().toString(36).substr(2, 9), type: "", weight: 0 }]);
    };

    const removeWeight = (id: string) => {
        setWeights(weights.filter(w => w.id !== id));
    };

    const updateWeight = (id: string, field: keyof AssessmentWeight, value: string | number) => {
        setWeights(weights.map(w => w.id === id ? { ...w, [field]: value } : w));
    };

    async function handleSave() {
        const total = weights.reduce((acc, w) => acc + Number(w.weight), 0);
        if (total !== 10) {
            alert("A soma dos pesos deve ser exatamente 10.");
            return;
        }

        setSaving(true);
        try {
            // For simplicity, we store them as individual docs in gradeConfig
            // In a real app, this might be per school or per year
            for (const w of weights) {
                await setDoc(doc(db, "gradeConfig", w.id), {
                    type: w.type,
                    weight: Number(w.weight),
                    updatedAt: serverTimestamp(),
                });
            }
            alert("Configuração salva com sucesso!");
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar configuração.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="p-8 text-center animate-pulse">Carregando configurações...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">Pesos das Avaliações</h1>
                <Button onClick={handleSave} loading={saving} className="gap-2">
                    <Save className="w-4 h-4" />
                    Salvar Configurações
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Settings2 className="w-5 h-5" />
                        Configuração de Média Ponderada
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                        Defina como a média bimestral será calculada. A soma dos pesos deve ser **10**.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {weights.map((w) => (
                        <div key={w.id} className="flex items-end gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                            <div className="flex-1">
                                <Input
                                    label="Tipo de Avaliação"
                                    value={w.type}
                                    placeholder="Ex: Prova, Trabalho..."
                                    onChange={(e) => updateWeight(w.id, "type", e.target.value)}
                                />
                            </div>
                            <div className="w-24">
                                <Input
                                    label="Peso"
                                    type="number"
                                    value={w.weight}
                                    min={0}
                                    max={10}
                                    step={0.5}
                                    onChange={(e) => updateWeight(w.id, "weight", e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => removeWeight(w.id)}
                                className="p-2.5 mb-0.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}

                    <Button variant="outline" className="w-full border-dashed gap-2 py-6 text-slate-500 hover:text-primary hover:border-primary" onClick={addWeight}>
                        <Plus className="w-4 h-4" />
                        Adicionar Tipo de Avaliação
                    </Button>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                        <div className="flex justify-between items-center font-bold">
                            <span className="text-amber-800 text-sm">Soma Total dos Pesos</span>
                            <span className={weights.reduce((acc, w) => acc + Number(w.weight), 0) === 10 ? "text-emerald-600" : "text-rose-600"}>
                                {weights.reduce((acc, w) => acc + Number(w.weight), 0)} / 10
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
