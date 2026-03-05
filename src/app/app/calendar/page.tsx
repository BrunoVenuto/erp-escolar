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
    Bell,
    X,
    Loader2
} from "lucide-react";
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";

type CalendarEvent = {
    id: string;
    title: string;
    dateISO: string; // YYYY-MM-DD
    time: string;
    type: string;
    color: string;
};

export default function CalendarPage() {
    const [viewDate, setViewDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const today = new Date();

    const handlePrevMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleToday = () => {
        const d = new Date();
        setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    };

    const { profile, loading: authLoading } = useAuth();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [time, setTime] = useState("");
    const [type, setType] = useState("academic");

    useEffect(() => {
        fetchEvents();
    }, []);

    async function fetchEvents() {
        setLoading(true);
        try {
            // Retrieve without orderBy to avoid any missing index issues
            const snap = await getDocs(collection(db, "events"));
            const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as CalendarEvent));
            fetched.sort((a, b) => (a.dateISO || "").localeCompare(b.dateISO || ""));
            setEvents(fetched);
        } catch (err) {
            console.error(err);
            alert("Erro ao carregar eventos " + String(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleAddEvent(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const colorMap: Record<string, string> = {
                academic: "bg-blue-500",
                meeting: "bg-amber-500",
                holiday: "bg-rose-500",
                internal: "bg-emerald-500",
            };

            await addDoc(collection(db, "events"), {
                title,
                dateISO: eventDate,
                time: time || "Dia Todo",
                type,
                color: colorMap[type] || "bg-blue-500",
                createdAt: serverTimestamp()
            });
            setShowModal(false);
            setTitle("");
            setEventDate("");
            setTime("");
            setType("academic");
            fetchEvents();
        } catch (err) {
            console.error(err);
            alert("Erro ao criar evento.");
        } finally {
            setSaving(false);
        }
    }

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const firstDayOfMonth = viewDate.getDay();
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

    // Create an array for the grid (7 days * 5 or 6 rows)
    // We'll use 42 to always fit any month
    const calendarDays = [];

    // Days from previous month
    const daysInPrevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        calendarDays.push({
            day: daysInPrevMonth - i,
            month: "prev",
            date: new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, daysInPrevMonth - i)
        });
    }

    // Days from current month
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push({
            day: i,
            month: "current",
            date: new Date(viewDate.getFullYear(), viewDate.getMonth(), i)
        });
    }

    // Days from next month
    const remainingSlots = 42 - calendarDays.length;
    for (let i = 1; i <= remainingSlots; i++) {
        calendarDays.push({
            day: i,
            month: "next",
            date: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, i)
        });
    }

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
                    {!authLoading && profile && ["admin", "direcao", "secretaria"].includes(profile.role?.toLowerCase() || "") && (
                        <Button size="sm" className="gap-2" onClick={() => setShowModal(true)}>
                            <Plus className="w-4 h-4" />
                            Novo Evento
                        </Button>
                    )}
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
                                    {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                                </h2>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="p-1 h-8 w-8" onClick={handlePrevMonth}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 text-xs px-3" onClick={handleToday}>Hoje</Button>
                                <Button variant="ghost" size="sm" className="p-1 h-8 w-8" onClick={handleNextMonth}>
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
                    <div className="grid grid-cols-7 grid-rows-6 h-[480px]">
                        {calendarDays.map((dateObj, i) => {
                            const isCurrentMonth = dateObj.month === "current";
                            const isToday = today.getDate() === dateObj.day &&
                                today.getMonth() === dateObj.date.getMonth() &&
                                today.getFullYear() === dateObj.date.getFullYear();

                            // Format date for matching with events (YYYY-MM-DD)
                            const dtString = `${dateObj.date.getFullYear()}-${String(dateObj.date.getMonth() + 1).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
                            const dayEvents = events.filter(e => e.dateISO && e.dateISO === dtString);

                            return (
                                <div
                                    key={i}
                                    className={`border-r border-b border-slate-50 p-2 relative hover:bg-slate-50 transition-colors ${!isCurrentMonth ? "bg-slate-50/50" : ""}`}
                                >
                                    <span className={`text-xs font-bold ${isCurrentMonth ? "text-slate-700" : "text-slate-300"} ${isToday ? "bg-primary text-white w-6 h-6 flex items-center justify-center rounded-full mx-auto" : "flex justify-center"}`}>
                                        {dateObj.day}
                                    </span>
                                    <div className="mt-1 flex flex-wrap justify-center gap-1">
                                        {dayEvents.map(evt => (
                                            <div key={evt.id} className={`h-1.5 w-1.5 rounded-full ${evt.color}`} title={evt.title} />
                                        ))}
                                    </div>
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
                            {loading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                                </div>
                            ) : events.length === 0 ? (
                                <p className="text-sm text-slate-500 italic text-center py-4">Nenhum evento programado.</p>
                            ) : events.slice(0, 5).map((event) => {
                                // Extract DD MMM from YYYY-MM-DD safely
                                const safeDateISO = event.dateISO || new Date().toISOString().split('T')[0];
                                const parts = safeDateISO.split('-');
                                const monthIndex = parts.length > 1 ? parseInt(parts[1], 10) - 1 : 0;
                                const monthAbbr = monthNames[monthIndex]?.slice(0, 3) || "Jan";
                                const day = parts.length > 2 ? parts[2] : "01";

                                return (
                                    <div key={event.id} className="group cursor-pointer">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-xl ${event.color} bg-opacity-10 flex flex-col items-center justify-center text-center shrink-0`}>
                                                <span className={`text-[10px] font-black uppercase ${event.color.replace('bg-', 'text-')}`}>
                                                    {monthAbbr}
                                                </span>
                                                <span className={`text-sm font-bold ${event.color.replace('bg-', 'text-')}`}>
                                                    {day}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-1">{event.title}</p>
                                                <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {event.time || "Dia todo"}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        Escola
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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
