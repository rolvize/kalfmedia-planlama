"use client";

import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { getProjects, addProject, updateProject, deleteProject, getClients, addClient } from "../../lib/supabase/db";
import { Project, Client } from "../../types";
import {
  Plus, 
  Search, 
  SlidersHorizontal, 
  Grid, 
  List, 
  Calendar, 
  Edit, 
  Trash2, 
  Eye,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Archive
} from "lucide-react";

import ProjectModal from "../../components/forms/ProjectModal";
import ClientModal from "../../components/forms/ClientModal";
import ProjectDetailsDrawer from "../../components/kanban/ProjectDetailsDrawer";

const PIPELINE_STATUSES = [
  "Yeni Talep", "Görüşme", "Teklif Gönderildi", "Onaylandı",
  "Çekim Planlandı", "Çekim Yapıldı", "Kurgu Süreci", "Revize",
  "Teslim Edildi", "Ödeme Bekliyor", "Tamamlandı"
];

// Kolon renk eşleştirmeleri
const STATUS_COLORS: { [key: string]: string } = {
  "Yeni Talep": "#64748b",
  "Görüşme": "#3b82f6",
  "Teklif Gönderildi": "#0ea5e9",
  "Onaylandı": "#10b981",
  "Çekim Planlandı": "#f59e0b",
  "Çekim Yapıldı": "#d97706",
  "Kurgu Süreci": "#a855f7",
  "Revize": "#ec4899",
  "Teslim Edildi": "#14b8a6",
  "Ödeme Bekliyor": "#ef4444",
  "Tamamlandı": "#10b981"
};

