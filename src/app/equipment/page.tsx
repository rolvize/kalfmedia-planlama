"use client";

import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { 
  getEquipment, 
  addEquipment, 
  updateEquipment, 
  deleteEquipment, 
  getEquipmentBookings, 
  addEquipmentBooking, 
  deleteEquipmentBooking, 
  checkEquipmentConflict,
  getProjects 
} from "../../lib/supabase/db";
import { Equipment, EquipmentBooking, Project } from "../../types";
import { Camera, Plus, Trash2, Calendar, AlertTriangle, Check, RefreshCw, X } from "lucide-react";

export default function EquipmentPage() {
  const [loading, setLoading] = useState(true);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Equipment Form State
  const [eqName, setEqName] = useState("");
  const [eqNotes, setEqNotes] = useState("");
  const [eqStatus, setEqStatus] = useState("Aktif");

  // Booking Form State
  const [selectedEqId, setSelectedEqId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Conflict and Loading states
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [conflictFound, setConflictFound] = useState<EquipmentBooking | null>(null);
  const [conflictProjectName, setConflictProjectName] = useState("");
  
  useEffect(() => {
    loadData();
  }, []);

  // Monitor booking form changes to trigger real-time conflict checking
  useEffect(() => {
    if (selectedEqId && startDate && endDate) {
      triggerConflictCheck();
    } else {
      setConflictFound(null);
      setConflictProjectName("");
    }
  }, [selectedEqId, startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const eq = await getEquipment();
      const b = await getEquipmentBookings();
      const p = await getProjects();
      
      setEquipmentList(eq);
      setBookings(b);
      setProjects(p);

      if (eq.length > 0) setSelectedEqId(eq[0].id);
      if (p.length > 0) setSelectedProjectId(p[0].id);
    } catch (e) {
      console.error("Veriler yüklenemedi:", e);
    } finally {
      setLoading(false);
    }
  };

  const triggerConflictCheck = async () => {
    if (!selectedEqId || !startDate || !endDate) return;
    setCheckingConflict(true);
    try {
      const conflict = await checkEquipmentConflict(selectedEqId, startDate, endDate);
      setConflictFound(conflict);
      if (conflict) {
        // Find conflicting project name
        const prj = projects.find(p => p.id === conflict.project_id);
        setConflictProjectName(prj ? prj.title : "Bilinmeyen Proje");
      } else {
        setConflictProjectName("");
      }
    } catch (e) {
      console.error("Çakışma kontrolü başarısız:", e);
    } finally {
      setCheckingConflict(false);
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqName.trim()) return alert("Ekipman adı boş olamaz.");

    try {
      const added = await addEquipment({
        name: eqName,
        status: eqStatus,
        notes: eqNotes || null
      });
      setEquipmentList(prev => [added, ...prev]);
      setEqName("");
      setEqNotes("");
      setEqStatus("Aktif");
      if (!selectedEqId) setSelectedEqId(added.id);
    } catch (e) {
      alert("Ekipman eklenemedi: " + e);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const updated = await updateEquipment(id, { status: newStatus });
      setEquipmentList(prev => prev.map(item => item.id === id ? updated : item));
    } catch (e) {
      alert("Ekipman durumu güncellenemedi: " + e);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm("Bu ekipmanı envanterden silmek istediğinize emin misiniz? Bağlı tüm rezervasyonlar da silinecektir.")) return;
    try {
      await deleteEquipment(id);
      setEquipmentList(prev => prev.filter(item => item.id !== id));
      setBookings(prev => prev.filter(b => b.equipment_id !== id));
      if (selectedEqId === id) setSelectedEqId(equipmentList[0]?.id || "");
    } catch (e) {
      alert("Ekipman silinemedi: " + e);
    }
  };

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEqId || !selectedProjectId || !startDate || !endDate) {
      return alert("Lütfen tüm alanları doldurun.");
    }
    if (startDate > endDate) {
      return alert("Başlangıç tarihi bitiş tarihinden sonra olamaz.");
    }

    try {
      const added = await addEquipmentBooking({
        equipment_id: selectedEqId,
        project_id: selectedProjectId,
        start_date: startDate,
        end_date: endDate
      });
      setBookings(prev => [added, ...prev]);
      setStartDate("");
      setEndDate("");
      setConflictFound(null);
      alert("Ekipman başarıyla projeye atandı.");
    } catch (e: any) {
      alert(e.message || "Rezervasyon eklenemedi.");
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Bu rezervasyonu kaldırmak istediğinize emin misiniz?")) return;
    try {
      await deleteEquipmentBooking(id);
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (e) {
      alert("Rezervasyon kaldırılamadı: " + e);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        
        {/* Başlık Alanı */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-100 flex items-center gap-3">
              <Camera className="text-blue-500" size={28} />
              Ekipman & Çakışma Yönetimi
            </h1>
            <p className="text-xs text-slate-500 mt-1">Envanterinizi takip edin ve projeler arası ekipman çakışmalarını engelleyin.</p>
          </div>
          <button 
            onClick={loadData}
            className="btn btn-secondary flex items-center gap-2 font-bold cursor-pointer"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Yenile
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <RefreshCw size={36} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* SOL SÜTUN - ENVANTER (5/12 GENİŞLİK) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Ekipman Tanımlama Formu */}
              <div className="glass-card p-6 border border-slate-800/60 rounded-2xl">
                <h3 className="text-sm font-black text-slate-200 mb-4 flex items-center gap-2">
                  <Plus size={16} className="text-blue-500" /> Yeni Ekipman Ekle
                </h3>
                <form onSubmit={handleAddEquipment} className="flex flex-col gap-4">
                  <div className="form-group">
                    <label className="form-label">Ekipman Adı</label>
                    <input 
                      type="text"
                      className="form-control text-xs"
                      value={eqName}
                      onChange={(e) => setEqName(e.target.value)}
                      placeholder="Örn: Sony FX3 Body, Aputure 600d..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Varsayılan Durum</label>
                      <select
                        className="form-control text-xs"
                        value={eqStatus}
                        onChange={(e) => setEqStatus(e.target.value)}
                      >
                        <option value="Aktif">Aktif</option>
                        <option value="Bakımda">Bakımda</option>
                        <option value="Pasif">Pasif</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notlar / Seri No</label>
                    <input 
                      type="text"
                      className="form-control text-xs"
                      value={eqNotes}
                      onChange={(e) => setEqNotes(e.target.value)}
                      placeholder="Örn: Seri No: 8273948, Kit Çantası..."
                    />
                  </div>

                  <button type="submit" className="btn btn-primary font-bold mt-2">
                    Ekle
                  </button>
                </form>
              </div>

              {/* Ekipman Listesi */}
              <div className="glass-card p-6 border border-slate-800/60 rounded-2xl flex-1">
                <h3 className="text-sm font-black text-slate-200 mb-4">Envanter Listesi ({equipmentList.length})</h3>
                <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
                  {equipmentList.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">Envanterde henüz ekipman yok.</p>
                  ) : (
                    equipmentList.map(item => (
                      <div key={item.id} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-200 truncate">{item.name}</h4>
                          {item.notes && <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.notes}</p>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                            className={`text-[10px] font-bold py-1 px-2.5 rounded-lg border bg-slate-900 cursor-pointer ${
                              item.status === "Aktif" 
                                ? "text-emerald-400 border-emerald-500/20" 
                                : item.status === "Bakımda"
                                ? "text-amber-500 border-amber-500/20"
                                : "text-rose-500 border-rose-500/20"
                            }`}
                          >
                            <option value="Aktif">Aktif</option>
                            <option value="Bakımda">Bakımda</option>
                            <option value="Pasif">Pasif</option>
                          </select>
                          <button 
                            onClick={() => handleDeleteEquipment(item.id)}
                            className="text-slate-500 hover:text-rose-500 p-1 transition-all"
                            title="Ekipmanı Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* SAĞ SÜTUN - REZERVASYON & ÇAKIŞMA KONTROLÜ (7/12 GENİŞLİK) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Rezervasyon Ekleme Formu */}
              <div className="glass-card p-6 border border-slate-800/60 rounded-2xl">
                <h3 className="text-sm font-black text-slate-200 mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" /> Ekipman Tahsisi & Rezervasyon
                </h3>
                <form onSubmit={handleAddBooking} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Ekipman Seçin</label>
                      <select
                        className="form-control text-xs"
                        value={selectedEqId}
                        onChange={(e) => setSelectedEqId(e.target.value)}
                        required
                      >
                        {equipmentList.map(item => (
                          <option key={item.id} value={item.id} disabled={item.status !== "Aktif"}>
                            {item.name} {item.status !== "Aktif" ? `(${item.status})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Proje Seçin</label>
                      <select
                        className="form-control text-xs"
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        required
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Rezervasyon Başlangıcı</label>
                      <input 
                        type="date"
                        className="form-control text-xs"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Rezervasyon Bitişi</label>
                      <input 
                        type="date"
                        className="form-control text-xs"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Realtime Conflict Check Display */}
                  {checkingConflict && (
                    <div className="p-3 bg-slate-950/40 rounded-xl text-xxs text-slate-400 flex items-center gap-2">
                      <RefreshCw size={12} className="animate-spin text-blue-500" />
                      Çakışma kontrolü yapılıyor...
                    </div>
                  )}

                  {!checkingConflict && conflictFound && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-start gap-3">
                      <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                      <div>
                        <h4 className="font-extrabold text-rose-300">Tarih Çakışması Tespit Edildi!</h4>
                        <p className="mt-1 font-semibold leading-relaxed">
                          Bu ekipman belirtilen tarihlerde zaten başka bir projeye atanmış:
                        </p>
                        <ul className="list-disc pl-4 mt-1 space-y-0.5 text-xxs text-rose-400/80">
                          <li><strong>Proje:</strong> {conflictProjectName}</li>
                          <li><strong>Tarihler:</strong> {conflictFound.start_date} - {conflictFound.end_date}</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {!checkingConflict && !conflictFound && selectedEqId && startDate && endDate && (
                    <div className="p-3 bg-emerald-500/15 border border-emerald-500/25 rounded-xl text-xxs text-emerald-400 flex items-center gap-2">
                      <Check size={14} />
                      Seçilen tarihler uygun! Çakışma bulunamadı.
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary font-bold mt-2"
                    disabled={!!conflictFound || checkingConflict}
                  >
                    Rezervasyonu Onayla
                  </button>
                </form>
              </div>

              {/* Rezervasyon Listesi */}
              <div className="glass-card p-6 border border-slate-800/60 rounded-2xl flex-1">
                <h3 className="text-sm font-black text-slate-200 mb-4">Aktif Rezervasyonlar ({bookings.length})</h3>
                <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
                  {bookings.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">Kayıtlı rezervasyon bulunmuyor.</p>
                  ) : (
                    bookings.map(b => {
                      const eq = equipmentList.find(e => e.id === b.equipment_id);
                      const prj = projects.find(p => p.id === b.project_id);
                      return (
                        <div key={b.id} className="p-3.5 bg-slate-950/40 border border-slate-800/60 rounded-xl flex items-center justify-between gap-4 text-xs">
                          <div>
                            <span className="font-extrabold text-blue-400 text-xxs bg-blue-500/5 px-2 py-0.5 rounded-md border border-blue-500/10">
                              {eq ? eq.name : "Silinmiş Ekipman"}
                            </span>
                            <h4 className="font-bold text-slate-200 mt-1.5">{prj ? prj.title : "Silinmiş Proje"}</h4>
                            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                              <Calendar size={12} />
                              {b.start_date} / {b.end_date}
                            </p>
                          </div>
                          <button 
                            onClick={() => handleDeleteBooking(b.id)}
                            className="text-slate-500 hover:text-rose-500 p-1.5 transition-all shrink-0"
                            title="Rezervasyonu Kaldır"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </AuthenticatedLayout>
  );
}
