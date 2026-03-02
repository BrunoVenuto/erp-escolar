"use client";

import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { Button } from "./Button";
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";

interface FileUploaderProps {
    studentId: string;
    docType: string;
    onUploadComplete: (url: string) => void;
}

export function FileUploader({ studentId, docType, onUploadComplete }: FileUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [error, setError] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus("idle");
            setError("");
            setProgress(0);
        }
    };

    const handleUpload = () => {
        if (!file) return;

        setStatus("uploading");
        const storageRef = ref(storage, `documents/${studentId}/${docType}_${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const perc = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgress(perc);
            },
            (err) => {
                console.error("Upload error:", err);
                setStatus("error");
                setError("Erro ao enviar arquivo. Tente novamente.");
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setStatus("success");
                onUploadComplete(downloadURL);
            }
        );
    };

    return (
        <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-4">
            <div className="flex items-center justify-between gap-4">
                <label className="flex-1 cursor-pointer group">
                    <input type="file" className="hidden" onChange={handleFileChange} />
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 group-hover:border-primary/50 transition-colors">
                            <Upload className="w-4 h-4 text-slate-500 group-hover:text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-700">
                                {file ? file.name : "Clique para selecionar arquivo"}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{docType}</p>
                        </div>
                    </div>
                </label>

                {file && status === "idle" && (
                    <Button size="sm" onClick={handleUpload}>Enviar</Button>
                )}

                {status === "success" && (
                    <Badge variant="success" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Enviado
                    </Badge>
                )}
            </div>

            {status === "uploading" && (
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Enviando...</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {status === "error" && (
                <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
    );
}

function Badge({ children, variant, className }: any) {
    const variants = {
        success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100 flex items-center gap-1 ${variants[variant as keyof typeof variants]} ${className}`}>
            {children}
        </span>
    );
}
