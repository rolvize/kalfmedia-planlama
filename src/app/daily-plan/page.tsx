"use client";

import React, { useState, useEffect } from "react";
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
  Flag, 
  Briefcase,
  AlertCircle,
  Clock,
  Sparkles,
  CheckSquare,
  MessageSquare,
  Eye,
  AlignLeft,
  CheckCircle2,
  Layers
} from "lucide-react";
import GorevModal from "../../components/forms/GorevModal";

const SUTUNLAR = [
  { id: "Yapılmayı Bekleyenler", label: "Yapılmayı Bekleyenler", color: "from-amber-600 to-amber-500", glow: "rgba(245, 158, 11, 0.15)" },
  { id: "Yapılacaklar", label: "Yapılacaklar", color: "from-blue-600 to-indigo-500", glow: "rgba(59, 130, 246, 0.15)" },
  { id: "Yapılıyor", label: "Yapılıyor", color: "from-purple-600 to-pink-500", glow: "rgba(168, 85, 247, 0.15)" },
  { id: "Test", label: "Test", color: "from-cyan-600 to-blue-500", glow: "rgba(6, 182, 212, 0.15)" },
  { id: "Tamamlandı", label: "Tamamlandı", color: "from-emerald-600 to-teal-500", glow: "rgba(16, 185, 129, 0.15)" }
];

