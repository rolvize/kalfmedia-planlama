"use client";

import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Client } from "../../types";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  client: Client | null;
}

export default function ClientModal({ isOpen, onClose, onSave, client }: ClientModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    instagram: "",
    company: "",
    notes: ""
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

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        phone: client.phone || "",
        email: client.email || "",
        instagram: client.instagram || "",
        company: client.company || "",
        notes: client.notes || ""
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        instagram: "",
        company: "",
        notes: ""
      });
    }
  }, [client, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Lütfen müşteri adını giriniz.");

    onSave({
      ...formData,
      id: client?.id
    });
  };

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/40">
        <h3 className="text-base font-bold text-slate-100">{client ? "Müşteriyi Düzenle" : "Yeni Müşteri Ekle"}</h3>
        <button className="btn-icon p-2 hover:bg-slate-800/60 rounded-xl transition-all duration-300 ease-[0.16,1,0.3,1]" onClick={onClose}>
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="form-group">
          <label className="form-label">Müşteri Adı / Yetkili</label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
            placeholder="Örn: Ahmet Yılmaz"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Şirket Unvanı</label>
          <input
            type="text"
            name="company"
            className="form-control"
            value={formData.company}
            onChange={handleChange}
            placeholder="Örn: Apex Medya A.Ş."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Telefon Numarası</label>
            <input
              type="tel"
              name="phone"
              className="form-control"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+90 532 ..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">E-Posta</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              placeholder="ahmet@sirket.com"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Instagram Hesabı (Sosyal Medya Takibi)</label>
          <input
            type="text"
            name="instagram"
            className="form-control"
            value={formData.instagram}
            onChange={handleChange}
            placeholder="@kullaniciadi"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Notlar</label>
          <textarea
            name="notes"
            className="form-control h-20 resize-none"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Müşteriye özel detaylar, fatura bilgileri..."
          />
        </div>

        <div className="flex gap-4 justify-end mt-4 pt-4 border-t border-slate-800/60">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            İptal
          </button>
          <button type="submit" className="btn btn-primary bg-blue-600 hover:bg-blue-700">
            {client ? "Kaydet" : "Müşteri Ekle"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
