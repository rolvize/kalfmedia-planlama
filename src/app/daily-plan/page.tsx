"use client";

import React, { useState, useEffect, useMemo } from "react";
import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { getGorevler, addGorev, updateGorev, deleteGorev, getProjects } from "../../lib/supabase/db";
import { Gorev, Project } from "../../types";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Calendar,
  Briefcase,
  Clock,
  CheckSquare,
  MessageSquare,
  CheckCircle2,
  Archive,
  ArchiveRestore,
  Inbox,
  Zap,
  Brain,
  AlertTriangle,
} from "lucide-react";
import GorevModal from "../../components/forms/GorevModal";
import {
  getInboxItems,
  addInboxItem,
  deleteInboxItem,
  subscribeToInbox,
  InboxItem,
} from "../../lib/inbox";

// ─── Sabitler ────────────────────────────────────────────────────
const SUTUNLAR = [
  { id: "Yapılmayı Bekleyenler", label: "Yapılmayı Bekleyenler", short: "Bekliyor", color: "from-amber-600 to-amber-500", glow: "rgba(245,158,11,0.15)" },
  { id: "Yapılacaklar",          label: "Yapılacaklar",          short: "Bugün",    color: "from-blue-600 to-indigo-500",  glow: "rgba(59,130,246,0.15)" },
  { id: "Yapılıyor",             label: "Yapılıyor",             short: "Aktif",    color: "from-purple-600 to-pink-500",  glow: "rgba(168,85,247,0.15)" },
  { id: "Test",                  label: "Test / Kontrol",        short: "Test",     color: "from-cyan-600 to-blue-500",    glow: "rgba(6,182,212,0.15)" },
  { id: "Tamamlandı",            label: "Tamamlandı",            short: "Bitti",    color: "from-emerald-600 to-teal-500", glow: "rgba(16,185,129,0.15)" },
];

