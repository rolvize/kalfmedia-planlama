"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, CheckSquare, MessageSquare, Plus, Trash2, Calendar, Award } from "lucide-react";
import { Gorev, Project, GorevChecklistItem, GorevComment } from "../../types";

interface GorevModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  gorev: Gorev | null;
  projects: Project[];
  defaultColumn?: string;
}

export default function GorevModal({ isOpen, onClose, onSave, gorev, projects, defaultColumn }: GorevModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [formData, setFormData] = useState({
    gorev_adi: "",
    detay: "",
    kategori: "Prodüksiyon",
    sutun_durumu: "Yapılmayı Bekleyenler",
    planlanan_tarih: "",
    oncelik: "Orta",
    proje_id: ""
  });

  // Checklist & Comments States
  const [checklist, setChecklist] = useState<GorevChecklistItem[]>([]);
  const [newChecklistItemTitle, setNewChecklistItemTitle] = useState("");

  const [comments, setComments] = useState<GorevComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");

  useEffect(() => {
    if (!dialogRef.current) return;
    if (isOpen) {
      if (!dialogRef.current.open) {
        dialogRef.current.showModal();
      }
    } else {
      if (dialogRef.current.open) {
        dialogRef.current.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (gorev) {
      setFormData({
        gorev_adi: gorev.gorev_adi || "",
        detay: gorev.detay || "",
        kategori: gorev.kategori || "Prodüksiyon",
        sutun_durumu: gorev.sutun_durumu || "Yapılmayı Bekleyenler",
        planlanan_tarih: gorev.planlanan_tarih || today,
        oncelik: gorev.oncelik || "Orta",
        proje_id: gorev.proje_id || ""
      });
      setChecklist(gorev.checklist || []);
      setComments(gorev.comments || []);
    } else {
      setFormData({
        gorev_adi: "",
        detay: "",
        kategori: "Prodüksiyon",
        sutun_durumu: defaultColumn || "Yapılmayı Bekleyenler",
        planlanan_tarih: today,
        oncelik: "Orta",
        proje_id: ""
      });
      setChecklist([]);
      setComments([]);
    }
    setNewChecklistItemTitle("");
    setNewCommentText("");
  }, [gorev, isOpen, defaultColumn]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Checklist Actions
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItemTitle.trim()) return;
    const newItem: GorevChecklistItem = {
      id: `chk-${Date.now()}`,
      title: newChecklistItemTitle.trim(),
      completed: false
    };
    setChecklist(prev => [...prev, newItem]);
    setNewChecklistItemTitle("");
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleDeleteChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  // Comment Actions
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newComment: GorevComment = {
      id: `c-${Date.now()}`,
      user_name: "Yunus Emre Türkoğlu", // Default active username in user screenshot
      text: newCommentText.trim(),
      created_at: new Date().toISOString()
    };
    setComments(prev => [...prev, newComment]);
    setNewCommentText("");
  };

  const handleDeleteComment = (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gorev_adi.trim()) return alert("Lütfen görev adını giriniz.");
    if (!formData.planlanan_tarih) return alert("Lütfen planlanan tarihi seçiniz.");

    onSave({
      ...formData,
      proje_id: formData.proje_id || null,
      checklist,
      comments,
      id: gorev?.id
    });
  };

  // Checklist progress calculations
  const totalChecklistItems = checklist.length;
  const completedChecklistItems = checklist.filter(item => item.completed).length;
  const progressPercent = totalChecklistItems > 0 ? Math.round((completedChecklistItems / totalChecklistItems) * 100) : 0;

  return (
    <dialog ref={dialogRef} className="modal modal-large" onClose={onClose}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/40">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Award size={18} className="text-blue-500" />
          {gorev ? "Görevi Düzenle" : "Yeni Görev Ekle"}
        </h3>
        <button 
          className="btn-icon p-2 hover:bg-slate-800/60 rounded-xl transition-all duration-300 ease-[0.16,1,0.3,1]" 
          onClick={onClose}
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex flex-col gap-6 max-h-[82vh] overflow-y-auto pr-1 scrollbar-thin">
        {/* Core Form Fields */}
        <form id="gorev-form" onSubmit={handleSubmit} className="flex flex-col gap-4 border-b border-slate-800/40 pb-5">
          {/* Görev Adı */}
          <div className="form-group mb-4">
            <label className="form-label">Görev Adı</label>
            <input
              type="text"
              name="gorev_adi"
              className="form-control"
              value={formData.gorev_adi}
              onChange={handleChange}
              placeholder="Örn: Storyboard çizimini tamamla"
              required
            />
          </div>

          {/* Açıklama */}
          <div className="form-group mb-4">
            <label className="form-label">Açıklama / Notlar</label>
            <textarea
              name="detay"
              className="form-control h-20 resize-none text-xs leading-relaxed"
              value={formData.detay}
              onChange={handleChange}
              placeholder="Görevin detayları, linkler veya notlar..."
            />
          </div>

          {/* Kategori & Öncelik */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="form-group mb-0">
              <label className="form-label">Kategori</label>
              <select
                name="kategori"
                className="form-control text-xs"
                value={formData.kategori}
                onChange={handleChange}
              >
                <option value="Prodüksiyon">Prodüksiyon</option>
                <option value="Sosyal Medya">Sosyal Medya</option>
                <option value="Vize">Vize</option>
                <option value="Kişisel / Rutin">Kişisel / Rutin</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Öncelik</label>
              <select
                name="oncelik"
                className="form-control text-xs"
                value={formData.oncelik}
                onChange={handleChange}
              >
                <option value="Düşük">Düşük</option>
                <option value="Orta">Orta</option>
                <option value="Yüksek">Yüksek</option>
              </select>
            </div>
          </div>

          {/* Durum & Tarih */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="form-group mb-0">
              <label className="form-label">Pano Sütunu</label>
              <select
                name="sutun_durumu"
                className="form-control text-xs"
                value={formData.sutun_durumu}
                onChange={handleChange}
              >
                <option value="Yapılmayı Bekleyenler">Yapılmayı Bekleyenler</option>
                <option value="Yapılacaklar">Yapılacaklar</option>
                <option value="Yapılıyor">Yapılıyor</option>
                <option value="Test">Test</option>
                <option value="Tamamlandı">Tamamlandı</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Planlanan Tarih</label>
              <input
                type="date"
                name="planlanan_tarih"
                className="form-control text-xs"
                value={formData.planlanan_tarih}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* İlişkili Proje */}
          <div className="form-group mb-4">
            <label className="form-label">İlişkili Proje (Opsiyonel)</label>
            <select
              name="proje_id"
              className="form-control text-xs"
              value={formData.proje_id}
              onChange={handleChange}
            >
              <option value="">Bağımsız Gündelik Görev</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

        </form>

        {/* CHECKLIST SECTION */}
        <div className="flex flex-col gap-3 border-b border-slate-800/40 pb-5">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-xs text-slate-200 flex items-center gap-2">
              <CheckSquare size={14} className="text-blue-500" />
              Kontrol Listesi
            </h4>
            {totalChecklistItems > 0 && (
              <span className="text-[10px] text-slate-400 font-bold bg-slate-900 border border-slate-800/60 px-2 py-0.5 rounded-md">
                {completedChecklistItems}/{totalChecklistItems} (%{progressPercent})
              </span>
            )}
          </div>

          {/* Checklist Progress Bar */}
          {totalChecklistItems > 0 && (
            <div className="w-full h-1.5 bg-slate-950/60 rounded-full overflow-hidden border border-slate-800/20">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          )}

          {/* Checklist Items list */}
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {checklist.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic py-2">Henüz kontrol listesi öğesi eklenmemiş.</p>
            ) : (
              checklist.map(item => (
                <div key={item.id} className="flex justify-between items-center p-2.5 bg-slate-950/40 border border-slate-850/50 rounded-xl group/chk">
                  <label className={`flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none ${item.completed ? "line-through text-slate-500" : "text-slate-300"}`}>
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklistItem(item.id)}
                      className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-850 accent-blue-500 cursor-pointer"
                    />
                    <span>{item.title}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeleteChecklistItem(item.id)}
                    className="opacity-0 group-hover/chk:opacity-100 p-0.5 text-slate-500 hover:text-red-400 rounded transition-all duration-200 cursor-pointer"
                  >
                    <Trash2 size={12} strokeWidth={1.5} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Checklist Item input */}
          <form onSubmit={handleAddChecklistItem} className="flex gap-2">
            <input
              type="text"
              placeholder="Yeni kontrol listesi öğesi..."
              className="form-control text-xs flex-1"
              style={{ padding: "0.5rem 0.75rem" }}
              value={newChecklistItemTitle}
              onChange={(e) => setNewChecklistItemTitle(e.target.value)}
            />
            <button 
              type="submit" 
              className="btn btn-secondary text-xs" 
              style={{ padding: "0.5rem 0.75rem" }}
            >
              Ekle
            </button>
          </form>
        </div>

        {/* COMMENTS ACTIVITY SECTION */}
        <div className="flex flex-col gap-3 pb-6">
          <h4 className="font-bold text-xs text-slate-200 flex items-center gap-2">
            <MessageSquare size={14} className="text-blue-500" />
            Yorumlar ve Etkinlik
          </h4>

          {/* New comment form */}
          <form onSubmit={handleAddComment} className="flex flex-col gap-2">
            <textarea
              placeholder="Yorum yaz..."
              className="form-control text-xs h-16 resize-none leading-relaxed"
              style={{ padding: "0.5rem 0.75rem" }}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
            />
            <div className="flex justify-end">
              <button 
                type="submit" 
                className="btn btn-secondary text-xs" 
                style={{ padding: "0.4rem 0.75rem" }}
              >
                Yorum Ekle
              </button>
            </div>
          </form>

          {/* Comments list timeline */}
          <div className="flex flex-col gap-3 mt-2">
            {comments.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic py-2">Kayıtlı yorum bulunmuyor.</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex items-start gap-2.5 p-3.5 bg-slate-900/60 border border-slate-800/40 rounded-2xl relative group/comm">
                  {/* User Profile circle indicator */}
                  <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25 flex items-center justify-center font-bold text-xxs shrink-0 mt-0.5">
                    {c.user_name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-200">{c.user_name}</span>
                      <span className="text-[8px] text-slate-500 font-semibold">
                        {c.created_at.includes("T") ? c.created_at.split("T")[0] + " " + c.created_at.split("T")[1].slice(0, 5) : c.created_at}
                      </span>
                    </div>
                    <p className="text-xxs leading-relaxed text-slate-400 font-semibold whitespace-pre-line">
                      {c.text}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteComment(c.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover/comm:opacity-100 p-0.5 text-slate-500 hover:text-red-400 rounded transition-all duration-200 cursor-pointer"
                    title="Yorumu Sil"
                  >
                    <Trash2 size={11} strokeWidth={1.5} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Footer / Kaydet Butonu */}
      <div className="flex gap-3 justify-end pt-4 border-t border-slate-800/40 mt-4">
        <button type="button" className="btn btn-secondary text-xs" onClick={onClose}>
          Kapat
        </button>
        <button type="submit" form="gorev-form" className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-xs">
          Görev Değişikliklerini Kaydet
        </button>
      </div>
    </dialog>
  );
}
