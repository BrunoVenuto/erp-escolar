"use client";

import { useAuth } from "@/components/AuthProvider";
import { User, Bell, Search } from "lucide-react";

export function Topbar({ title }: { title: string }) {
    const { profile } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative hidden md:block">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>

                <button className="relative text-slate-500 hover:text-primary transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{profile?.name || "Usuário"}</p>
                        <p className="text-xs text-slate-500 capitalize">{profile?.role || "Perfil"}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        {profile?.photoURL ? (
                            <img src={profile.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User className="w-5 h-5" />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
