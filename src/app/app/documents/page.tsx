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
    Folder
} from "lucide-react";
import { useState } from "react";

export default function DocumentsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const docs = [
        { id: 1, name: "Regimento_Escolar_2026.pdf", type: "PDF", size: "1.2 MB", category: "Institucional", date: "15/02/2026" },
        { id: 2, name: "Modelo_Plano_Aula.docx", type: "DOCX", size: "45 KB", category: "Pedagógico", date: "20/02/2026" },
        { id: 3, name: "Calendario_Academico_V1.pdf", type: "PDF", size: "850 KB", category: "Institucional", date: "25/02/2026" },
        { id: 4, name: "Lista_Materiais_Fundamental.xlsx", type: "XLSX", size: "120 KB", category: "Secretaria", date: "01/03/2026" },
    ];

    const categories = [
        { name: "Institucional", count: 12, icon: Folder },
        { name: "Pedagógico", count: 24, icon: Folder },
        { name: "Secretaria", count: 8, icon: Folder },
        { name: "Recursos Humanos", count: 5, icon: Folder },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Documentos e Arquivos</h1>
                    <p className="text-sm text-slate-500">Acesse modelos, regimentos e recursos educacionais.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <FolderPlus className="w-4 h-4" />
                        Nova Pasta
                    </Button>
                    <Button size="sm" className="gap-2">
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
                                key={cat.name}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <cat.icon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
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
                                    {docs.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{doc.name}</p>
                                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{doc.category}</p>
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
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-slate-400 hover:text-emerald-500">
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-slate-400">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