const KATEGORI_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Prodüksiyon":    { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/20" },
  "Sosyal Medya":   { bg: "bg-pink-500/10",    text: "text-pink-400",    border: "border-pink-500/20" },
  "Vize":           { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20" },
  "Kişisel / Rutin":{ bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
};

const ONCELIK_COLORS: Record<string, string> = {
  "Düşük":  "bg-slate-600 text-white",
  "Orta":   "bg-blue-600 text-white",
  "Yüksek": "bg-rose-600 text-white",
};

const KAPASITE_MAX = 5; // Bugün için max toplam görev sayısı

// ─── Component ───────────────────────────────────────────────────
export default function DailyPlanPage() {
  const [loading,          setLoading]          = useState(true);
  const [gorevler,         setGorevler]         = useState<Gorev[]>([]);
  const [projects,         setProjects]         = useState<Project[]>([]);

  // Arama & Filtreleme
  const [searchQuery,      setSearchQuery]      = useState("");
  const [kategoriFilter,   setKategoriFilter]   = useState("all");
  const [oncelikFilter,    setOncelikFilter]    = useState("all");

  // Arşiv görünümü
  const [showArchived,     setShowArchived]     = useState(false);

  // Drag & Drop
  const [draggedTaskId,    setDraggedTaskId]    = useState<string | null>(null);
  const [dragOverColumn,   setDragOverColumn]   = useState<string | null>(null);

  // Modal
  const [modalOpen,        setModalOpen]        = useState(false);
  const [selectedGorev,    setSelectedGorev]    = useState<Gorev | null>(null);
  const [targetColumn,     setTargetColumn]     = useState<string | undefined>(undefined);

  // Inbox
  const [inboxItems,       setInboxItems]       = useState<InboxItem[]>([]);
  const [inboxInput,       setInboxInput]       = useState("");
  const [inboxSaved,       setInboxSaved]       = useState(false);
  const [showInbox,        setShowInbox]        = useState(false);

  // ── Veri Yükleme ──────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [gList, pList] = await Promise.all([getGorevler(), getProjects()]);
      setGorevler(gList);
      setProjects(pList);
    } catch (e: any) {
      console.error("Veri yüklenemedi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setInboxItems(getInboxItems());
    const unsub = subscribeToInbox(() => setInboxItems(getInboxItems()));
    return unsub;
  }, []);

  // ── Kapasite Hesabı ───────────────────────────────────────────
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Kapasite: bugün tarihli, aktif (tamamlanmamış + arşivlenmemiş) tüm görevler
  const kritikBugun = useMemo(
    () => gorevler.filter(
      g => !g.archived &&
           g.planlanan_tarih === todayStr &&
           g.sutun_durumu !== "Tamamlandı"
    ).length,
    [gorevler, todayStr]
  );

  const kapasite = Math.min((kritikBugun / KAPASITE_MAX) * 100, 100);
  const kapasiteDolu = kritikBugun >= KAPASITE_MAX;

  const kapasiteRenk = useMemo(() => {
    if (kapasite >= 100) return { bar: "bg-rose-500",   text: "text-rose-400",   border: "border-rose-500/30",   bg: "bg-rose-500/5" };
    if (kapasite >= 67)  return { bar: "bg-amber-500",  text: "text-amber-400",  border: "border-amber-500/30",  bg: "bg-amber-500/5" };
    if (kapasite >= 34)  return { bar: "bg-yellow-400", text: "text-yellow-400", border: "border-yellow-500/20", bg: "bg-yellow-500/5" };
    return                      { bar: "bg-emerald-500",text: "text-emerald-400",border: "border-emerald-500/20",bg: "bg-emerald-500/5" };
  }, [kapasite]);

  // ── Görev CRUD ────────────────────────────────────────────────
  const handleSaveGorev = async (formData: any) => {
    try {
      if (formData.id) await updateGorev(formData.id, formData);
      else              await addGorev(formData);
      setModalOpen(false);
      loadData();
    } catch (e: any) {
      alert("Görev kaydedilemedi: " + (e?.message || String(e)));
    }
  };

  const handleDeleteGorev = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Bu görevi kalıcı olarak silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteGorev(id);
      loadData();
    } catch (e: any) {
      alert("Görev silinemedi: " + (e?.message || String(e)));
    }
  };

  const handleArchiveToggle = async (e: React.MouseEvent, gorev: Gorev) => {
    e.stopPropagation();
    try {
      const newArchived = !gorev.archived;
      // Optimistic update
      setGorevler(prev => prev.map(g => g.id === gorev.id ? { ...g, archived: newArchived } : g));
      await updateGorev(gorev.id, { archived: newArchived } as any);
    } catch (e: any) {
      alert("Arşiv durumu güncellenemedi: " + (e?.message || String(e)));
      loadData();
    }
  };

  // ── Drag & Drop ───────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData("text/plain", id);
    setTimeout(() => {
      const el = document.getElementById(`task-${id}`);
      if (el) el.style.opacity = "0.4";
    }, 0);
  };

  const handleDragEnd = (id: string) => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
    const el = document.getElementById(`task-${id}`);
    if (el) el.style.opacity = "1";
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDragOverColumn(null);
    if (!taskId) return;
    const task = gorevler.find(g => g.id === taskId);
    if (!task || task.sutun_durumu === colId) return;
    try {
      setGorevler(prev => prev.map(g => g.id === taskId ? { ...g, sutun_durumu: colId as any } : g));
      await updateGorev(taskId, { sutun_durumu: colId as any });
    } catch (e: any) {
      alert("Taşıma başarısız: " + (e?.message || String(e)));
      loadData();
    }
  };

  const moveTask = async (id: string, dir: "left" | "right") => {
    const task = gorevler.find(g => g.id === id);
    if (!task) return;
    const idx = SUTUNLAR.findIndex(s => s.id === task.sutun_durumu);
    const next = idx + (dir === "right" ? 1 : -1);
    if (next < 0 || next >= SUTUNLAR.length) return;
    const nextStatus = SUTUNLAR[next].id;
    try {
      setGorevler(prev => prev.map(g => g.id === id ? { ...g, sutun_durumu: nextStatus as any } : g));
      await updateGorev(id, { sutun_durumu: nextStatus as any });
    } catch (e: any) {
      alert("Taşıma başarısız: " + (e?.message || String(e)));
      loadData();
    }
  };

  // ── Inbox ─────────────────────────────────────────────────────
  const handleInboxAdd = () => {
    if (!inboxInput.trim()) return;
    addInboxItem(inboxInput);
    setInboxInput("");
    setInboxSaved(true);
    setTimeout(() => setInboxSaved(false), 1200);
  };

  const handleConvertInboxItem = async (item: InboxItem) => {
    try {
      await addGorev({
        gorev_adi: item.text,
        detay: null,
        kategori: "Kişisel / Rutin",
        sutun_durumu: "Yapılmayı Bekleyenler",
        planlanan_tarih: todayStr,
        oncelik: "Orta",
        proje_id: null,
      });
      deleteInboxItem(item.id);
      loadData();
    } catch (e: any) {
      alert("Karta dönüştürülemedi: " + (e?.message || String(e)));
    }
  };

  // ── Filtreleme ────────────────────────────────────────────────
  const getProjectTitle = (id: string | null) => {
    if (!id) return null;
    return projects.find(p => p.id === id)?.title ?? "Bilinmeyen Proje";
  };

  const filteredGorevler = useMemo(() => {
    return gorevler.filter(g => {
      if (showArchived ? !g.archived : g.archived) return false;
      const matchSearch = g.gorev_adi.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (g.detay || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchKategori = kategoriFilter === "all" || g.kategori === kategoriFilter;
      const matchOncelik  = oncelikFilter  === "all" || g.oncelik  === oncelikFilter;
      return matchSearch && matchKategori && matchOncelik;
    });
  }, [gorevler, showArchived, searchQuery, kategoriFilter, oncelikFilter]);

  const archivedCount = useMemo(() => gorevler.filter(g => g.archived).length, [gorevler]);

  // ── Render ────────────────────────────────────────────────────
  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-5">

        {/* ── Başlık Satırı ─────────────────────────────────── */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black">Gündelik Plan</h1>
            <p className="text-xs text-slate-400">Görevlerini sürükle-bırak ile yönet, arşivle, plana al</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Arşiv Toggle */}
            <button
              onClick={() => setShowArchived(v => !v)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showArchived
                  ? "bg-slate-700/60 border-slate-600/40 text-slate-200"
                  : "bg-slate-900/60 border-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              {showArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
              {showArchived ? "Aktif Görevler" : `Arşiv${archivedCount > 0 ? ` (${archivedCount})` : ""}`}
            </button>

            {/* Inbox Toggle */}
            <button
              onClick={() => setShowInbox(v => !v)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showInbox
                  ? "bg-amber-600/20 border-amber-500/30 text-amber-300"
                  : "bg-slate-900/60 border-slate-800/60 text-slate-400 hover:text-amber-400 hover:border-amber-500/20"
              }`}
            >
              <Inbox size={13} />
              Inbox{inboxItems.length > 0 && <span className="ml-0.5 bg-amber-500 text-white rounded-full text-[9px] font-black px-1.5 py-0.5">{inboxItems.length}</span>}
            </button>

            <button
              onClick={() => { setSelectedGorev(null); setTargetColumn(undefined); setModalOpen(true); }}
              className="btn btn-primary bg-blue-600 hover:bg-blue-700 flex gap-2 items-center text-xs cursor-pointer"
            >
              <Plus size={14} /> Yeni Görev
            </button>
          </div>
        </div>

        {/* ── 1. KAPASİTE BARI ──────────────────────────────── */}
        {!showArchived && (
          <div className={`glass-card border transition-all duration-500 ${kapasiteDolu ? kapasiteRenk.border + " " + kapasiteRenk.bg : "border-slate-800/40"}`}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${kapasiteRenk.border} ${kapasiteRenk.bg}`}>
                  <Brain size={14} className={kapasiteRenk.text} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    Günlük Kapasite
                    {kapasiteDolu && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${kapasiteRenk.border} ${kapasiteRenk.bg} ${kapasiteRenk.text} flex items-center gap-1 animate-pulse`}>
                        <AlertTriangle size={9} /> DOLU
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {kapasiteDolu
                      ? "Bugün için kritik görev sınırına ulaştın — zihinsel yük yönetimi için yeni kritik görev ekleme."
                      : `Bugün ${KAPASITE_MAX - kritikBugun} kritik görev kapasiten daha var.`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 min-w-[180px] flex-1 max-w-xs">
                <div className="flex-1 h-2 bg-slate-950/60 rounded-full overflow-hidden border border-slate-800/40">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${kapasiteRenk.bar} ${kapasiteDolu ? "animate-pulse" : ""}`}
                    style={{ width: `${kapasite}%` }}
                  />
                </div>
                <span className={`text-xs font-black whitespace-nowrap tabular-nums ${kapasiteRenk.text}`}>
                  {kritikBugun} / {KAPASITE_MAX}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. INBOX PANELİ ──────────────────────────────── */}
        {showInbox && (
          <div className="glass-card border border-amber-500/20 bg-amber-500/5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <Zap size={13} className="text-amber-400" />
                Hızlı Fikir Kutusu — Inbox
              </h3>
              <span className="text-[9px] text-amber-500/70 font-semibold">
                Enter ile ekle · Karta dönüştür
              </span>
            </div>

            {/* Hızlı input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inboxInput}
                  onChange={e => setInboxInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleInboxAdd(); }}
                  placeholder="Aklına gelen bir şey... (Enter ile kaydet)"
                  className="w-full bg-slate-950/60 border border-amber-500/20 focus:border-amber-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 outline-none transition-all pr-9"
                  autoFocus
                />
                {inboxSaved ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 text-[10px] font-black animate-pulse">✓</span>
                ) : (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] font-bold">↵</span>
                )}
              </div>
              <button
                onClick={handleInboxAdd}
                className="px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-bold transition-all cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Inbox Listesi */}
            {inboxItems.length === 0 ? (
              <p className="text-[10px] text-slate-600 italic text-center py-3">Inbox boş — yukarıdan not ekle</p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                {inboxItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2 p-2.5 bg-slate-950/40 border border-slate-800/50 rounded-xl group/inbox hover:border-amber-500/20 transition-all">
                    <span className="flex-1 text-xs text-slate-300 truncate">{item.text}</span>
                    <span className="text-[9px] text-slate-600 shrink-0">
                      {new Date(item.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <button
                      onClick={() => handleConvertInboxItem(item)}
                      className="shrink-0 text-[9px] font-bold px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg transition-all cursor-pointer opacity-0 group-hover/inbox:opacity-100"
                      title="Göreve Dönüştür"
                    >
                      → Kart
                    </button>
                    <button
                      onClick={() => deleteInboxItem(item.id)}
                      className="shrink-0 p-0.5 text-slate-600 hover:text-red-400 rounded transition-all cursor-pointer opacity-0 group-hover/inbox:opacity-100"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Filtre Paneli ────────────────────────────────── */}
        <div className="glass-card flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Görev ara..."
              className="w-full pl-8 pr-3 py-2 bg-slate-950/60 border border-slate-800/60 focus:border-blue-500/50 rounded-xl outline-none text-xs text-slate-200"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="bg-slate-950/60 border border-slate-800/60 rounded-xl outline-none text-xs text-slate-200 px-3 py-2 cursor-pointer focus:border-blue-500/50"
            value={kategoriFilter}
            onChange={e => setKategoriFilter(e.target.value)}
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="Prodüksiyon">Prodüksiyon</option>
            <option value="Sosyal Medya">Sosyal Medya</option>
            <option value="Vize">Vize</option>
            <option value="Kişisel / Rutin">Kişisel / Rutin</option>
          </select>
          <select
            className="bg-slate-950/60 border border-slate-800/60 rounded-xl outline-none text-xs text-slate-200 px-3 py-2 cursor-pointer focus:border-blue-500/50"
            value={oncelikFilter}
            onChange={e => setOncelikFilter(e.target.value)}
          >
            <option value="all">Tüm Öncelikler</option>
            <option value="Düşük">Düşük</option>
            <option value="Orta">Orta</option>
            <option value="Yüksek">Yüksek</option>
          </select>
        </div>

        {/* ── 3. KANBAN BOARD ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-[55vh]">
          {SUTUNLAR.map(column => {
            const columnTasks = filteredGorevler.filter(g => g.sutun_durumu === column.id);
            const isOver      = dragOverColumn === column.id;

            return (
              <div
                key={column.id}
                onDragOver={e => { e.preventDefault(); setDragOverColumn(column.id); }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={e => handleDrop(e, column.id)}
                className={`flex flex-col gap-3 bg-slate-900/20 border rounded-2xl p-3.5 transition-all duration-300 ${
                  isOver ? "border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/5" : "border-slate-800/40"
                }`}
                style={{ boxShadow: isOver ? `0 10px 30px -10px ${column.glow}` : "none" }}
              >
                {/* Sütun Başlığı */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/30">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${column.color}`} />
                    <span className="text-xs font-bold text-slate-200 hidden lg:block">{column.label}</span>
                    <span className="text-xs font-bold text-slate-200 lg:hidden">{column.short}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400 text-[10px] font-bold">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Kartlar */}
                <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 max-h-[55vh] pr-0.5 scrollbar-none min-h-[200px]">
                  {columnTasks.length === 0 ? (
                    <div className="flex-1 flex flex-col justify-center items-center py-10 text-slate-700 border border-dashed border-slate-800/40 rounded-xl text-center">
                      <Clock size={16} strokeWidth={1.5} className="mb-2 opacity-50" />
                      <span className="text-[10px] font-semibold">Görev yok</span>
                    </div>
                  ) : (
                    columnTasks.map(task => {
                      const cat  = KATEGORI_COLORS[task.kategori] ?? { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" };
                      const totalCL     = task.checklist?.length ?? 0;
                      const doneCL      = task.checklist?.filter(i => i.completed).length ?? 0;
                      const clDone      = totalCL > 0 && totalCL === doneCL;
                      const isToday     = task.planlanan_tarih === todayStr;
                      const isOverdue   = !task.archived && task.planlanan_tarih < todayStr && column.id !== "Tamamlandı";

                      return (
                        <div
                          key={task.id}
                          id={`task-${task.id}`}
                          draggable
                          onDragStart={e => handleDragStart(e, task.id)}
                          onDragEnd={() => handleDragEnd(task.id)}
                          onClick={() => { setSelectedGorev(task); setTargetColumn(undefined); setModalOpen(true); }}
                          className={`p-3.5 border rounded-xl flex flex-col gap-2.5 group relative cursor-grab active:cursor-grabbing transition-all duration-200 shadow-sm hover:shadow-md hover:border-slate-700/60 ${
                            isOverdue
                              ? "bg-red-950/10 border-red-500/15 hover:border-red-500/25"
                              : "bg-slate-900 border-slate-800/60"
                          }`}
                        >
                          {/* Kategori + Aksiyon butonları */}
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${cat.bg} ${cat.text} ${cat.border}`}>
                              {task.kategori}
                            </span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              {/* Arşivle / Geri Al */}
                              <button
                                onClick={e => handleArchiveToggle(e, task)}
                                className={`p-0.5 rounded transition-all cursor-pointer ${
                                  task.archived
                                    ? "text-emerald-400 hover:text-emerald-300"
                                    : "text-slate-500 hover:text-amber-400"
                                }`}
                                title={task.archived ? "Arşivden Çıkar" : "Arşivle"}
                              >
                                {task.archived ? <ArchiveRestore size={11} /> : <Archive size={11} />}
                              </button>
                              {/* Sil */}
                              <button
                                onClick={e => handleDeleteGorev(e, task.id)}
                                className="p-0.5 text-slate-500 hover:text-red-400 rounded transition-all cursor-pointer"
                                title="Kalıcı Sil"
                              >
                                <Trash2 size={11} strokeWidth={1.5} />
                              </button>
                            </div>
                          </div>

                          {/* Başlık */}
                          <div className="flex items-start gap-1.5">
                            {column.id === "Tamamlandı" && (
                              <CheckCircle2 size={11} className="text-emerald-500 shrink-0 mt-0.5" />
                            )}
                            <h4 className="font-bold text-xs text-slate-200 leading-snug group-hover:text-blue-400 transition-colors">
                              {task.gorev_adi}
                            </h4>
                          </div>

                          {/* Checklist & Yorum rozetleri */}
                          {((task.checklist?.length ?? 0) > 0 || (task.comments?.length ?? 0) > 0) && (
                            <div className="flex flex-wrap gap-1.5">
                              {totalCL > 0 && (
                                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                  clDone ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-950/40 border-slate-800/40 text-slate-400"
                                }`}>
                                  <CheckSquare size={9} /> {doneCL}/{totalCL}
                                </span>
                              )}
                              {(task.comments?.length ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border bg-slate-950/40 border-slate-800/40 text-slate-400">
                                  <MessageSquare size={9} /> {task.comments!.length}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Alt meta: Proje, Tarih, Öncelik */}
                          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/40">
                            {task.proje_id && (
                              <div className="flex items-center gap-1 text-[9px] text-slate-400 bg-blue-500/5 border border-blue-500/10 px-1.5 py-0.5 rounded truncate">
                                <Briefcase size={9} className="text-blue-500 shrink-0" />
                                <span className="truncate">{getProjectTitle(task.proje_id)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-[9px] text-slate-500 font-semibold">
                              <span className={`flex items-center gap-1 ${isOverdue ? "text-red-400 font-bold" : isToday ? "text-blue-400 font-bold" : ""}`}>
                                <Calendar size={10} strokeWidth={1.5} />
                                {task.planlanan_tarih}
                                {isOverdue && " ⚠"}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${ONCELIK_COLORS[task.oncelik]}`}>
                                {task.oncelik}
                              </span>
                            </div>

                            {/* Taşı ← → butonları */}
                            <div className="flex justify-between items-center pt-1.5 border-t border-slate-800/30 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={e => { e.stopPropagation(); moveTask(task.id, "left"); }}
                                disabled={task.sutun_durumu === SUTUNLAR[0].id}
                                className="p-1 rounded bg-slate-950/60 hover:bg-slate-800 border border-slate-800/40 text-slate-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all"
                              >
                                <ChevronLeft size={10} strokeWidth={2} />
                              </button>
                              <span className="text-[8px] text-slate-600 font-bold uppercase tracking-wider">Taşı</span>
                              <button
                                onClick={e => { e.stopPropagation(); moveTask(task.id, "right"); }}
                                disabled={task.sutun_durumu === SUTUNLAR[SUTUNLAR.length - 1].id}
                                className="p-1 rounded bg-slate-950/60 hover:bg-slate-800 border border-slate-800/40 text-slate-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all"
                              >
                                <ChevronRight size={10} strokeWidth={2} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Sütun altı Hızlı Ekle */}
                {!showArchived && (
                  <button
                    onClick={() => { setSelectedGorev(null); setTargetColumn(column.id); setModalOpen(true); }}
                    className="w-full py-2 bg-slate-950/20 hover:bg-slate-950/50 border border-dashed border-slate-800/60 hover:border-blue-500/25 rounded-xl text-[10px] text-slate-500 hover:text-blue-400 font-bold flex justify-center items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus size={10} /> Hızlı Ekle
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Görev Modalı */}
      {modalOpen && (
        <GorevModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveGorev}
          gorev={selectedGorev}
          projects={projects}
          defaultColumn={targetColumn}
        />
      )}
    </AuthenticatedLayout>
  );
}
