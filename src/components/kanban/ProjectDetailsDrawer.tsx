"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Play, Flag, Video, CheckSquare, Plus, Trash2, Globe, FileText, CheckCircle2, Calendar } from "lucide-react";
import { Project, Gorev, Revision, Transaction } from "../../types";
import { 
  getGorevler, 
  addGorev, 
  updateGorev, 
  deleteGorev, 
  getRevisions, 
  addRevision, 
  deleteRevision,
  getTransactions,
  addTransaction,
  deleteTransaction,
  updateProject,
  getProjects
} from "../../lib/supabase/db";

interface ProjectDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onProjectUpdated: () => void; // Refresh project list in parent when needed
}

export default function ProjectDetailsDrawer({ isOpen, onClose, project, onProjectUpdated }: ProjectDetailsDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Gorev[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Form States
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newRevisionNote, setNewRevisionNote] = useState("");
  const [freeName, setFreeName] = useState("");
  const [freeRole, setFreeRole] = useState("");
  const [freeFee, setFreeFee] = useState<number>(0);

  useEffect(() => {
    if (project) {
      setCurrentProject(project);
    }
  }, [project]);

  useEffect(() => {
    if (!dialogRef.current) return;
    if (isOpen && project) {
      if (!dialogRef.current.open) {
        dialogRef.current.showModal();
      }
      loadDetails();
    } else {
      if (dialogRef.current.open) {
        dialogRef.current.close();
      }
    }
  }, [isOpen, project]);

  const loadDetails = async () => {
    if (!project) return;
    setLoading(true);
    try {
      const taskList = await getGorevler(project.id);
      const revList = await getRevisions(project.id);
      const txList = await getTransactions();
      
      setTasks(taskList);
      setRevisions(revList);
      setTransactions(txList.filter((t: any) => t.project_id === project.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const reloadProject = async () => {
    if (!project) return;
    try {
      const prjs = await getProjects();
      const found = prjs.find(p => p.id === project.id);
      if (found) setCurrentProject(found);
    } catch (e) {
      console.error(e);
    }
  };

  // GÖREV İŞLEMLERİ
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !currentProject) return;
    
    try {
      const added = await addGorev({
        proje_id: currentProject.id,
        gorev_adi: newTaskTitle,
        detay: "",
        kategori: "Prodüksiyon",
        sutun_durumu: "Yapılacaklar",
        planlanan_tarih: new Date().toISOString().split("T")[0],
        oncelik: "Orta"
      });
      setTasks(prev => [...prev, added]);
      setNewTaskTitle("");
    } catch (e) {
      alert("Görev eklenemedi: " + e);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Tamamlandı" ? "Yapılacaklar" : "Tamamlandı";
    try {
      await updateGorev(taskId, { sutun_durumu: nextStatus as any });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, sutun_durumu: nextStatus as any } : t));
    } catch (e) {
      alert("Görev güncellenemedi: " + e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteGorev(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      alert("Görev silinemedi: " + e);
    }
  };

  // REVİZYON İŞLEMLERİ
  const handleAddRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevisionNote.trim() || !currentProject) return;

    try {
      const added = await addRevision({
        project_id: currentProject.id,
        note: newRevisionNote
      });
      setRevisions(prev => [added, ...prev]);
      setNewRevisionNote("");
      onProjectUpdated(); // Proje aşaması değişebileceğinden tetikle
    } catch (e) {
      alert("Revizyon eklenemedi: " + e);
    }
  };

  const handleDeleteRevision = async (revId: string) => {
    try {
      await deleteRevision(revId);
      setRevisions(prev => prev.filter(r => r.id !== revId));
      onProjectUpdated();
    } catch (e) {
      alert("Revizyon silinemedi: " + e);
    }
  };

  // REVİZYON SAYACI İŞLEMLERİ
  const handleUpdateRevisionCount = async (diff: number) => {
    if (!currentProject) return;
    const newCount = Math.max(0, (currentProject.revision_count || 0) + diff);
    try {
      await updateProject(currentProject.id, { revision_count: newCount });
      await reloadProject();
      onProjectUpdated();
    } catch (e) {
      alert("Revizyon sayısı güncellenemedi: " + e);
    }
  };

  // KAŞE GİDERLERİ İŞLEMLERİ
  const handleAddFreelancerExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !freeName.trim() || !freeRole.trim() || !freeFee) return;

    try {
      await addTransaction({
        project_id: currentProject.id,
        type: "Gider",
        category: "Freelancer/Dış Hizmet",
        amount: freeFee,
        note: `${freeName} (${freeRole})`
      });
      setFreeName("");
      setFreeRole("");
      setFreeFee(0);
      
      // Reload details and project state
      await loadDetails();
      await reloadProject();
      onProjectUpdated();
    } catch (e) {
      alert("Kaşe gideri eklenemedi: " + e);
    }
  };

  const handleDeleteFreelancerExpense = async (txId: string) => {
    if (!confirm("Bu kaşe giderini silmek istediğinize emin misiniz?")) return;
    try {
      await deleteTransaction(txId);
      await loadDetails();
      await reloadProject();
      onProjectUpdated();
    } catch (e) {
      alert("Kaşe gideri silinemedi: " + e);
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
  };

  if (!currentProject) return null;

  return (
    <dialog ref={dialogRef} className="modal modal-large" onClose={onClose}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-800/40">
        <div>
          <span className="text-[10px] text-blue-500 font-extrabold uppercase tracking-widest">{currentProject.project_type || "Proje"}</span>
          <h2 className="text-lg font-black text-slate-100 mt-1">{currentProject.title}</h2>
          <span className="text-[10px] text-slate-500 block">ID: {currentProject.id}</span>
        </div>
        <button className="btn-icon p-2 hover:bg-slate-800/60 rounded-xl transition-all duration-300 ease-[0.16,1,0.3,1]" onClick={onClose}>
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-1 text-xs text-slate-300 scrollbar-thin">
        
        {/* Proje Açıklaması */}
        {currentProject.description && (
          <div className="glass-card" style={{ padding: "1rem" }}>
            <h4 className="font-bold text-slate-200 mb-2">Proje Notları / Detayları</h4>
            <p className="leading-relaxed text-slate-400 font-medium">{currentProject.description}</p>
          </div>
        )}

        {/* Medya & Asset Bağlantıları */}
        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <h4 className="font-bold text-slate-200 mb-3 flex gap-2 items-center">
            <Globe size={14} strokeWidth={1.5} className="text-emerald-400" />
            Dosya & Asset Bağlantıları
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {currentProject.drive_link ? (
              <a href={currentProject.drive_link} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 text-blue-400 font-semibold flex items-center justify-center gap-2 transition-all duration-300 ease-[0.16,1,0.3,1]">
                <FileText size={14} strokeWidth={1.5} /> Google Drive
              </a>
            ) : (
              <span className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-500 text-center font-semibold">Drive Tanımsız</span>
            )}

            {currentProject.frameio_link ? (
              <a href={currentProject.frameio_link} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10 text-purple-400 font-semibold flex items-center justify-center gap-2 transition-all duration-300 ease-[0.16,1,0.3,1]">
                <Video size={14} strokeWidth={1.5} /> Frame.io
              </a>
            ) : (
              <span className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-500 text-center font-semibold">Frame.io Tanımsız</span>
            )}

            {currentProject.moodboard_link ? (
              <a href={currentProject.moodboard_link} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 font-semibold flex items-center justify-center gap-2 transition-all duration-300 ease-[0.16,1,0.3,1]">
                <CheckCircle2 size={14} strokeWidth={1.5} /> Moodboard / Miro
              </a>
            ) : (
              <span className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-500 text-center font-semibold">Moodboard Tanımsız</span>
            )}
          </div>
        </div>

        {/* Revizyon & Arşiv Takip Alanı */}
        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <h4 className="font-bold text-slate-200 mb-3 flex justify-between items-center">
            <span>Revizyon & Arşiv Bilgileri</span>
            {currentProject.backup_disk ? (
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/15">
                💾 Yedeklendi: {currentProject.backup_disk}
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-slate-500">💾 Henüz Yedeklenmedi</span>
            )}
          </h4>
          
          <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800/60 rounded-xl">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 font-bold">Müşteri Revizyon Sayısı</span>
              <span className="text-xxs text-slate-500">Müşteriden gelen resmi revize talepleri</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleUpdateRevisionCount(-1)}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800/60 text-slate-400 hover:text-slate-100 flex items-center justify-center font-bold text-base transition-all duration-300 ease-[0.16,1,0.3,1] cursor-pointer"
                disabled={currentProject.revision_count <= 0}
              >
                -
              </button>
              <span className="text-sm font-black text-pink-400 min-w-[20px] text-center">
                {currentProject.revision_count}
              </span>
              <button 
                onClick={() => handleUpdateRevisionCount(1)}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800/60 text-slate-400 hover:text-slate-100 flex items-center justify-center font-bold text-base transition-all duration-300 ease-[0.16,1,0.3,1] cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Dış Hizmet / Kaşe Giderleri */}
        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <h4 className="font-bold text-slate-200 mb-3">Dış Hizmet & Kaşe Takibi</h4>

          {/* Finansal Özet Kartı */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-center">
            <div className="p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold block">Toplam Bütçe</span>
              <span className="text-xs font-black text-slate-200">{formatCurrency(currentProject.price)}</span>
            </div>
            <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-xl">
              <span className="text-[10px] text-rose-400/80 font-bold block">Giderler</span>
              <span className="text-xs font-black text-rose-400">{formatCurrency(currentProject.expense)}</span>
            </div>
            <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <span className="text-[10px] text-emerald-400/80 font-bold block">Net Kâr</span>
              <span className="text-xs font-black text-emerald-400">{formatCurrency(currentProject.net_profit)}</span>
            </div>
          </div>

          {/* Yeni Kaşe Gideri Ekleme Formu */}
          <form onSubmit={handleAddFreelancerExpense} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
            <input
              type="text"
              placeholder="Ad Soyad"
              className="form-control text-xs"
              style={{ padding: "0.625rem 0.875rem" }}
              value={freeName}
              onChange={(e) => setFreeName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Görev (Örn: Set Amiri)"
              className="form-control text-xs"
              style={{ padding: "0.625rem 0.875rem" }}
              value={freeRole}
              onChange={(e) => setFreeRole(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Kaşe (₺)"
                className="form-control text-xs flex-1"
                style={{ padding: "0.625rem 0.875rem" }}
                value={freeFee || ""}
                onChange={(e) => setFreeFee(Number(e.target.value))}
                min="0"
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 0.75rem" }} title="Kaşe Gideri Ekle">
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>
          </form>

          {/* Kaşe Giderleri Listesi */}
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
            {transactions.filter(t => t.category === "Freelancer/Dış Hizmet").length === 0 ? (
              <p className="text-xxs text-slate-500 text-center py-3">Bu projeye ait kayıtlı kaşe gideri bulunmuyor.</p>
            ) : (
              transactions.filter(t => t.category === "Freelancer/Dış Hizmet").map(t => (
                <div key={t.id} className="p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl flex justify-between items-center text-xxs font-semibold">
                  <div>
                    <span className="text-slate-200 font-extrabold">{t.note}</span>
                    <span className="text-[9px] text-slate-500 bg-slate-900 border border-slate-800/60 px-1.5 py-0.5 rounded ml-2">Kaşe</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-rose-400 font-extrabold">{formatCurrency(t.amount)}</span>
                    <button 
                      type="button"
                      onClick={() => handleDeleteFreelancerExpense(t.id)} 
                      className="text-slate-500 hover:text-rose-500 transition-all duration-300 ease-[0.16,1,0.3,1] cursor-pointer"
                    >
                      <Trash2 size={12} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* İkili Bölüm - Sol Taraf Görevler, Sağ Taraf Revizyonlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* YAPILACAKLAR LİSTESİ (CHECKLIST) */}
          <div className="glass-card" style={{ padding: "1.25rem" }}>
            <h4 className="font-bold text-slate-200 mb-3 flex gap-2 items-center border-b border-slate-800/40 pb-2">
              <CheckSquare size={14} strokeWidth={1.5} className="text-blue-500" />
              Görev Kontrol Listesi
            </h4>

            {/* Yeni Görev Formu */}
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Yeni görev yaz..."
                className="form-control text-xs flex-1"
                style={{ padding: "0.625rem 0.875rem" }}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 0.75rem" }} title="Görev Ekle">
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </form>

            {loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2].map(i => <div key={i} className="skeleton h-8 w-full"></div>)}
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-xxs text-slate-500 text-center py-4">Kayıtlı görev bulunmuyor.</p>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-52 overflow-y-auto pr-1">
                {tasks.map(t => (
                  <div key={t.id} className="flex flex-col gap-2 p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                    <div className="flex items-center justify-between">
                      <label className={`flex items-center gap-2 cursor-pointer select-none font-semibold ${t.sutun_durumu === "Tamamlandı" ? "line-through text-slate-500" : "text-slate-300"}`}>
                        <input
                          type="checkbox"
                          checked={t.sutun_durumu === "Tamamlandı"}
                          onChange={() => handleToggleTask(t.id, t.sutun_durumu)}
                          className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-800/60 accent-blue-500 cursor-pointer"
                        />
                        <span>{t.gorev_adi}</span>
                      </label>
                      <button onClick={() => handleDeleteTask(t.id)} className="btn-icon p-1 text-slate-500 hover:text-red-400 transition-all duration-300">
                        <Trash2 size={12} strokeWidth={1.5} />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center gap-2 text-[9px] text-slate-500 font-semibold border-t border-slate-800/20 pt-1.5 mt-0.5">
                      <div className="flex gap-2">
                        <span className="bg-slate-900 border border-slate-850/50 px-1.5 py-0.5 rounded text-[8px]">
                          {t.kategori}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {t.planlanan_tarih}
                        </span>
                      </div>
                      
                      <select
                        value={t.sutun_durumu}
                        onChange={async (e) => {
                          const val = e.target.value;
                          await updateGorev(t.id, { sutun_durumu: val as any });
                          setTasks(prev => prev.map(item => item.id === t.id ? { ...item, sutun_durumu: val as any } : item));
                        }}
                        className="bg-slate-900 border border-slate-800/60 text-[9px] rounded px-1.5 py-0.5 text-slate-400 focus:outline-none cursor-pointer"
                      >
                        <option value="Yapılmayı Bekleyenler">Yapılmayı Bekleyenler</option>
                        <option value="Yapılacaklar">Yapılacaklar</option>
                        <option value="Yapılıyor">Yapılıyor</option>
                        <option value="Test">Test</option>
                        <option value="Tamamlandı">Tamamlandı</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* REVİZYON SİSTEMİ */}
          <div className="glass-card" style={{ padding: "1.25rem" }}>
            <h4 className="font-bold text-slate-200 mb-3 flex gap-2 items-center border-b border-slate-800/40 pb-2">
              <Play size={14} strokeWidth={1.5} className="text-purple-500" />
              Müşteri Revizyon Notları
            </h4>

            {/* Yeni Revizyon Formu */}
            <form onSubmit={handleAddRevision} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Müşteriden gelen revizeyi yaz..."
                className="form-control text-xs flex-1"
                style={{ padding: "0.625rem 0.875rem" }}
                value={newRevisionNote}
                onChange={(e) => setNewRevisionNote(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary bg-purple-600 hover:bg-purple-700" style={{ padding: "0.5rem 0.75rem" }} title="Revize Ekle">
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </form>

            {loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2].map(i => <div key={i} className="skeleton h-8 w-full"></div>)}
              </div>
            ) : revisions.length === 0 ? (
              <p className="text-xxs text-slate-500 text-center py-4">Kayıtlı revizyon talebi yok.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                {revisions.map(r => (
                  <div key={r.id} className="p-2 bg-purple-500/5 border border-purple-500/10 rounded-lg flex items-start justify-between">
                    <p className="leading-relaxed font-semibold text-slate-300 pr-2">{r.note}</p>
                    <button onClick={() => handleDeleteRevision(r.id)} className="btn-icon p-1 text-slate-500 hover:text-red-450 transition-all duration-300 ease-[0.16,1,0.3,1] shrink-0">
                      <Trash2 size={12} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </dialog>
  );
}