export default function ProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Filtreler
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Modaller
  const [projectModal, setProjectModal] = useState<{ isOpen: boolean; data: Project | null }>({ isOpen: false, data: null });
  const [clientModal, setClientModal] = useState({ isOpen: false });
  const [detailsDrawer, setDetailsDrawer] = useState<{ isOpen: boolean; data: Project | null }>({ isOpen: false, data: null });

  const loadData = async () => {
    setLoading(true);
    try {
      const prjs = await getProjects();
      const clis = await getClients();
      setProjects(prjs);
      setClients(clis);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // PROJE CRUD TETİKLEYİCİLERİ
  const handleSaveProject = async (formData: any) => {
    try {
      if (formData.id) {
        await updateProject(formData.id, formData);
      } else {
        await addProject(formData);
      }
      setProjectModal({ isOpen: false, data: null });
      loadData();
    } catch (e: any) {
      alert("Proje kaydedilirken hata oluştu: " + (e?.message || String(e)));
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm("Bu işi tamamen silmek istediğinizden emin misiniz?")) {
      try {
        await deleteProject(id);
        loadData();
      } catch (e: any) {
        alert("Proje silinemedi: " + (e?.message || String(e)));
      }
    }
  };

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      await updateProject(projectId, { status: newStatus });
      // Yerel durum güncellemesi (API beklemeden anlık görsel kaydırma)
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    } catch (e: any) {
      alert("Durum güncellenemedi: " + (e?.message || String(e)));
    }
  };

  const handleToggleArchiveProject = async (id: string, currentArchived: boolean) => {
    try {
      await updateProject(id, { archived: !currentArchived });
      // Yerel durum güncellemesi
      setProjects(prev => prev.map(p => p.id === id ? { ...p, archived: !currentArchived } : p));
    } catch (e: any) {
      alert("Proje arşiv durumu güncellenemedi: " + (e?.message || String(e)));
    }
  };

  // Hızlı Müşteri Ekle
  const handleSaveClient = async (formData: any) => {
    try {
      const added = await addClient(formData);
      setClientModal({ isOpen: false });
      // Müşterileri yenile
      const list = await getClients();
      setClients(list);
      // Yeni eklenen müşteriyi aktif proje formuna bağla
      setProjectModal(prev => ({
        ...prev,
        data: prev.data ? { ...prev.data, client_id: added.id } : null
      }));
    } catch (e: any) {
      alert("Müşteri eklenemedi: " + (e?.message || String(e)));
    }
  };

  // Müşteri İsmi Bulma
  const getClientName = (clientId: string | null) => {
    if (!clientId) return "Tanımlanmamış Müşteri";
    const c = clients.find(cl => cl.id === clientId);
    return c ? (c.company ? `${c.company} (${c.name})` : c.name) : "Bilinmeyen Müşteri";
  };

  // Dinamik Yıl Listesi Çıkarma
  const availableYears = Array.from(new Set([
    ...projects.map(p => p.start_date ? new Date(p.start_date).getFullYear() : null),
    ...projects.map(p => p.due_date ? new Date(p.due_date).getFullYear() : null)
  ].filter((y): y is number => y !== null))).sort((a, b) => b - a);

  // FİLTRELEME MANTIĞI
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClient = clientFilter === "" || p.client_id === clientFilter;
    const matchesStatus = statusFilter === "" || p.status === statusFilter;
    
    // Arşiv Filtresi
    const matchesArchived = showArchived ? true : !p.archived;

    // Tarih Filtreleri (due_date veya start_date kontrolü)
    let matchesYear = true;
    let matchesMonth = true;
    let matchesDay = true;
    
    const dateStr = p.start_date || p.due_date;
    if (dateStr) {
      const d = new Date(dateStr);
      if (yearFilter) matchesYear = d.getFullYear().toString() === yearFilter;
      if (monthFilter) matchesMonth = (d.getMonth() + 1).toString() === monthFilter;
      if (dayFilter) matchesDay = d.getDate().toString() === dayFilter;
    } else if (yearFilter || monthFilter || dayFilter) {
      matchesYear = matchesMonth = matchesDay = false;
    }

    return matchesSearch && matchesClient && matchesStatus && matchesArchived && matchesYear && matchesMonth && matchesDay;
  });

  const formatCurrency = (val: number) => {
    return val.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
  };

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        
        {/* Üst Sayfa Başlığı ve Toggles */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black">Proje Yönetim Paneli</h1>
            <p className="text-xs text-slate-400">Tüm işlerin aşamalarını ve detaylarını yönetin</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Görünüm Toggles */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800/60">
              <button 
                onClick={() => setViewMode("kanban")}
                className={`p-2 rounded-lg cursor-pointer transition-all duration-300 ease-[0.16,1,0.3,1] ${viewMode === "kanban" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                title="Kanban Görünümü"
              >
                <Grid size={15} strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg cursor-pointer transition-all duration-300 ease-[0.16,1,0.3,1] ${viewMode === "table" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                title="Tablo Görünümü"
              >
                <List size={15} strokeWidth={1.5} />
              </button>
            </div>

            {/* Yeni İş Ekle */}
            <button 
              onClick={() => setProjectModal({ isOpen: true, data: null })}
              className="btn btn-primary bg-blue-600 hover:bg-blue-700 flex gap-2 items-center text-xs cursor-pointer transition-all duration-300 ease-[0.16,1,0.3,1]"
            >
              <Plus size={14} strokeWidth={1.5} /> Yeni İş Ekle
            </button>
          </div>
        </div>

        {/* Filtreleme Paneli */}
        <div className="glass-card flex flex-col gap-4">
          <div className="flex flex-wrap gap-3 items-center w-full">
            {/* Arama */}
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="İş adı veya ID ile ara..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800/60 focus:border-blue-500/50 rounded-xl outline-none text-xs text-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Müşteri Filtresi */}
            <select
              className="w-44 bg-slate-950/60 border border-slate-800/60 rounded-xl outline-none text-xs text-slate-200 px-3 py-2 cursor-pointer focus:border-blue-500/50"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <option value="">Tüm Müşteriler</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.company || c.name}</option>
              ))}
            </select>

            {/* Aşama Filtresi */}
            <select
              className="w-44 bg-slate-950/60 border border-slate-800/60 rounded-xl outline-none text-xs text-slate-200 px-3 py-2 cursor-pointer focus:border-blue-500/50"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tüm Aşamalar</option>
              {PIPELINE_STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="h-[1px] bg-slate-800/40"></div>

          <div className="flex flex-wrap gap-4 justify-between items-center w-full">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">Tarih Süzgeci</span>
              
              {/* Yıl Filtresi */}
              <select
                className="w-32 bg-slate-950/60 border border-slate-800/60 rounded-xl outline-none text-xs text-slate-200 px-3 py-2 cursor-pointer focus:border-blue-500/50"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">Tüm Yıllar</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              {/* Ay Filtresi */}
              <select
                className="w-32 bg-slate-950/60 border border-slate-800/60 rounded-xl outline-none text-xs text-slate-200 px-3 py-2 cursor-pointer focus:border-blue-500/50"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              >
                <option value="">Tüm Aylar</option>
                {["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"].map((name, idx) => (
                  <option key={name} value={idx + 1}>{name}</option>
                ))}
              </select>

              {/* Gün Filtresi */}
              <select
                className="w-32 bg-slate-950/60 border border-slate-800/60 rounded-xl outline-none text-xs text-slate-200 px-3 py-2 cursor-pointer focus:border-blue-500/50"
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
              >
                <option value="">Tüm Günler</option>
                {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              {/* Arşiv Filtresi */}
              <label className="text-xs text-slate-400 flex items-center gap-2 cursor-pointer select-none font-semibold">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 accent-blue-500 cursor-pointer"
                />
                Arşivlenmişleri Göster
              </label>
            </div>
          </div>
        </div>

        {/* 1. KANBAN GÖRÜNÜMÜ */}
        {viewMode === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4 max-h-[70vh] scrollbar-thin">
            
            {/* Kanban sütunlarını yatay listele */}
            {PIPELINE_STATUSES.map(status => {
              const statusProjects = filteredProjects.filter(p => p.status === status);
              const color = STATUS_COLORS[status] || "#64748b";

              return (
                <div 
                  key={status} 
                  className="w-72 shrink-0 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 flex flex-col gap-4 max-h-[66vh] overflow-hidden"
                >
                  {/* Sütun Başlığı */}
                  <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                      {status}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400 text-[10px] font-bold">
                      {statusProjects.length}
                    </span>
                  </div>

                  {/* Proje Kartları Listesi */}
                  <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
                    {statusProjects.length === 0 ? (
                      <p className="text-slate-500 text-[10px] text-center py-8">İş bulunmuyor.</p>
                    ) : (
                      statusProjects.map(p => {
                        const isOverdue = p.due_date && new Date(p.due_date) < new Date() && status !== "Tamamlandı";
                        const hasKdvSiz = p.description?.includes("[KDV_SIZ]") || false;
                        const hasVergiSiz = p.description?.includes("[VERGI_SIZ]") || false;
                        const kdvAmount = hasKdvSiz ? 0 : p.price * 0.2;
                        const totalAmount = hasKdvSiz ? p.price : p.price * 1.2;

                        return (
                          <div 
                            key={p.id}
                            className="p-4.5 bg-slate-900 border border-slate-800/60 hover:border-slate-700/50 rounded-2xl flex flex-col gap-3.5 group relative cursor-pointer transition-all shadow-md"
                            onClick={() => setDetailsDrawer({ isOpen: true, data: p })}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] text-blue-400 font-extrabold uppercase tracking-wider bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                {p.project_type || "Video"}
                              </span>
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-[0.16,1,0.3,1]">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleArchiveProject(p.id, !!p.archived);
                                  }}
                                  className={`p-0.5 transition-all duration-300 ease-[0.16,1,0.3,1] ${p.archived ? "text-emerald-400 hover:text-emerald-300" : "text-slate-400 hover:text-slate-200"}`}
                                  title={p.archived ? "Arşivden Çıkar" : "Arşive Gönder"}
                                >
                                  <Archive size={12} strokeWidth={1.5} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProjectModal({ isOpen: true, data: p });
                                  }}
                                  className="text-slate-400 hover:text-white p-0.5 transition-all duration-300 ease-[0.16,1,0.3,1]"
                                  title="Düzenle"
                                >
                                  <Edit size={12} strokeWidth={1.5} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProject(p.id);
                                  }}
                                  className="text-slate-400 hover:text-red-400 p-0.5 transition-all duration-300 ease-[0.16,1,0.3,1]"
                                  title="Sil"
                                >
                                  <Trash2 size={12} strokeWidth={1.5} />
                                </button>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-xs text-slate-200 leading-snug">{p.title}</h4>
                              <p className="text-[10px] text-slate-400 mt-1">{getClientName(p.client_id)}</p>
                              {(p.revision_count > 0 || p.backup_disk || hasKdvSiz || hasVergiSiz) && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {p.revision_count > 0 && (
                                    <span className="text-[9px] font-black text-pink-400 bg-pink-500/5 px-1.5 py-0.5 rounded border border-pink-500/20 inline-flex items-center gap-1 shrink-0">
                                      🔄 {p.revision_count}. Revizyon
                                    </span>
                                  )}
                                  {p.backup_disk && (
                                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/20 inline-flex items-center gap-1 shrink-0">
                                      💾 {p.backup_disk}
                                    </span>
                                  )}
                                  {hasKdvSiz && (
                                    <span className="text-[9px] font-black text-amber-400 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/20 inline-flex items-center gap-1 shrink-0 uppercase tracking-wider">
                                      KDV'siz
                                    </span>
                                  )}
                                  {hasVergiSiz && (
                                    <span className="text-[9px] font-black text-blue-400 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/20 inline-flex items-center gap-1 shrink-0 uppercase tracking-wider">
                                      Vergisiz
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Tarihler */}
                            {p.due_date && (
                              <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                <Calendar size={11} strokeWidth={1.5} />
                                <span className={isOverdue ? "text-red-400 font-bold" : ""}>
                                  Teslim: {p.due_date}
                                </span>
                                {isOverdue && <AlertTriangle size={10} strokeWidth={1.5} className="text-red-400 shrink-0" />}
                              </div>
                            )}

                            {/* Fiyat & Hızlı Taşıma */}
                            <div className="flex justify-between items-center border-t border-slate-800/60 pt-3 mt-1.5">
                              <div className="flex flex-col gap-0.5 text-[9px] text-slate-500 font-semibold leading-tight">
                                <div>Net: <span className="text-slate-300 font-bold">{formatCurrency(p.price)}</span></div>
                                <div>KDV: <span className="text-slate-400 font-bold">{hasKdvSiz ? "0 ₺ (Muaf)" : formatCurrency(kdvAmount)}</span></div>
                                <div className="text-emerald-400 font-extrabold mt-0.5">Top: {formatCurrency(totalAmount)}</div>
                              </div>
                              
                              {/* Hızlı Aşama Değiştirme */}
                              <select
                                className="bg-slate-900 border border-slate-800/60 text-[9px] rounded px-1.5 py-0.5 cursor-pointer text-slate-400 focus:outline-none"
                                value={p.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleStatusChange(p.id, e.target.value)}
                              >
                                {PIPELINE_STATUSES.map(st => (
                                  <option key={st} value={st}>{st}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* 2. TABLO GÖRÜNÜMÜ */}
        {viewMode === "table" && (
          <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800/60 text-slate-400">
                    <th className="p-3 font-bold">Proje Adı</th>
                    <th className="p-3 font-bold">Müşteri</th>
                    <th className="p-3 font-bold">Tür</th>
                    <th className="p-3 font-bold">Aşama</th>
                    <th className="p-3 font-bold">Revizyon / Disk</th>
                    <th className="p-3 font-bold">Teslim Tarihi</th>
                    <th className="p-3 font-bold">Bütçe</th>
                    <th className="p-3 font-bold text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-500">Uygun proje kaydı bulunamadı.</td>
                    </tr>
                  ) : (
                    filteredProjects.map(p => (
                      <tr 
                        key={p.id}
                        onClick={() => setDetailsDrawer({ isOpen: true, data: p })}
                        className="border-b border-slate-800/40 hover:bg-slate-900/40 even:bg-slate-900/10 cursor-pointer transition-all"
                      >
                        <td className="p-3 font-bold text-slate-200">{p.title}</td>
                        <td className="p-3 text-slate-400">{getClientName(p.client_id)}</td>
                        <td className="p-3 text-slate-400">{p.project_type || "Belirtilmemiş"}</td>
                        <td className="p-3">
                          <span className="badge-soft font-bold" style={{
                            backgroundColor: (STATUS_COLORS[p.status] || "#64748b") + "15",
                            color: STATUS_COLORS[p.status] || "#64748b",
                            borderColor: (STATUS_COLORS[p.status] || "#64748b") + "25"
                          }}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-[10px] text-slate-400 leading-normal">
                          <div className="flex flex-col gap-0.5 font-bold">
                            {p.revision_count > 0 && <span className="text-pink-400">🔄 {p.revision_count}. Revizyon</span>}
                            {p.backup_disk && <span className="text-emerald-400">💾 {p.backup_disk}</span>}
                            {!p.revision_count && !p.backup_disk && <span>-</span>}
                          </div>
                        </td>
                        <td className="p-3 text-slate-400">{p.due_date || "-"}</td>
                        <td className="p-3 text-[10px] text-slate-400 leading-normal">
                          {(() => {
                            const hasKdvSiz = p.description?.includes("[KDV_SIZ]") || false;
                            const hasVergiSiz = p.description?.includes("[VERGI_SIZ]") || false;
                            const kdvAmount = hasKdvSiz ? 0 : p.price * 0.2;
                            const totalAmount = hasKdvSiz ? p.price : p.price * 1.2;
                            return (
                              <div className="flex flex-col gap-1">
                                <div className="font-semibold text-slate-200">Net: {formatCurrency(p.price)}</div>
                                <div>KDV: {hasKdvSiz ? "0 ₺ (Muaf)" : formatCurrency(kdvAmount)}</div>
                                <div className="font-bold text-emerald-400 mt-0.5">Toplam: {formatCurrency(totalAmount)}</div>
                                <div className="flex gap-1 flex-wrap mt-1">
                                  {hasKdvSiz && <span className="px-1 py-0.5 rounded bg-slate-950 border border-slate-800 text-[7px] font-bold text-amber-400 uppercase">KDV'siz</span>}
                                  {hasVergiSiz && <span className="px-1 py-0.5 rounded bg-slate-950 border border-slate-800 text-[7px] font-bold text-blue-400 uppercase">Vergisiz</span>}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setDetailsDrawer({ isOpen: true, data: p })} className="btn-icon p-1" title="İncele">
                              <Eye size={14} strokeWidth={1.5} />
                            </button>
                            <button 
                              onClick={() => handleToggleArchiveProject(p.id, !!p.archived)} 
                              className={`btn-icon p-1 transition-all duration-300 ease-[0.16,1,0.3,1] ${p.archived ? "text-emerald-400" : ""}`} 
                              title={p.archived ? "Arşivden Çıkar" : "Arşive Gönder"}
                            >
                              <Archive size={14} strokeWidth={1.5} />
                            </button>
                            <button onClick={() => setProjectModal({ isOpen: true, data: p })} className="btn-icon p-1" title="Düzenle">
                              <Edit size={14} strokeWidth={1.5} />
                            </button>
                            <button onClick={() => handleDeleteProject(p.id)} className="btn-icon p-1 text-red-400 hover:text-red-300" title="Sil">
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* FORM MODALLERİ */}
      <ProjectModal 
        isOpen={projectModal.isOpen}
        onClose={() => setProjectModal({ isOpen: false, data: null })}
        onSave={handleSaveProject}
        project={projectModal.data}
        clients={clients}
        onQuickAddClient={() => setClientModal({ isOpen: true })}
      />

      <ClientModal 
        isOpen={clientModal.isOpen}
        onClose={() => setClientModal({ isOpen: false })}
        onSave={handleSaveClient}
        client={null}
      />

      <ProjectDetailsDrawer 
        isOpen={detailsDrawer.isOpen}
        onClose={() => setDetailsDrawer({ isOpen: false, data: null })}
        project={detailsDrawer.data}
        onProjectUpdated={loadData}
      />
    </AuthenticatedLayout>
  );
}
