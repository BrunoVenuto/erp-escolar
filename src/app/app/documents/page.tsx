"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    FileText,
    Download,
    Eye,
    Search,
    FolderPlus,
    FileImage,
    FileMinus,
    MoreVertical,
    Folder,
    X,
    Trash2,
    Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";

type Category = { id: string; name: string; count: number };
type DocumentType = { id: string; name: string; type: string; size: string; categoryId: string; categoryName: string; date: string };

export default function DocumentsPage() {
    const { profile } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [docs, setDocs] = useState<DocumentType[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [showFileModal, setShowFileModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [newFileName, setNewFileName] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const catSnap = await getDocs(query(collection(db, "documentFolders"), orderBy("name")));
            const cats = catSnap.docs.map(d => ({ id: d.id, name: d.data().name, count: 0 }));

            const docsSnap = await getDocs(query(collection(db, "documents"), orderBy("createdAt", "desc")));
            const fetchedDocs = docsSnap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    name: data.name,
                    type: data.type,
                    size: data.size,
                    categoryId: data.categoryId,
                    categoryName: cats.find(c => c.id === data.categoryId)?.name || "Geral",
                    date: data.createdAt?.toDate().toLocaleDateString('pt-BR') || new Date().toLocaleDateString('pt-BR')
                };
            });

            cats.forEach(c => {
                c.count = fetchedDocs.filter(d => d.categoryId === c.id).length;
            });

            setCategories(cats);
            setDocs(fetchedDocs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateFolder(e: React.FormEvent) {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        setSaving(true);
        try {
            await addDoc(collection(db, "documentFolders"), {
                name: newFolderName.trim(),
                createdAt: serverTimestamp()
            });
            setShowFolderModal(false);
            setNewFolderName("");
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    async function handleUploadFile(e: React.FormEvent) {
        e.preventDefault();
        if (!newFileName.trim() || !selectedCategory) return;
        setSaving(true);
        try {
            const ext = newFileName.split('.').pop()?.toUpperCase() || "PDF";
            await addDoc(collection(db, "documents"), {
                name: newFileName.trim(),
                type: ext,
                size: Math.floor(Math.random() * 5 + 1) + " MB", // Mock size
                categoryId: selectedCategory,
                createdAt: serverTimestamp()
            });
            setShowFileModal(false);
            setNewFileName("");
            setSelectedCategory("");
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteFile(id: string) {
        if (!confirm("Tem certeza que deseja apagar este documento?")) return;
        try {
            await deleteDoc(doc(db, "documents", id));
            fetchData();
        } catch (err) {
            console.error(err);
        }
    }

    const filteredDocs = docs.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Documentos e Arquivos</h1>
                    <p className="text-sm text-slate-500">Acesse modelos, regimentos e recursos educacionais.</p>
                </div>
                <div className="flex items-center gap-2">
                    {profile?.role === "admin" && (
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFolderModal(true)}>
                            <FolderPlus className="w-4 h-4" />
                            Nova Pasta
                        </Button>
                    )}
                    <Button size="sm" className="gap-2" onClick={() => setShowFileModal(true)}>
                        <FileText className="w-4 h-4" />
                        Enviar Arquivo
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Categories */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar documentos..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3 mb-2">Categorias</p>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <Folder className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                    <span className="text-sm font-semibold">{cat.name}</span>
                                </div>
                                <span className="bg-slate-100 text-[10px] font-black px-2 py-0.5 rounded-full text-slate-500">{cat.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Documents Table */}
                <div className="lg:col-span-3">
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Documento</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tamanho</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                                Carregando documentos...
                                            </td>
                                        </tr>
                                    ) : filteredDocs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                                Nenhum documento encontrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDocs.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{doc.name}</p>
                                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{doc.categoryName}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-500 font-medium">{doc.size}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-500 font-medium">{doc.date}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-slate-400 hover:text-primary">
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                        {profile?.role === "admin" && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="p-2 h-8 w-8 text-slate-400 hover:text-rose-500"
                                                                onClick={() => handleDeleteFile(doc.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            {showFolderModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                        <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FolderPlus className="w-5 h-5 text-primary" />
                                Nova Pasta
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowFolderModal(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleCreateFolder} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nome da Pasta</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="ghost" className="w-full" onClick={() => setShowFolderModal(false)} disabled={saving}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="w-full" loading={saving}>
                                        Criar
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {showFileModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Enviar Arquivo
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowFileModal(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleUploadFile} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Pasta de Destino</label>
                                    <select
                                        required
                                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                    >
                                        <option value="" disabled>Selecione uma pasta...</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nome do Documento (com extensão)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Prova_Matematica_Bimestre1.pdf"
                                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                        value={newFileName}
                                        onChange={(e) => setNewFileName(e.target.value)}
                                    />
                                </div>
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-[11px] text-amber-800">
                                    Note: Este envio é uma simulação. Apenas o registro do documento será salvo no banco de dados, sem o arquivo real.
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="ghost" className="w-full" onClick={() => setShowFileModal(false)} disabled={saving}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="w-full" loading={saving}>
                                        Enviar Documento
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
