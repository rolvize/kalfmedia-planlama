"use client";

import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { getCalendarEvents, addCalendarEvent, deleteCalendarEvent, getProjects, getGorevler } from "../../lib/supabase/db";
import { CalendarEvent, Project, Gorev } from "../../types";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Video,
  Flag,
  Play,
  Plus,
  Trash2,
  X,
  Clock,
  Briefcase,
  AlertCircle,
  HelpCircle,
  MapPin,
  CheckCircle,
  Filter,
  CheckSquare,
} from "lucide-react";

const AYLAR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const EVENT_TYPES = [
  { id: "all", label: "Tüm Etkinlikler", color: "text-slate-400 border-slate-800" },
  { id: "Çekim", label: "Çekim / Yapım", color: "text-purple-400 border-purple-500/20 bg-purple-500/5", bullet: "bg-purple-400" },
  { id: "Teslim", label: "Teslim / Deadline", color: "text-red-400 border-red-500/20 bg-red-500/5", bullet: "bg-red-400" },
  { id: "Toplantı", label: "Toplantı / Görüşme", color: "text-blue-400 border-blue-500/20 bg-blue-500/5", bullet: "bg-blue-400" },
  { id: "Ödeme", label: "Ödeme Günü", color: "text-amber-400 border-amber-500/20 bg-amber-500/5", bullet: "bg-amber-400" },
  { id: "Başlangıç", label: "Proje Başlangıcı", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5", bullet: "bg-emerald-400" },
  { id: "Görev", label: "Gündelik Görev", color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5", bullet: "bg-cyan-400" },
];

const EVENT_COLORS: { [key: string]: { bg: string; text: string; border: string; glow: string } } = {
  "Başlangıç": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", glow: "shadow-emerald-500/10" },
  "Teslim": { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", glow: "shadow-rose-500/10" },
  "Çekim": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", glow: "shadow-purple-500/10" },
  "Toplantı": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", glow: "shadow-blue-500/10" },
  "Ödeme": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", glow: "shadow-amber-500/10" },
  "Görev": { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", glow: "shadow-cyan-500/10" },
};

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Filtreler
  const [activeTypeFilter, setActiveTypeFilter] = useState("all");
  const [selectedDayEvents, setSelectedDayEvents] = useState<any[]>([]);
  const [selectedDayStr, setSelectedDayStr] = useState<string>("");

  // Yeni Etkinlik Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    title: "",
    event_type: "Toplantı",
    date: "",
    project_id: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [evs, prjs, grvs] = await Promise.all([
        getCalendarEvents(),
        getProjects(),
        getGorevler()
      ]);
      setEvents(evs);
      setProjects(prjs);
      setGorevler(grvs);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // AY HESAPLAMALARI
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getFirstDayOfMonth = () => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Pzt=0 yapmak için
  };

  const getDaysInMonth = () => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth();
  const firstDayIndex = getFirstDayOfMonth();

  // Hücrelerin Hazırlanması (Önceki, şimdiki ve sonraki ayın günleri)
  const prevMonthDays = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    prevMonthDays.push({
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      dateString: d.toISOString().split("T")[0]
    });
  }

  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    currentMonthDays.push({
      day: i,
      isCurrentMonth: true,
      dateString: dateStr
    });
  }

  const totalCells = 42;
  const nextMonthDaysCount = totalCells - (prevMonthDays.length + currentMonthDays.length);
  const nextMonthDays = [];
  for (let i = 1; i <= nextMonthDaysCount; i++) {
    const d = new Date(year, month + 1, i);
    nextMonthDays.push({
      day: i,
      isCurrentMonth: false,
      dateString: d.toISOString().split("T")[0]
    });
  }

  const allCalendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Etkinlik Ekleme
  const handleAddEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalData.title.trim() || !modalData.date) return;

    try {
      const payload = {
        title: modalData.title,
        event_type: modalData.event_type,
        start_date: `${modalData.date}T09:00:00Z`,
        end_date: `${modalData.date}T10:00:00Z`,
        project_id: modalData.project_id || null
      };

      const added = await addCalendarEvent(payload);
      setEvents(prev => [...prev, added]);
      setIsModalOpen(false);
      setModalData({ title: "", event_type: "Toplantı", date: "", project_id: "" });
      
      // Detayı güncelle
      if (selectedDayStr === modalData.date) {
        setSelectedDayEvents(prev => [...prev, { ...added, source: "event" }]);
      }
    } catch (e: any) {
      alert("Etkinlik eklenemedi: " + (e?.message || e?.details || String(e)));
    }
  };

  // Etkinlik Silme
  const handleDeleteEvent = async (id: string) => {
    if (window.confirm("Bu takvim etkinliğini silmek istediğinizden emin misiniz?")) {
      try {
        await deleteCalendarEvent(id);
        setEvents(prev => prev.filter(e => e.id !== id));
        setSelectedDayEvents(prev => prev.filter(e => e.id !== id));
      } catch (e: any) {
        alert("Etkinlik silinemedi: " + (e?.message || e?.details || String(e)));
      }
    }
  };

  // Günün etkinliklerini çek — takvim etkinlikleri + proje tarihleri + görevler
  const getEventsForDate = (dateStr: string) => {
    const list: any[] = [];
    // Daha önce eklenmiş görev ID'lerini takip et (duplikasyon önleme)
    const addedGorevTitles = new Set<string>();

    // 1. Manuel Takvim Etkinlikleri (calendar_events tablosu)
    events.forEach(ev => {
      if (ev.start_date.split("T")[0] === dateStr) {
        list.push({ ...ev, source: "event" });
        // Görev tipindeyse duplikasyon önleme için kaydet
        if (ev.event_type === "Görev") {
          addedGorevTitles.add(ev.title);
        }
      }
    });

    // 2. Dinamik Proje Tarihleri (start_date / due_date)
    //    Sadece takvim etkinliği olarak kaydedilmemiş projeleri göster
    const projectIdsWithCalEvents = new Set(events.filter(e => e.project_id).map(e => e.project_id));
    projects.forEach(p => {
      if (p.due_date === dateStr && !projectIdsWithCalEvents.has(p.id)) {
        list.push({
          id: `prj-due-${p.id}`,
          title: `TESLİM: ${p.title}`,
          event_type: "Teslim",
          source: "project",
          project: p
        });
      }
      if (p.start_date === dateStr && !projectIdsWithCalEvents.has(p.id)) {
        list.push({
          id: `prj-start-${p.id}`,
          title: `BAŞLANGIÇ: ${p.title}`,
          event_type: "Başlangıç",
          source: "project",
          project: p
        });
      }
    });

    // 3. Gündelik Plan Görevleri (planlanan_tarih bazlı)
    //    Takvim etkinliği olarak zaten kaydedilmemişse ekle (duplikasyon önleme)
    gorevler.forEach(g => {
      if (g.planlanan_tarih === dateStr && !addedGorevTitles.has(g.gorev_adi)) {
        list.push({
          id: `grv-${g.id}`,
          title: g.gorev_adi,
          event_type: "Görev",
          source: "gorev",
          gorev: g,
          project_id: g.proje_id || null,
          sutun: g.sutun_durumu
        });
      }
    });

    // Filtre uygula
    if (activeTypeFilter !== "all") {
      return list.filter(ev => ev.event_type === activeTypeFilter);
    }

    return list;
  };

  // Ay Değiştirme Butonları
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Dialog Ref
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!dialogRef.current) return;
    if (isModalOpen) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current.close();
    }
  }, [isModalOpen]);

  // Sayfa açıldığında bugünün tarihini seç
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    setSelectedDayStr(todayStr);
    setSelectedDayEvents(getEventsForDate(todayStr));
  }, [events, projects, gorevler, activeTypeFilter]);

  const handleDaySelect = (dateStr: string) => {
    setSelectedDayStr(dateStr);
    setSelectedDayEvents(getEventsForDate(dateStr));
  };

  const getProjectName = (projectId: string | null | undefined) => {
    if (!projectId) return null;
    const p = projects.find(prj => prj.id === projectId);
    return p ? p.title : null;
  };

  const formatLongDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  // Görev durum rengi
  const getGorevStatusColor = (sutun: string) => {
    const map: Record<string, string> = {
      "Tamamlandı": "text-emerald-400",
      "Yapılıyor": "text-purple-400",
      "Test": "text-cyan-400",
      "Yapılacaklar": "text-blue-400",
      "Yapılmayı Bekleyenler": "text-amber-400"
    };
    return map[sutun] || "text-slate-400";
  };

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        
        {/* Üst Başlık */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/10">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black">Planlama Takvimi</h1>
              <p className="text-xs text-slate-400">Projeler, görevler, çekim günleri ve müşteri toplantıları</p>
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border-none flex gap-2 items-center text-xs cursor-pointer shadow-lg shadow-blue-500/15"
          >
            <Plus size={14} /> Yeni Etkinlik
          </button>
        </div>

        {/* Filtre Paneli */}
        <div className="glass-card flex flex-wrap gap-2.5 items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2 flex items-center gap-1.5">
            <Filter size={11} /> Filtrele:
          </span>
          {EVENT_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setActiveTypeFilter(type.id)}
              className={`py-1.5 px-3 border rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTypeFilter === type.id
                  ? "bg-blue-600 border-blue-500 text-white font-extrabold shadow-md shadow-blue-500/20"
                  : "bg-slate-900/60 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-700/50"
              }`}
            >
              {type.bullet && <span className={`w-1.5 h-1.5 rounded-full ${type.bullet}`}></span>}
              {type.label}
            </button>
          ))}
        </div>

        {/* Takvim ve Detay Split Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          
          {/* Sol/Orta: Takvim Widget */}
          <div className="xl:col-span-3 glass-card flex flex-col gap-4">
            
            {/* Takvim Navigasyon */}
            <div className="flex justify-between items-center border-b border-slate-800/40 pb-4">
              <h2 className="text-base font-extrabold text-slate-200 flex items-center gap-2">
                {AYLAR[month]} {year}
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrevMonth} 
                  className="btn-icon p-2 hover:bg-slate-800/60 rounded-xl transition-all border border-slate-800/40"
                  title="Önceki Ay"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1.5 text-[10px] font-bold bg-slate-900/60 border border-slate-800/60 rounded-xl hover:text-slate-100 hover:bg-slate-800 text-slate-400 cursor-pointer transition-all"
                >
                  Bugün
                </button>
                <button 
                  onClick={handleNextMonth} 
                  className="btn-icon p-2 hover:bg-slate-800/60 rounded-xl transition-all border border-slate-800/40"
                  title="Sonraki Ay"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Izgara Gövdesi */}
            <div className="flex flex-col gap-[1px] bg-slate-800/40 border border-slate-800/40 rounded-2xl overflow-hidden shadow-inner">
              {/* Gün İsimleri */}
              <div className="grid grid-cols-7 bg-slate-900/80 text-center py-2 sm:py-3 text-[8px] sm:text-[10px] font-bold text-slate-500 border-b border-slate-800/60 uppercase tracking-wider">
                {GUNLER.map(d => <div key={d}>{d}</div>)}
              </div>

              {/* Gün Hücreleri */}
              <div className="grid grid-cols-7 bg-slate-950/15">
                {allCalendarDays.map((cell, idx) => {
                  const dayEvents = getEventsForDate(cell.dateString);
                  const isToday = new Date().toISOString().split("T")[0] === cell.dateString;
                  const isSelected = selectedDayStr === cell.dateString;

                  return (
                    <div 
                      key={idx}
                      onClick={() => handleDaySelect(cell.dateString)}
                      className={`min-h-[50px] sm:min-h-[105px] p-1 sm:p-2.5 flex flex-col gap-1 sm:gap-1.5 border-r border-b border-slate-800/30 relative cursor-pointer group transition-all hover:bg-slate-900/40 ${
                        cell.isCurrentMonth ? "bg-slate-900/10" : "bg-slate-950/30 opacity-40"
                      } ${isToday ? "bg-blue-600/5 hover:bg-blue-600/10" : ""} ${
                        isSelected ? "ring-1 ring-blue-500/70 bg-blue-500/5 hover:bg-blue-500/5" : ""
                      }`}
                    >
                      {/* Gün Numarası */}
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] sm:text-[10px] font-bold ${
                          isToday 
                            ? "text-blue-400 bg-blue-500/10 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border border-blue-500/20" 
                            : (isSelected ? "text-blue-400" : (cell.isCurrentMonth ? "text-slate-300" : "text-slate-600"))
                        }`}>
                          {cell.day}
                        </span>
                        {isToday && (
                          <span className="text-[6px] sm:text-[7px] bg-blue-600 border border-blue-500 text-white font-extrabold px-1 rounded tracking-wide scale-90 shadow-md shadow-blue-600/20 hidden sm:inline-block">BUGÜN</span>
                        )}
                      </div>

                      {/* Günün Etkinlikleri - Masaüstü */}
                      <div className="hidden md:flex flex-col gap-1 overflow-y-auto max-h-[70px] pr-0.5 scrollbar-thin">
                        {dayEvents.map((ev, evIdx) => {
                          const colors = EVENT_COLORS[ev.event_type] || { bg: "bg-slate-800/60", text: "text-slate-400", border: "border-slate-800" };

                          return (
                            <div 
                              key={evIdx}
                              className={`p-1 rounded-lg text-[9px] font-extrabold flex items-center gap-1 border select-none transition-all hover:brightness-110 shadow-sm ${colors.bg} ${colors.text} ${colors.border}`}
                            >
                              {ev.event_type === "Görev" && <CheckSquare size={8} className="shrink-0" />}
                              <span className="truncate pr-0.5" title={ev.title}>{ev.title}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Günün Etkinlikleri - Mobil Mermi Noktaları */}
                      <div className="flex flex-wrap gap-0.5 mt-auto justify-center md:hidden">
                        {dayEvents.map((ev, evIdx) => {
                          const typeInfo = EVENT_TYPES.find(t => t.id === ev.event_type);
                          const bulletColor = typeInfo?.bullet || "bg-slate-400";
                          return (
                            <span 
                              key={evIdx}
                              className={`w-1 h-1 rounded-full ${bulletColor}`}
                              title={ev.title}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sağ: Günün Detayları ve Plan Paneli */}
          <div className="glass-card flex flex-col gap-4 h-full min-h-[500px]">
            <div className="border-b border-slate-800/40 pb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Seçili Günün Detayları</h3>
              <p className="text-[11px] font-bold text-slate-200 mt-1 flex items-center gap-1.5">
                <Clock size={12} className="text-blue-500" />
                {selectedDayStr ? formatLongDate(selectedDayStr) : "Gün Seçiniz"}
              </p>
            </div>

            {/* Etkinlik Listesi */}
            <div className="flex flex-col gap-3 overflow-y-auto flex-1 max-h-[380px] pr-1 scrollbar-thin">
              {selectedDayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="p-4 bg-slate-950/60 border border-slate-800/60 text-slate-600 rounded-2xl">
                    <CalendarIcon size={24} strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-400">Herhangi Bir Etkinlik Yok</span>
                    <span className="text-[10px] text-slate-500 leading-relaxed px-4">Bu tarihe ait bir çekim, teslim, toplantı, görev veya özel not eklenmemiş.</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {selectedDayEvents.map((ev) => {
                    const colors = EVENT_COLORS[ev.event_type] || { bg: "bg-slate-800/60", text: "text-slate-400", border: "border-slate-800" };
                    const isManualEvent = ev.source === "event";
                    const isGorev = ev.source === "gorev";
                    const projectName = getProjectName(ev.project_id);

                    return (
                      <div 
                        key={ev.id}
                        className={`p-3.5 border rounded-2xl flex flex-col gap-2.5 relative group hover:scale-[1.01] transition-all duration-300 ${colors.bg} ${colors.border}`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-slate-950/60 w-max border-slate-800 flex items-center gap-1 ${colors.text}`}>
                              {ev.event_type === "Görev" && <CheckSquare size={8} />}
                              {ev.event_type}
                            </span>
                            <h4 className="font-bold text-xs text-slate-200 leading-snug break-words mt-1">{ev.title}</h4>
                          </div>

                          {isManualEvent && (
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="text-slate-500 hover:text-red-400 p-1 hover:bg-slate-950/60 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Etkinliği Sil"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* Ek Bilgiler */}
                        <div className="flex flex-col gap-1 text-[10px] text-slate-400 border-t border-slate-800/40 pt-2.5 mt-0.5">
                          {projectName && (
                            <div className="flex items-center gap-1.5">
                              <Briefcase size={11} className="text-slate-500" />
                              <span className="font-semibold truncate">Proje: {projectName}</span>
                            </div>
                          )}
                          {isGorev && ev.sutun && (
                            <div className="flex items-center gap-1.5">
                              <CheckCircle size={11} className="text-slate-500" />
                              <span className={`font-semibold ${getGorevStatusColor(ev.sutun)}`}>
                                {ev.sutun}
                              </span>
                            </div>
                          )}
                          {!isManualEvent && !isGorev && ev.project?.client_id && (
                            <div className="flex items-center gap-1.5">
                              <MapPin size={11} className="text-slate-500" />
                              <span className="truncate">Proje Bağlantılı</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hızlı Eylem Butonu */}
            <button
              onClick={() => {
                setModalData(prev => ({ ...prev, date: selectedDayStr }));
                setIsModalOpen(true);
              }}
              className="btn btn-secondary w-full py-2.5 text-[10px] font-bold rounded-xl border-dashed border-slate-800/80 hover:border-slate-700/60 text-slate-400 hover:text-slate-200 flex justify-center items-center gap-1.5 cursor-pointer mt-auto"
            >
              <Plus size={12} /> Bu Güne Etkinlik Ekle
            </button>
          </div>

        </div>

      </div>

      {/* ETKİNLİK EKLEME MODALI */}
      <dialog ref={dialogRef} className="modal" onClose={() => setIsModalOpen(false)}>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/40">
          <div>
            <h3 className="text-base font-bold text-slate-100">Yeni Etkinlik Ekle</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Takviminize manuel toplantı, çekim veya ödeme kaydedin</p>
          </div>
          <button className="btn-icon p-2 hover:bg-slate-800/60 rounded-xl transition-all" onClick={() => setIsModalOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleAddEventSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Etkinlik Başlığı</label>
            <input
              type="text"
              placeholder="Örn: Youtube Çekimi / Marka Toplantısı"
              className="form-control"
              value={modalData.title}
              onChange={(e) => setModalData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Etkinlik Türü</label>
            <select
              value={modalData.event_type}
              onChange={(e) => setModalData(prev => ({ ...prev, event_type: e.target.value }))}
              className="form-control"
            >
              <option value="Toplantı">Toplantı / Görüşme</option>
              <option value="Çekim">Çekim / Yapım</option>
              <option value="Teslim">Teslim / Deadline</option>
              <option value="Ödeme">Ödeme Günü</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">İlişkili Proje (İsteğe Bağlı)</label>
            <select
              value={modalData.project_id}
              onChange={(e) => setModalData(prev => ({ ...prev, project_id: e.target.value }))}
              className="form-control"
            >
              <option value="">İşten Bağımsız (Genel)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tarih</label>
            <input
              type="date"
              className="form-control"
              value={modalData.date}
              onChange={(e) => setModalData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-4 justify-end mt-4 pt-4 border-t border-slate-800/60">
            <button type="button" className="btn btn-secondary font-bold" onClick={() => setIsModalOpen(false)}>
              İptal
            </button>
            <button type="submit" className="btn btn-primary bg-blue-600 hover:bg-blue-700 font-bold px-6">
              Etkinliği Ekle
            </button>
          </div>
        </form>
      </dialog>
    </AuthenticatedLayout>
  );
}
