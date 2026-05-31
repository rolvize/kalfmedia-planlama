"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, UserPlus, Info } from "lucide-react";
import { Client, Project } from "../../types";

const STAGES = [
  "Yeni Talep", "Görüşme", "Teklif Gönderildi", "Onaylandı",
  "Çekim Planlandı", "Çekim Yapıldı", "Kurgu Süreci", "Revize",
  "Teslim Edildi", "Ödeme Bekliyor", "Tamamlandı"
];

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  project: Project | null;
  clients: Client[];
  onQuickAddClient: () => void;
}

export default function ProjectModal({ isOpen, onClose, onSave, project, clients, onQuickAddClient }: ProjectModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    client_id: "",
    status: "Yeni Talep",
    project_type: "Video Kurgu",
    priority: "Orta",
    price: 0,
    expense: 0,
    start_date: "",
    due_date: "",
    drive_link: "",
    frameio_link: "",
    moodboard_link: "",
    completed: false,
    backup_disk: "",
    revision_count: 0
  });

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

  const [excludeKdv, setExcludeKdv] = useState(false);
  const [excludeTax, setExcludeTax] = useState(false);

  useEffect(() => {
    if (project) {
      const hasKdvSiz = project.description?.includes("[KDV_SIZ]") || false;
      const hasVergiSiz = project.description?.includes("[VERGI_SIZ]") || false;
      const cleanDesc = (project.description || "")
        .replace(/\[KDV_SIZ\]/g, "")
        .replace(/\[VERGI_SIZ\]/g, "")
        .trim();

      setFormData({
        title: project.title || "",
        description: cleanDesc,
        client_id: project.client_id || "",
        status: project.status || "Yeni Talep",
        project_type: project.project_type || "Video Kurgu",
        priority: project.priority || "Orta",
        price: Number(project.price || 0),
        expense: Number(project.expense || 0),
        start_date: project.start_date || "",
        due_date: project.due_date || "",
        drive_link: project.drive_link || "",
        frameio_link: project.frameio_link || "",
        moodboard_link: project.moodboard_link || "",
        completed: !!project.completed,
        backup_disk: project.backup_disk || "",
        revision_count: Number(project.revision_count || 0)
      });
      setExcludeKdv(hasKdvSiz);
      setExcludeTax(hasVergiSiz);
    } else {
      const today = new Date().toISOString().split("T")[0];
      setFormData({
        title: "",
        description: "",
        client_id: clients.length > 0 ? clients[0].id : "",
        status: "Yeni Talep",
        project_type: "Video Kurgu",
        priority: "Orta",
        price: 0,
        expense: 0,
        start_date: today,
        due_date: "",
        drive_link: "",
        frameio_link: "",
        moodboard_link: "",
        completed: false,
        backup_disk: "",
        revision_count: 0
      });
      setExcludeKdv(false);
      setExcludeTax(false);
    }
  }, [project, isOpen, clients]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : (type === "number" ? Number(value) : value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("Lütfen proje başlığını giriniz.");
    if (!formData.client_id) return alert("Lütfen bir müşteri seçiniz.");
    if (!formData.due_date) return alert("Lütfen son teslim tarihini giriniz.");

    let finalDesc = formData.description || "";
    if (excludeKdv) finalDesc += " [KDV_SIZ]";
    if (excludeTax) finalDesc += " [VERGI_SIZ]";

    onSave({
      ...formData,
      description: finalDesc.trim(),
      id: project?.id
    });
  };

  const netProfit = Number(formData.price || 0) - Number(formData.expense || 0);

  return (
    <dialog ref={dialogRef} className="modal modal-large" onClose={onClose}>
      {/* Modal Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/40">
        <div>
          <h3 className="text-lg font-black text-slate-100">{project ? "İşi Düzenle" : "Yeni İş / Proje Ekle"}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Lütfen iş bilgilerini eksiksiz doldurun</p>
        </div>
        <button className="btn-icon p-2 hover:bg-slate-800/60 rounded-xl transition-all duration-300 ease-[0.16,1,0.3,1]" onClick={onClose}>
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col pr-1 max-h-[70vh] overflow-y-auto scrollbar-thin">
        
        {/* BÖLÜM 1: GENEL BİLGİLER */}
        <div className="form-section-title">Bölüm 1: Genel Bilgiler</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          {/* Proje Başlığı */}
          <div className="form-group col-span-1 sm:col-span-2">
            <label className="form-label">Proje Başlığı</label>
            <input
              type="text"
              name="title"
              className="form-control"
              value={formData.title}
              onChange={handleChange}
              placeholder="Örn: X Markası YouTube Kurgu Projesi"
              required
            />
          </div>

          {/* Müşteri Seçimi */}
          <div className="form-group col-span-1 sm:col-span-2">
            <div className="flex justify-between items-center">
              <label className="form-label">Müşteri / Firma</label>
              <button
                type="button"
                className="text-[10px] text-emerald-400 font-bold flex gap-1 items-center hover:text-emerald-300 transition-all duration-300 ease-[0.16,1,0.3,1] cursor-pointer"
                onClick={onQuickAddClient}
              >
                <UserPlus size={12} strokeWidth={1.5} /> Hızlı Müşteri Ekle
              </button>
            </div>
            <select
              name="client_id"
              className="form-control"
              value={formData.client_id}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Müşteri Seçiniz</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.company ? `${c.company} (${c.name})` : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Açıklama */}
          <div className="form-group col-span-1 sm:col-span-2">
            <label className="form-label">Açıklama / Yönergeler</label>
            <textarea
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              placeholder="Kurgu detayları, referans video notları ve revizyon hedefleri..."
            />
          </div>
        </div>

        <hr className="form-divider" />

        {/* BÖLÜM 2: SÜREÇ VE FİNANS */}
        <div className="form-section-title">Bölüm 2: Süreç ve Finans</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          {/* İş Tipi */}
          <div className="form-group">
            <label className="form-label">İş Tipi</label>
            <select
              name="project_type"
              className="form-control"
              value={formData.project_type}
              onChange={handleChange}
            >
              <option value="Video Prodüksiyon">Video Prodüksiyon</option>
              <option value="Video Çekim">Video Çekim</option>
              <option value="Video Kurgu">Video Kurgu</option>
              <option value="Sosyal Medya Yönetimi">Sosyal Medya Yönetimi</option>
            </select>
          </div>

          {/* Öncelik */}
          <div className="form-group">
            <label className="form-label">Öncelik Seviyesi</label>
            <select
              name="priority"
              className="form-control"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="Düşük">Düşük</option>
              <option value="Orta">Orta</option>
              <option value="Yüksek">Yüksek</option>
            </select>
          </div>

          {/* Başlangıç Tarihi */}
          <div className="form-group">
            <label className="form-label">Başlangıç Tarihi</label>
            <input
              type="date"
              name="start_date"
              className="form-control"
              value={formData.start_date}
              onChange={handleChange}
            />
          </div>

          {/* Teslim Tarihi */}
          <div className="form-group">
            <label className="form-label">Son Teslim Tarihi</label>
            <input
              type="date"
              name="due_date"
              className="form-control"
              value={formData.due_date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Proje Ücreti */}
          <div className="form-group">
            <label className="form-label">Proje Bütçesi / Ücreti (₺)</label>
            <input
              type="number"
              name="price"
              className="form-control"
              value={formData.price || ""}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
            {/* Vergi Seçenekleri */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <label className="text-[10px] text-slate-400 flex items-center gap-1.5 cursor-pointer select-none font-semibold">
                <input
                  type="checkbox"
                  checked={excludeKdv}
                  onChange={(e) => setExcludeKdv(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 accent-blue-500 cursor-pointer"
                />
                KDV'siz (Muaf)
              </label>
              <label className="text-[10px] text-slate-400 flex items-center gap-1.5 cursor-pointer select-none font-semibold">
                <input
                  type="checkbox"
                  checked={excludeTax}
                  onChange={(e) => setExcludeTax(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 accent-blue-500 cursor-pointer"
                />
                Gelir Vergisiz
              </label>
            </div>
            {Number(formData.price || 0) > 0 && (
              <div className="mt-2 p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl flex flex-col gap-1 text-[10px] font-medium text-slate-400">
                <div className="flex justify-between">
                  <span>Net Tutar:</span>
                  <span className="text-slate-200">{Number(formData.price).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-amber-500 font-semibold">
                  <span>KDV (%20):</span>
                  <span>{excludeKdv ? "0 ₺ (Muaf)" : (Number(formData.price) * 0.2).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}</span>
                </div>
                <div className="h-[1px] bg-slate-800/60 my-0.5"></div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Toplam (KDV Dahil):</span>
                  <span>{excludeKdv ? Number(formData.price).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }) : (Number(formData.price) * 1.2).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            )}
          </div>

          {/* Masraf */}
          <div className="form-group">
            <label className="form-label">Öngörülen Gider / Masraf (₺)</label>
            <input
              type="number"
              name="expense"
              className="form-control"
              value={formData.expense || ""}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
          </div>

          {/* Pipeline Aşaması */}
          <div className="form-group">
            <label className="form-label">Pipeline Aşaması</label>
            <select
              name="status"
              className="form-control"
              value={formData.status}
              onChange={handleChange}
            >
              {STAGES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Tamamlanma Durumu & Kâr Hesabı */}
          <div className="form-group">
            <label className="form-label">Tahmini Net Kâr (Bütçe - Gider)</label>
            <div className="form-control bg-slate-950 border-slate-800/60 text-emerald-400 font-bold flex justify-between items-center">
              <span>{netProfit.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}</span>
              
              <label className="text-[10px] text-slate-400 flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="completed"
                  checked={formData.completed}
                  onChange={(e) => setFormData(prev => ({ ...prev, completed: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded border-slate-800/60 bg-slate-900 accent-blue-500 cursor-pointer"
                />
                Tamamlandı
              </label>
            </div>
          </div>
        </div>

        <hr className="form-divider" />

        {/* BÖLÜM 3: MEDYA LİNKLERİ */}
        <div className="form-section-title">Bölüm 3: Medya Linkleri</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Google Drive */}
          <div className="form-group col-span-1">
            <label className="form-label">Google Drive Linki</label>
            <input
              type="url"
              name="drive_link"
              className="form-control"
              value={formData.drive_link}
              onChange={handleChange}
              placeholder="https://drive.google.com/..."
            />
          </div>

          {/* Frame.io */}
          <div className="form-group col-span-1">
            <label className="form-label">Frame.io Linki</label>
            <input
              type="url"
              name="frameio_link"
              className="form-control"
              value={formData.frameio_link}
              onChange={handleChange}
              placeholder="https://frame.io/..."
            />
          </div>

          {/* Moodboard */}
          <div className="form-group col-span-1">
            <label className="form-label">Moodboard / Miro</label>
            <input
              type="url"
              name="moodboard_link"
              className="form-control"
              value={formData.moodboard_link}
              onChange={handleChange}
              placeholder="https://miro.com/..."
            />
          </div>
        </div>

        <hr className="form-divider" />

        {/* BÖLÜM 4: ARŞİV VE REVİZYON TAKİBİ */}
        <div className="form-section-title">Bölüm 4: Arşiv ve Revizyon Takibi</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Arşiv Diski */}
          <div className="form-group">
            <label className="form-label">Yedeklenen Hard Disk (Arşiv)</label>
            <input
              type="text"
              name="backup_disk"
              className="form-control"
              value={formData.backup_disk}
              onChange={handleChange}
              placeholder="Örn: HDD-03, LTO-02..."
            />
          </div>

          {/* Revizyon Sayısı */}
          <div className="form-group">
            <label className="form-label">Resmi Revizyon Sayısı</label>
            <input
              type="number"
              name="revision_count"
              className="form-control"
              value={formData.revision_count}
              onChange={handleChange}
              min="0"
              placeholder="0"
            />
          </div>
        </div>

        {/* Modal Eylem Butonları */}
        <div className="flex gap-4 justify-end mt-8 pt-4 border-t border-slate-800/60">
          <button type="button" className="btn btn-secondary font-bold" onClick={onClose}>
            İptal
          </button>
          <button type="submit" className="btn btn-primary bg-blue-600 hover:bg-blue-700 font-bold px-6">
            {project ? "Değişiklikleri Kaydet" : "Proje Oluştur"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
