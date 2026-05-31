"use client";

import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Project } from "../../types";

const CATEGORIES = {
  Gelir: ["Video Prodüksiyon", "Video Çekim", "Video Kurgu", "Sosyal Medya Yönetimi", "Ek Gelir", "Diğer"],
  Gider: ["Ekipman Kiralama/Satın Alma", "Ulaşım & Yol", "Freelancer/Dış Hizmet", "Yemek & İkram", "Reklam & Pazarlama", "Yazılım Abonelikleri (Adobe/Frame.io vb.)", "Diğer"]
};

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  projects: Project[];
}

export default function TransactionModal({ isOpen, onClose, onSave, projects }: TransactionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [formData, setFormData] = useState({
    project_id: "",
    type: "Gider",
    category: "Yemek",
    amount: "",
    note: ""
  });

  const [excludeKdv, setExcludeKdv] = useState(false);
  const [excludeTax, setExcludeTax] = useState(false);

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
    if (isOpen) {
      setFormData({
        project_id: "",
        type: "Gider",
        category: CATEGORIES.Gider[0],
        amount: "",
        note: ""
      });
      setExcludeKdv(false);
      setExcludeTax(false);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Tür değiştiğinde kategori listesini güncelle
      if (name === "type") {
        updated.category = CATEGORIES[value as "Gelir" | "Gider"][0];
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      return alert("Lütfen geçerli bir işlem tutarı giriniz.");
    }

    let finalNote = formData.note || "";
    if (excludeKdv) finalNote += " [KDV_SIZ]";
    if (excludeTax) finalNote += " [VERGI_SIZ]";

    onSave({
      ...formData,
      note: finalNote.trim(),
      amount: Number(formData.amount),
      project_id: formData.project_id || null
    });
  };

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/40">
        <h3 className="text-base font-bold text-slate-100">Finansal Hareket Ekle</h3>
        <button className="btn-icon p-2 hover:bg-slate-800/60 rounded-xl transition-all duration-300 ease-[0.16,1,0.3,1]" onClick={onClose}>
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Tür Seçimi */}
        <div className="form-group">
          <label className="form-label">İşlem Türü</label>
          <div className="grid grid-cols-2 gap-4">
            <label className={`form-control border py-2 flex justify-center items-center cursor-pointer rounded-xl transition-all ${
              formData.type === "Gelir" ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400 font-bold" : "border-slate-800/60 bg-slate-900/60"
            }`}>
              <input
                type="radio"
                name="type"
                value="Gelir"
                checked={formData.type === "Gelir"}
                onChange={handleChange}
                className="hidden"
              />
              Gelir
            </label>
            <label className={`form-control border py-2 flex justify-center items-center cursor-pointer rounded-xl transition-all ${
              formData.type === "Gider" ? "bg-red-500/10 border-red-500/30 text-red-400 font-bold" : "border-slate-800/60 bg-slate-900/60"
            }`}>
              <input
                type="radio"
                name="type"
                value="Gider"
                checked={formData.type === "Gider"}
                onChange={handleChange}
                className="hidden"
              />
              Gider
            </label>
          </div>
        </div>

        {/* İlişkili Proje */}
        <div className="form-group">
          <label className="form-label">İlişkili İş / Proje (İsteğe Bağlı)</label>
          <select
            name="project_id"
            className="form-control"
            value={formData.project_id}
            onChange={handleChange}
          >
            <option value="">Genel (Herhangi bir işe bağlı değil)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title} ({p.id.slice(0, 8)})</option>
            ))}
          </select>
        </div>

        {/* Kategori */}
        <div className="form-group">
          <label className="form-label">Kategori</label>
          <select
            name="category"
            className="form-control"
            value={formData.category}
            onChange={handleChange}
          >
            {CATEGORIES[formData.type as "Gelir" | "Gider"].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Tutar */}
        <div className="form-group">
          <label className="form-label">Tutar (₺)</label>
          <input
            type="number"
            name="amount"
            className="form-control"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            required
          />
        </div>

        {/* Vergi Durumu */}
        <div className="form-group">
          <label className="form-label">Vergi Durumu</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer select-none font-semibold p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl hover:bg-slate-900/40 transition-all">
              <input
                type="checkbox"
                checked={excludeKdv}
                onChange={(e) => setExcludeKdv(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 accent-blue-500 cursor-pointer"
              />
              KDV'den Muaf (KDV'siz)
            </label>
            <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer select-none font-semibold p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl hover:bg-slate-900/40 transition-all">
              <input
                type="checkbox"
                checked={excludeTax}
                onChange={(e) => setExcludeTax(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 accent-blue-500 cursor-pointer"
              />
              Gelir Vergisiz
            </label>
          </div>
        </div>

        {/* Açıklama */}
        <div className="form-group">
          <label className="form-label">Açıklama / Not</label>
          <input
            type="text"
            name="note"
            className="form-control"
            value={formData.note}
            onChange={handleChange}
            placeholder="Fatura No, Detaylar..."
          />
        </div>

        <div className="flex gap-4 justify-end mt-4 pt-4 border-t border-slate-800/60">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            İptal
          </button>
          <button type="submit" className="btn btn-primary bg-blue-600 hover:bg-blue-700">
            Hareketi Kaydet
          </button>
        </div>
      </form>
    </dialog>
  );
}
