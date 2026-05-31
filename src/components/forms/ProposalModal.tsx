"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, UserPlus } from "lucide-react";
import { Client, Proposal } from "../../types";

const PROPOSAL_STATUSES = [
  "Teklif Hazırlanıyor", "Teklif Gönderildi", "Onay Bekliyor", "Onaylandı", "Reddedildi"
];

const PROJECT_TYPES = [
  "Video Prodüksiyon", "Video Çekim", "Video Kurgu", "Sosyal Medya Yönetimi"
];

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  proposal: Proposal | null;
  clients: Client[];
  onQuickAddClient: () => void;
}

export default function ProposalModal({ isOpen, onClose, onSave, proposal, clients, onQuickAddClient }: ProposalModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    project_idea: "",
    client_id: "",
    status: "Teklif Hazırlanıyor",
    project_type: "Video Kurgu",
    proposal_amount: 0,
    contact_date: ""
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
    if (proposal) {
      const hasKdvSiz = proposal.project_idea?.includes("[KDV_SIZ]") || false;
      const hasVergiSiz = proposal.project_idea?.includes("[VERGI_SIZ]") || false;
      const cleanIdea = (proposal.project_idea || "")
        .replace(/\[KDV_SIZ\]/g, "")
        .replace(/\[VERGI_SIZ\]/g, "")
        .trim();

      setFormData({
        title: proposal.title || "",
        project_idea: cleanIdea,
        client_id: proposal.client_id || "",
        status: proposal.status || "Teklif Hazırlanıyor",
        project_type: proposal.project_type || "Video Kurgu",
        proposal_amount: Number(proposal.proposal_amount || 0),
        contact_date: proposal.contact_date || ""
      });
      setExcludeKdv(hasKdvSiz);
      setExcludeTax(hasVergiSiz);
    } else {
      const today = new Date().toISOString().split("T")[0];
      setFormData({
        title: "",
        project_idea: "",
        client_id: clients.length > 0 ? clients[0].id : "",
        status: "Teklif Hazırlanıyor",
        project_type: "Video Kurgu",
        proposal_amount: 0,
        contact_date: today
      });
      setExcludeKdv(false);
      setExcludeTax(false);
    }
  }, [proposal, isOpen, clients]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("Lütfen teklif başlığını giriniz.");
    if (!formData.client_id) return alert("Lütfen bir müşteri seçiniz.");
    if (!formData.contact_date) return alert("Lütfen iletişim tarihini giriniz.");

    let finalIdea = formData.project_idea || "";
    if (excludeKdv) finalIdea += " [KDV_SIZ]";
    if (excludeTax) finalIdea += " [VERGI_SIZ]";

    onSave({
      ...formData,
      project_idea: finalIdea.trim(),
      id: proposal?.id
    });
  };

  return (
    <dialog ref={dialogRef} className="modal modal-large" onClose={onClose}>
      {/* Modal Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/40">
        <div>
          <h3 className="text-lg font-black text-slate-100">{proposal ? "Teklifi Düzenle" : "Yeni Teklif Ekle"}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Potansiyel iş tekliflerinizi ve CRM süreçlerinizi yönetin</p>
        </div>
        <button className="btn-icon p-2 hover:bg-slate-800/60 rounded-xl transition-all duration-300 ease-[0.16,1,0.3,1]" onClick={onClose}>
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col pr-1 max-h-[70vh] overflow-y-auto scrollbar-thin">
        
        {/* BÖLÜM 1: GENEL BİLGİLER */}
        <div className="form-section-title">Bölüm 1: Genel Bilgiler</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          {/* Teklif Başlığı */}
          <div className="form-group col-span-1 sm:col-span-2">
            <label className="form-label">Teklif / Proje Başlığı</label>
            <input
              type="text"
              name="title"
              className="form-control"
              value={formData.title}
              onChange={handleChange}
              placeholder="Örn: X Firması Yıllık Sosyal Medya Teklifi"
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

          {/* Proje Fikri / Brief */}
          <div className="form-group col-span-1 sm:col-span-2">
            <label className="form-label">Proje Fikri / Müşteri Briefi</label>
            <textarea
              name="project_idea"
              className="form-control"
              value={formData.project_idea}
              onChange={handleChange}
              placeholder="Nasıl bir proje istediler? Brief detayları, beklentiler ve notlar..."
              rows={4}
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
              {PROJECT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* İletişim Tarihi */}
          <div className="form-group">
            <label className="form-label">İlk İletişim / Görüşme Tarihi</label>
            <input
              type="date"
              name="contact_date"
              className="form-control"
              value={formData.contact_date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Teklif Tutarı */}
          <div className="form-group">
            <label className="form-label">Teklif Tutarı (₺)</label>
            <input
              type="number"
              name="proposal_amount"
              className="form-control"
              value={formData.proposal_amount || ""}
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
            {Number(formData.proposal_amount || 0) > 0 && (
              <div className="mt-2 p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl flex flex-col gap-1 text-[10px] font-medium text-slate-400">
                <div className="flex justify-between">
                  <span>Net Tutar:</span>
                  <span className="text-slate-200">{Number(formData.proposal_amount).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-amber-500 font-semibold">
                  <span>KDV (%20):</span>
                  <span>{excludeKdv ? "0 ₺ (Muaf)" : (Number(formData.proposal_amount) * 0.2).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}</span>
                </div>
                <div className="h-[1px] bg-slate-800/60 my-0.5"></div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Toplam (KDV Dahil):</span>
                  <span>{excludeKdv ? Number(formData.proposal_amount).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }) : (Number(formData.proposal_amount) * 1.2).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            )}
          </div>

          {/* Teklif Durumu */}
          <div className="form-group">
            <label className="form-label">Durum / CRM Aşaması</label>
            <select
              name="status"
              className="form-control"
              value={formData.status}
              onChange={handleChange}
            >
              {PROPOSAL_STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Eylem Butonları */}
        <div className="flex gap-4 justify-end mt-8 pt-4 border-t border-slate-800/60">
          <button type="button" className="btn btn-secondary font-bold" onClick={onClose}>
            İptal
          </button>
          <button type="submit" className="btn btn-primary bg-blue-600 hover:bg-blue-700 font-bold px-6">
            {proposal ? "Değişiklikleri Kaydet" : "Teklif Ekle"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