const KATEGORI_COLORS: { [key: string]: { bg: string, text: string, border: string } } = {
  "Prodüksiyon": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  "Sosyal Medya": { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
  "Vize": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  "Kişisel / Rutin": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" }
};

const ONCELIK_COLORS: { [key: string]: { bg: string, text: string } } = {
  "Düşük": { bg: "bg-slate-800 text-slate-400", text: "text-slate-400" },
  "Orta": { bg: "bg-blue-800/40 text-blue-300", text: "text-blue-300" },
  "Yüksek": { bg: "bg-red-950/60 text-red-400 border border-red-500/20", text: "text-red-400" }
};

export default function DailyPlanPage() {
  const [loading, setLoading] = useState(true);
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Arama & Filtreleme
  const [searchQuery, setSearchQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("all");
  const [oncelikFilter, setOncelikFilter] = useState("all");
  
  // Drag and Drop States
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGorev, setSelectedGorev] = useState<Gorev | null>(null);
  const [targetColumn, setTargetColumn] = useState<string | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    try {
      const gList = await getGorevler();
      const pList = await getProjects();
      setGorevler(gList);
      setProjects(pList);
    } catch (e) {
      console.error("Veriler yüklenirken hata oluştu:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = (columnId?: string) => {
    setSelectedGorev(null);
    setTargetColumn(columnId);
    setModalOpen(true);
  };

  const handleOpenEditModal = (gorev: Gorev) => {
    setSelectedGorev(gorev);
    setTargetColumn(undefined);
    setModalOpen(true);
  };

  const handleSaveGorev = async (formData: any) => {
    try {
      if (formData.id) {
        await updateGorev(formData.id, formData);
      } else {
        await addGorev(formData);
      }
      setModalOpen(false);
      loadData();
    } catch (e) {
      alert("Görev kaydedilemedi: " + e);
    }
  };

  const handleDeleteGorev = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Bu görevi silmek istediğinizden emin misiniz?")) {
      try {
        await deleteGorev(id);
        loadData();
      } catch (e) {
        alert("Görev silinemedi: " + e);
      }
    }
  };

  // SÜRÜKLE BIRAK (DRAG AND DROP)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData("text/plain", id);
    // Drag opacity efekti
    setTimeout(() => {
      const element = document.getElementById(`task-card-${id}`);
      if (element) element.style.opacity = "0.4";
    }, 0);
  };

  const handleDragEnd = (id: string) => {
    setDraggedTaskId(null);
    setDraggedOverColumn(null);
    const element = document.getElementById(`task-card-${id}`);
    if (element) element.style.opacity = "1";
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedOverColumn !== columnId) {
      setDraggedOverColumn(columnId);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedOverColumn(null);
    
    if (!taskId) return;
    
    const task = gorevler.find(g => g.id === taskId);
    if (!task || task.sutun_durumu === targetColumnId) return;

    try {
      // Yerel state güncellemesi (Anında hissettirmek için)
      setGorevler(prev => prev.map(g => g.id === taskId ? { ...g, sutun_durumu: targetColumnId as any } : g));
      await updateGorev(taskId, { sutun_durumu: targetColumnId as any });
    } catch (e) {
      alert("Durum güncellenemedi: " + e);
      loadData();
    }
  };

  // BUTONLA DURUM DEĞİŞTİRME (YAĞ GİBİ AKITAN YÖNLER)
  const moveTask = async (id: string, direction: "left" | "right") => {
    const task = gorevler.find(g => g.id === id);
    if (!task) return;
    
    const currentIndex = SUTUNLAR.findIndex(s => s.id === task.sutun_durumu);
    let nextIndex = currentIndex + (direction === "right" ? 1 : -1);
    
    if (nextIndex < 0 || nextIndex >= SUTUNLAR.length) return;
    
    const nextStatus = SUTUNLAR[nextIndex].id;

    try {
      // Yerel state güncellemesi
      setGorevler(prev => prev.map(g => g.id === id ? { ...g, sutun_durumu: nextStatus as any } : g));
      await updateGorev(id, { sutun_durumu: nextStatus as any });
    } catch (e) {
      alert("Durum güncellenemedi: " + e);
      loadData();
    }
  };

  // PROJE ADINI ALMA
  const getProjectTitle = (projeId: string | null) => {
    if (!projeId) return null;
    const proj = projects.find(p => p.id === projeId);
    return proj ? proj.title : "Bilinmeyen Proje";
  };

  // FİLTRELEME
  const filteredGorevler = gorevler.filter(g => {
    const matchesSearch = g.gorev_adi.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (g.detay || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKategori = kategoriFilter === "all" || g.kategori === kategoriFilter;
    const matchesOncelik = oncelikFilter === "all" || g.oncelik === oncelikFilter;
    return matchesSearch && matchesKategori && matchesOncelik;
  });

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        
        {/* Üst Sayfa Başlığı */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black">Gündelik Plan (Kanban)</h1>
            <p className="text-xs text-slate-400">Günlük mikro görevlerinizi ve bağımsız rutinlerinizi planlayın</p>
          </div>

          <button 
            onClick={() => handleOpenAddModal()}
            className="btn btn-primary bg-blue-600 hover:bg-blue-700 flex gap-2 items-center text-xs cursor-pointer transition-all duration-300 ease-[0.16,1,0.3,1]"
          >
            <Plus size={14} strokeWidth={1.5} /> Yeni Görev Ekle
          </button>
        </div>

        {/* Filtreleme Paneli */}
        <div className="glass-card flex flex-wrap gap-4 items-center">
          {/* Arama Barı */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Görev adı veya notlarda ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800/60 focus:border-blue-500/50 rounded-xl outline-none text-xs text-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Kategori Filtresi */}
          <select
            className="w-44 bg-slate-950/60 border border-slate-800/60 rounded-xl outline-none text-xs text-slate-200 px-3 py-2 cursor-pointer focus:border-blue-500/50"
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="Prodüksiyon">Prodüksiyon</option>
            <option value="Sosyal Medya">Sosyal Medya</option>
            <option value="Vize">Vize</option>
            <option value="Kişisel / Rutin">Kişisel / Rutin</option>
          </select>

          {/* Öncelik Filtresi */}
          <select
            className="w-40 bg-slate-950/60 border border-slate-800/60 rounded-xl outline-none text-xs text-slate-200 px-3 py-2 cursor-pointer focus:border-blue-500/50"
            value={oncelikFilter}
            onChange={(e) => setOncelikFilter(e.target.value)}
          >
            <option value="all">Tüm Öncelikler</option>
            <option value="Düşük">Düşük</option>
            <option value="Orta">Orta</option>
            <option value="Yüksek">Yüksek</option>
          </select>
        </div>

        {/* KANBAN BOARD - Single Page layout grid (Cols are side-by-side on desktop without scroll) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 min-h-[60vh]">
          {SUTUNLAR.map(column => {
            const columnTasks = filteredGorevler.filter(g => g.sutun_durumu === column.id);
            const isOver = draggedOverColumn === column.id;

            return (
              <div 
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`flex flex-col gap-4 bg-slate-900/20 border rounded-2xl p-4.5 transition-all duration-300 ease-[0.16,1,0.3,1] ${
                  isOver 
                    ? "border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/5" 
                    : "border-slate-800/40"
                }`}
                style={{
                  boxShadow: isOver ? `0 10px 30px -10px ${column.glow}` : "none"
                }}
              >
                {/* Sütun Başlığı */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/30">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${column.color}`}></span>
                    <span className="text-xs font-bold text-slate-200">{column.label}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400 text-[10px] font-bold">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Sütun Kartları Listesi */}
                <div className="flex flex-col gap-3 overflow-y-auto flex-1 max-h-[60vh] pr-1 scrollbar-none min-h-[250px]">
                  {columnTasks.length === 0 ? (
                    <div className="flex-1 flex flex-col justify-center items-center py-12 text-slate-600 text-center border border-dashed border-slate-800/40 rounded-xl">
                      <Clock size={16} strokeWidth={1.5} className="mb-2 opacity-50" />
                      <span className="text-[10px] font-semibold">Görev Yok</span>
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const catStyle = KATEGORI_COLORS[task.kategori] || { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" };
                      const priorityStyle = ONCELIK_COLORS[task.oncelik] || { bg: "bg-slate-800 text-slate-400", text: "text-slate-400" };
                      const hasProject = !!task.proje_id;
                      
                      // Calculate checklist progress
                      const totalChecklist = task.checklist?.length || 0;
                      const completedChecklist = task.checklist?.filter(item => item.completed).length || 0;
                      const isChecklistDone = totalChecklist > 0 && totalChecklist === completedChecklist;

                      return (
                        <div
                          key={task.id}
                          id={`task-card-${task.id}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={() => handleDragEnd(task.id)}
                          onClick={() => handleOpenEditModal(task)}
                          className="p-4 bg-slate-900 border border-slate-800/60 hover:border-slate-700/50 rounded-xl flex flex-col gap-3 group relative cursor-grab active:cursor-grabbing transition-all duration-300 ease-[0.16,1,0.3,1] shadow-sm hover:shadow-md"
                        >
                          {/* Üst Kısım: Kategori ve Hızlı İşlemler */}
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                              {task.kategori}
                            </span>
                            
                            {/* Silme Butonu (Hover'da gözükür) */}
                            <button
                              onClick={(e) => handleDeleteGorev(e, task.id)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-red-400 rounded transition-all duration-300 cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 size={12} strokeWidth={1.5} />
                            </button>
                          </div>

                          {/* Başlık ve Detay */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-start gap-1.5">
                              {/* Tamamlandı Sütunu için Check İkonu */}
                              {column.id === "Tamamlandı" && (
                                <CheckCircle2 size={12} className="text-emerald-550 shrink-0 mt-0.5" />
                              )}
                              <h4 className="font-bold text-xs text-slate-200 leading-snug group-hover:text-blue-400 transition-colors duration-300 ease-[0.16,1,0.3,1]">
                                {task.gorev_adi}
                              </h4>
                            </div>
                            {task.detay && (
                              <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                                {task.detay}
                              </p>
                            )}
                          </div>

                          {/* Checklist & Comments Badges (Trello style) */}
                          {((task.checklist && task.checklist.length > 0) || (task.comments && task.comments.length > 0)) && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {task.checklist && task.checklist.length > 0 && (() => {
                                return (
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border transition-all ${
                                    isChecklistDone 
                                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-extrabold" 
                                      : "bg-slate-950/40 border-slate-800/40 text-slate-400"
                                  }`} title="Kontrol Listesi">
                                    <CheckSquare size={10} className="shrink-0" />
                                    {completedChecklist}/{totalChecklist}
                                  </span>
                                );
                              })()}

                              {task.comments && task.comments.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border bg-slate-950/40 border-slate-800/40 text-slate-400" title="Yorumlar">
                                  <MessageSquare size={10} className="shrink-0" />
                                  {task.comments.length}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Alt Bölüm: Proje, Tarih ve Yön Butonları */}
                          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/40">
                            {/* Bağlantılı Proje */}
                            {hasProject && (
                              <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold bg-blue-500/5 border border-blue-500/10 px-1.5 py-0.5 rounded truncate">
                                <Briefcase size={10} className="text-blue-500 shrink-0" />
                                <span className="truncate">{getProjectTitle(task.proje_id)}</span>
                              </div>
                            )}

                            {/* Tarih ve Öncelik */}
                            <div className="flex justify-between items-center text-[9px] text-slate-500 font-semibold">
                              <div className="flex items-center gap-1">
                                <Calendar size={11} strokeWidth={1.5} />
                                <span>{task.planlanan_tarih}</span>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${priorityStyle.bg}`}>
                                {task.oncelik}
                              </span>
                            </div>

                            {/* Trello Yön Tuşları */}
                            <div className="flex justify-between items-center border-t border-slate-800/30 pt-2 mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveTask(task.id, "left");
                                }}
                                disabled={task.sutun_durumu === SUTUNLAR[0].id}
                                className="p-1 rounded bg-slate-950/60 hover:bg-slate-800 border border-slate-800/40 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                                title="Önceki Sütuna Taşı"
                              >
                                <ChevronLeft size={11} strokeWidth={2} />
                              </button>

                              <span className="text-[8px] text-slate-600 font-bold uppercase tracking-wider">Taşı</span>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveTask(task.id, "right");
                                }}
                                disabled={task.sutun_durumu === SUTUNLAR[SUTUNLAR.length - 1].id}
                                className="p-1 rounded bg-slate-950/60 hover:bg-slate-800 border border-slate-800/40 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                                title="Sonraki Sütuna Taşı"
                              >
                                <ChevronRight size={11} strokeWidth={2} />
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>

                {/* Sütun Altı Hızlı Ekle Butonu */}
                <button
                  onClick={() => handleOpenAddModal(column.id)}
                  className="w-full py-2 bg-slate-950/20 hover:bg-slate-950/50 border border-dashed border-slate-800/60 hover:border-blue-500/25 rounded-xl text-[10px] text-slate-400 hover:text-blue-400 font-bold flex justify-center items-center gap-1.5 transition-all duration-300 ease-[0.16,1,0.3,1] cursor-pointer"
                >
                  <Plus size={11} strokeWidth={1.5} /> Hızlı Görev Ekle
                </button>
              </div>
            );
          })}
        </div>

      </div>

      {/* Slide-over Form Modalı */}
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
