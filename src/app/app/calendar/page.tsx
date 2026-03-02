"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    MapPin,
    Filter,
    Bell
} from "lucide-react";

export default function CalendarPage() {
    const [currentDate] = useState(new Date(2026, 2, 1)); // March 2026

    const events = [
        { id: 1, title: "Início do 1º Bimestre", date: "02 Mar", time: "07:30", type: "academic", color: "bg-blue-500" },
        { id: 2, title: "Reunião de Pais e Mestres", date: "15 Mar", time: "18:00", type: "meeting", color: "bg-amber-500" },
        { id: 3, title: "Feriado Municipal", date: "23 Mar", time: "Dia Todo", type: "holiday", color: "bg-rose-500" },
        { id: 4, title: "Conselho de Classe", date: "28 Mar", time: "14:00", type: "internal", color: "bg-emerald-500" },
    ];

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Calendário Escolar</h1>
                    <p className="text-sm text-slate-500">Acompanhe feriados, reuniões e eventos acadêmicos.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="w-4 h-4" />
                        Filtrar
                    </Button>
                    <Button size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Novo Evento
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar View */}
                <Card className="lg:col-span-2 overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CalendarIcon className="w-5 h-5 text-primary" />
                                <h2 className="font-bold text-slate-700">
                                    {monthNames[currentDate.getMonth()]} 2026
                                </h2>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 text-xs px-3">Hoje</Button>
                                <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="grid grid-cols-7 text-center border-b border-slate-100">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                            <div key={day} className="py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 grid-rows-5 h-[400px]">
                        {Array.from({ length: 35 }).map((_, i) => {
                            const day = i - 6; // Adjusted for March 2026 starting on Sunday
                            const isCurrentMonth = day > 0 && day <= 31;
                            const isToday = day === 2; // Simulating Mar 2nd

                            return (
                                <div
                                    key={i}
                                    className={`border-r border-b border-slate-50 p-2 relative hover:bg-slate-50 transition-colors ${!isCurrentMonth ? "bg-slate-50/50" : ""}`}
                                >
                                    <span className={`text-xs font-bold ${isCurrentMonth ? "text-slate-700" : "text-slate-300"} ${isToday ? "bg-primary text-white w-6 h-6 flex items-center justify-center rounded-full" : ""}`}>
                                        {day > 0 && day <= 31 ? day : ""}
                                    </span>
                                    {day === 15 && (
                                        <div className="mt-1 h-1 w-1 bg-amber-500 rounded-full mx-auto" />
                                    )}
                                    {day === 23 && (
                                        <div className="mt-1 h-1 w-1 bg-rose-500 rounded-full mx-auto" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Event Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <Bell className="w-4 h-4 text-amber-500" />
                                Próximos Eventos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {events.map((event) => (
                                <div key={event.id} className="group cursor-pointer">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl ${event.color} bg-opacity-10 flex flex-col items-center justify-center text-center shrink-0`}>
                                            <span className={`text-[10px] font-black uppercase ${event.color.replace('bg-', 'text-')}`}>
                                                {event.date.split(' ')[1]}
                                            </span>
                                            <span className={`text-sm font-bold ${event.color.replace('bg-', 'text-')}`}>
                                                {event.date.split(' ')[0]}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{event.title}</p>
                                            <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {event.time}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    Escola
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button variant="ghost" className="w-full text-xs h-8 text-primary font-bold">Ver Todos</Button>
                        </CardContent>
                    </Card>

                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 space-y-3">
                        <h4 className="text-sm font-black text-primary uppercase tracking-tight">Dica do Sistema</h4>
                        <p className="text-xs text-primary/70 leading-relaxed">
                            Você pode sincronizar este calendário com seu Google Agenda ou Outlook nas configurações de perfil.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
