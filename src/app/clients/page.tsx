"use client";

import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { getClients, addClient, updateClient, deleteClient, getProjects } from "../../lib/supabase/db";
import { Client, Project } from "../../types";
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  Mail, 
  Building, 
  FileText, 
  Edit,
  Briefcase,
  Trash2
} from "lucide-react";

import ClientModal from "../../components/forms/ClientModal";

export default function ClientsPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Arama & Modal
  const [searchQuery, setSearchQuery] = useState("");
  const [clientModal, setClientModal] = useState<{ isOpen: boolean; data: Client | null }>({ isOpen: false, data: null });

  const loadData = async () => {
    setLoading(true);
    try {
      const clis = await getClients();
      const prjs = await getProjects();
      setClients(clis);
      setProjects(prjs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveClient = async (formData: any) => {
    try {
      if (formData.id) {
        await updateClient(formData.id, formData);
      } else {
        await addClient(formData);
      }
      setClientModal({ isOpen: false, data: null });
      loadData();
    } catch (e) {
      alert("Müşteri kaydedilirken hata oluştu: " + e);
    }
  };

  const handleDeleteClient = async (id: string) => {
    const clientProjectsCount = projects.filter(p => p.client_id === id).length;
    if (clientProjectsCount > 0) {
      alert(`Bu müşteriye bağlı ${clientProjectsCount} adet proje bulunmaktadır. Müşteriyi silmeden önce ilgili projeleri silmelisiniz.`);
      return;
    }

    if (window.confirm("Bu müşteriyi silmek istediğinizden emin misiniz?")) {
      try {
        await deleteClient(id);
        loadData();
      } catch (e) {
        alert("Müşteri silinemedi: " + e);
      }
    }
  };

  // MÜŞTERİ HESAPLAMALARI & ANALİTİKLERİ
  const getClientMetrics = (clientId: string) => {
    const clientProjects = projects.filter(p => p.client_id === clientId);
    const totalProjects = clientProjects.length;
    
    // Toplam Proje Ücreti (Kazanç)
    const totalRevenue = clientProjects.reduce((sum, p) => sum + Number(p.price), 0);
    
    // Ortalama Proje Değeri
    const averageProjectValue = totalProjects > 0 ? totalRevenue / totalProjects : 0;
    
    // Son Proje Tarihi
    let lastProjectDate = "-";
    if (totalProjects > 0) {
      const dates = clientProjects
        .map(p => p.start_date)
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());
      if (dates.length > 0) lastProjectDate = dates[0]!;
    }

    return { totalProjects, totalRevenue, averageProjectValue, lastProjectDate };
  };

  const filteredClients = clients.filter(c => {
    return c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (c.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
           (c.email || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatCurrency = (val: number) => {
    return val.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
  };

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        
        {/* Üst Başlık */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black">Müşteri Portföyü (CRM)</h1>
            <p className="text-xs text-slate-400">Müşteri kartları, notlar ve gelir istatistikleri</p>
          </div>

          <button 
            onClick={() => setClientModal({ isOpen: true, data: null })}
            className="btn btn-primary bg-blue-600 hover:bg-blue-700 flex gap-2 items-center text-xs cursor-pointer"
          >
            <Plus size={14} /> Yeni Müşteri Ekle
          </button>
        </div>

        {/* Filtreleme */}
        <div className="glass-card">
          <div className="relative max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Müşteri veya şirket adı ile ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800/60 focus:border-blue-500/50 rounded-xl outline-none text-xs text-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Müşteriler Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-56 w-full"></div>)}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="glass-card text-center py-12 text-slate-500 text-xs">
            Kayıtlı müşteri bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map(c => {
              const { totalProjects, totalRevenue, averageProjectValue, lastProjectDate } = getClientMetrics(c.id);

              return (
                <div key={c.id} className="glass-card flex flex-col gap-5 group relative border border-slate-800/60 hover:border-slate-700/50">
                  
                  {/* Başlık ve Eylemler */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">{c.name}</h3>
                      <span className="text-[10px] text-slate-500">ID: {c.id.slice(0, 8)}</span>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => setClientModal({ isOpen: true, data: c })}
                        className="text-slate-400 hover:text-white p-1"
                        title="Düzenle"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClient(c.id)}
                        className="text-slate-400 hover:text-red-400 p-1"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* İletişim Detayları */}
                  <div className="flex flex-col gap-1.5 text-[11px] text-slate-400">
                    {c.company && (
                      <div className="flex items-center gap-2">
                        <Building size={12} className="text-slate-500" />
                        <span className="font-semibold">{c.company}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-slate-500" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-slate-500" />
                        <span>{c.email}</span>
                      </div>
                    )}
                    {c.instagram && (
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                        <span className="text-blue-400">{c.instagram}</span>
                      </div>
                    )}
                  </div>

                  {/* Müşteri Notu */}
                  {c.notes && (
                    <div className="p-3 bg-slate-950/40 border border-slate-800/50 rounded-xl text-[10px] text-slate-400 leading-relaxed">
                      {c.notes}
                    </div>
                  )}

                  {/* Analitik İstatistik Grid */}
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-800/60 pt-4 mt-auto text-slate-500 text-[10px]">
                    <div>
                      <span>Toplam İş</span>
                      <p className="font-bold text-xs text-slate-200 mt-0.5">{totalProjects} Proje</p>
                    </div>
                    <div>
                      <span>Toplam Kazanç</span>
                      <p className="font-bold text-xs text-emerald-400 mt-0.5">{formatCurrency(totalRevenue)}</p>
                    </div>
                    <div>
                      <span>Ort. Proje</span>
                      <p className="font-bold text-slate-200 mt-0.5">{formatCurrency(averageProjectValue)}</p>
                    </div>
                    <div>
                      <span>Son İletişim</span>
                      <p className="font-bold text-slate-200 mt-0.5">{lastProjectDate}</p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      <ClientModal 
        isOpen={clientModal.isOpen}
        onClose={() => setClientModal({ isOpen: false, data: null })}
        onSave={handleSaveClient}
        client={clientModal.data}
      />
    </AuthenticatedLayout>
  );
}
