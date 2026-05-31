"use client";

import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { 
  getProposals, 
  addProposal, 
  updateProposal, 
  deleteProposal, 
  getClients, 
  addClient 
} from "../../lib/supabase/db";
import { Proposal, Client } from "../../types";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  User, 
  TurkishLira, 
  Briefcase,
  FileCheck,
  Calendar,
  Sparkles,
  Archive
} from "lucide-react";

import ProposalModal from "../../components/forms/ProposalModal";
import ClientModal from "../../components/forms/ClientModal";

const STATUS_OPTIONS = [
  "Hepsi", "Teklif Hazırlanıyor", "Teklif Gönderildi", "Onay Bekliyor", "Onaylandı", "Reddedildi"
];

export default function ProposalsPage() {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Hepsi");
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const handleToggleArchiveProposal = async (id: string, currentArchived: boolean) => {
    try {
      await updateProposal(id, { archived: !currentArchived });
      setProposals(prev => prev.map(p => p.id === id ? { ...p, archived: !currentArchived } : p));
      showToast(currentArchived ? "Teklif arşivden çıkarıldı." : "Teklif arşive gönderildi.");
    } catch (e) {
      alert("Teklif arşiv durumu güncellenemedi: " + e);
    }
  };

  // Modals state
  const [proposalModal, setProposalModal] = useState<{ isOpen: boolean; data: Proposal | null }>({ 
    isOpen: false, 
    data: null 
  });
  const [clientModalOpen, setClientModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const props = await getProposals();
      const clis = await getClients();
      setProposals(props);
      setClients(clis);
    } catch (e) {
      console.error("Veriler yüklenirken hata oluştu:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProposal = async (formData: any) => {
    try {
      let isStatusChangedToApproved = false;
      
      if (formData.id) {
        // Find existing proposal to compare status
        const existing = proposals.find(p => p.id === formData.id);
        if (existing && existing.status !== "Onaylandı" && formData.status === "Onaylandı") {
          isStatusChangedToApproved = true;
        }
        await updateProposal(formData.id, formData);
      } else {
        if (formData.status === "Onaylandı") {
          isStatusChangedToApproved = true;
        }
        await addProposal(formData);
      }
      
      setProposalModal({ isOpen: false, data: null });
      await loadData();

      if (isStatusChangedToApproved) {
        showToast("Teklif onaylandı! Projeler/İşler modülünde otomatik olarak aktif bir proje oluşturuldu. 🚀");
      } else {
        showToast("Teklif başarıyla kaydedildi.");
      }
    } catch (e) {
      alert("Teklif kaydedilirken hata oluştu: " + e);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleDeleteProposal = async (id: string) => {
    if (window.confirm("Bu teklifi silmek istediğinizden emin misiniz?")) {
      try {
        await deleteProposal(id);
        showToast("Teklif silindi.");
        loadData();
      } catch (e) {
        alert("Teklif silinemedi: " + e);
      }
    }
  };

  const handleQuickAddClient = async (clientData: any) => {
    try {
      const newClient = await addClient(clientData);
      // Re-load clients
      const clis = await getClients();
      setClients(clis);
      setClientModalOpen(false);
      showToast(`${newClient.name} başarıyla eklendi.`);
    } catch (e) {
      alert("Müşteri eklenirken hata oluştu: " + e);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return "Bilinmeyen Müşteri";
    return client.company ? `${client.company} (${client.name})` : client.name;
  };

  // Status Badge Colors
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Teklif Hazırlanıyor":
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
      case "Teklif Gönderildi":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "Onay Bekliyor":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Onaylandı":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Reddedildi":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  // Dinamik Yıl Listesi Çıkarma
  const availableYears = Array.from(new Set([
    ...proposals.map(p => p.contact_date ? new Date(p.contact_date).getFullYear() : null),
    ...proposals.map(p => p.created_at ? new Date(p.created_at).getFullYear() : null)
  ].filter((y): y is number => y !== null))).sort((a, b) => b - a);

  // Zaman ve Arşiv Filtreli Teklifler
  const timeFilteredProposals = proposals.filter(p => {
    const matchesArchived = showArchived ? true : !p.archived;

    let matchesYear = true;
    let matchesMonth = true;
    let matchesDay = true;
    
    const dateStr = p.contact_date || p.created_at;
    if (dateStr) {
      const d = new Date(dateStr);
      if (yearFilter) matchesYear = d.getFullYear().toString() === yearFilter;
      if (monthFilter) matchesMonth = (d.getMonth() + 1).toString() === monthFilter;
      if (dayFilter) matchesDay = d.getDate().toString() === dayFilter;
    } else if (yearFilter || monthFilter || dayFilter) {
      matchesYear = matchesMonth = matchesDay = false;
    }

    return matchesArchived && matchesYear && matchesMonth && matchesDay;
  });

  // KPI Calculations
  const totalPendingAmount = timeFilteredProposals
    .filter(p => ["Teklif Hazırlanıyor", "Teklif Gönderildi", "Onay Bekliyor"].includes(p.status))
    .reduce((sum, p) => sum + Number(p.proposal_amount), 0);

  const approvedThisMonth = timeFilteredProposals.filter(p => {
    if (p.status !== "Onaylandı" || !p.created_at) return false;
    const propDate = new Date(p.created_at);
    const today = new Date();
    return propDate.getMonth() === today.getMonth() && propDate.getFullYear() === today.getFullYear();
  }).length;

  const totalClosed = timeFilteredProposals.filter(p => ["Onaylandı", "Reddedildi"].includes(p.status)).length;
  const approvedTotal = timeFilteredProposals.filter(p => p.status === "Onaylandı").length;
  const conversionRate = totalClosed > 0 ? Math.round((approvedTotal / totalClosed) * 100) : 0;

  // Filtered Proposals
  const filteredProposals = timeFilteredProposals.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClientName(p.client_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.project_idea || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "Hepsi" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (val: number) => {
    return val.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
  };

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6 relative">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#12141c] border border-blue-500/30 text-slate-200 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Üst Başlık */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black">Teklifler</h1>
            <p className="text-xs text-slate-400">Potansiyel projeleri takip edin, teklifleri ve müşteri süreçlerini yönetin</p>
          </div>

          <button 
            onClick={() => setProposalModal({ isOpen: true, data: null })}
            className="btn btn-primary bg-blue-600 hover:bg-blue-700 flex gap-2 items-center text-xs cursor-pointer transition-all duration-300 ease-[0.16,1,0.3,1]"
          >
            <Plus size={14} strokeWidth={1.5} /> Yeni Teklif Ekle
          </button>
        </div>

        {/* KPI Skor Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kart 1: Toplam Bekleyen Bütçe */}
          <div className="glass-card flex items-center justify-between p-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Açık/Bekleyen Teklifler</span>
              <h3 className="text-xl font-black text-slate-100">{formatCurrency(totalPendingAmount)}</h3>
              <span className="text-[10px] text-slate-400">Görüşme ve onay aşamasındaki tutar</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <TurkishLira size={20} strokeWidth={1.5} />
            </div>
          </div>

          {/* Kart 2: Bu Ay Onaylanan Teklifler */}
          <div className="glass-card flex items-center justify-between p-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Bu Ay Kazanılan</span>
              <h3 className="text-xl font-black text-emerald-400">{approvedThisMonth} Teklif</h3>
              <span className="text-[10px] text-slate-400">Projeye dönüştürülen işler</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle size={20} strokeWidth={1.5} />
            </div>
          </div>

          {/* Kart 3: Teklif Dönüşüm Oranı */}
          <div className="glass-card flex items-center justify-between p-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Teklif Dönüşüm Oranı</span>
              <h3 className="text-xl font-black text-indigo-400">%{conversionRate}</h3>
              <span className="text-[10px] text-slate-400">Onay / (Onay + Reddedilen)</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <TrendingUp size={20} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Filtre ve Arama Çubuğu */}
        <div className="glass-card flex flex-col gap-4">
          <div className="flex flex-wrap gap-3 items-center w-full">
            {/* Arama */}
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Search size={14} strokeWidth={1.5} />
              </span>
              <input
                type="text"
                placeholder="Teklif adı, müşteri veya brief ile ara..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800/60 focus:border-blue-500/50 rounded-xl outline-none text-xs text-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Durum Filtresi */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Durum:</span>
              <div className="flex flex-wrap gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800/60">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setStatusFilter(opt)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-semibold transition-all duration-300 ease-[0.16,1,0.3,1] cursor-pointer ${
                      statusFilter === opt
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
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
                className="w-32 bg-slate-950/60 border border-slate-800/60 rounded-xl outline-none text-xs text-slate-200 px-3 py-2 cursor-pointer focus:border-blue-500/55"
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

        {/* Teklifler İçerik Alanı */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-60 w-full rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse"></div>
            ))}
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="glass-card text-center py-16 text-slate-500 text-xs flex flex-col items-center gap-3">
            <Briefcase size={28} strokeWidth={1.5} className="text-slate-600" />
            <span>Kayıtlı teklif bulunamadı.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProposals.map(proposal => (
              <div key={proposal.id} className="glass-card flex flex-col gap-5 group relative border border-slate-800/60 hover:border-blue-500/30 transition-all p-8">
                
                {/* Kart Header */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className={`badge-soft font-semibold w-max ${getStatusBadgeClass(proposal.status)}`}>
                      {proposal.status}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100 mt-2.5 leading-snug group-hover:text-blue-400 transition-colors duration-300 ease-[0.16,1,0.3,1]">
                      {proposal.title}
                    </h3>
                  </div>

                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-[0.16,1,0.3,1]">
                    <button 
                      onClick={() => handleToggleArchiveProposal(proposal.id, !!proposal.archived)}
                      className={`p-1 rounded hover:bg-slate-800/60 transition-all duration-300 ease-[0.16,1,0.3,1] ${proposal.archived ? "text-emerald-400" : "text-slate-400 hover:text-white"}`}
                      title={proposal.archived ? "Arşivden Çıkar" : "Arşive Gönder"}
                    >
                      <Archive size={13} strokeWidth={1.5} />
                    </button>
                    <button 
                      onClick={() => setProposalModal({ isOpen: true, data: proposal })}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800/60 transition-all duration-300 ease-[0.16,1,0.3,1]"
                      title="Teklifi Düzenle"
                    >
                      <Edit size={13} strokeWidth={1.5} />
                    </button>
                    <button 
                      onClick={() => handleDeleteProposal(proposal.id)}
                      className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-slate-800/60 transition-all duration-300 ease-[0.16,1,0.3,1]"
                      title="Sil"
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Müşteri ve İş Tipi */}
                <div className="flex flex-col gap-2.5 text-[11px] text-slate-400 border-t border-b border-slate-800/40 py-4">
                  <div className="flex items-center gap-2">
                    <User size={12} strokeWidth={1.5} className="text-slate-500" />
                    <span className="font-semibold text-slate-300 truncate">{getClientName(proposal.client_id)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase size={12} strokeWidth={1.5} className="text-slate-500" />
                    <span className="bg-slate-950/65 text-slate-300 px-2 py-0.5 rounded text-[10px] border border-slate-800/40">
                      {proposal.project_type || "Belirtilmemiş"}
                    </span>
                  </div>
                </div>

                {/* Brief Detayı */}
                {(() => {
                  const hasKdvSiz = proposal.project_idea?.includes("[KDV_SIZ]") || false;
                  const hasVergiSiz = proposal.project_idea?.includes("[VERGI_SIZ]") || false;
                  const cleanIdea = (proposal.project_idea || "")
                    .replace(/\[KDV_SIZ\]/g, "")
                    .replace(/\[VERGI_SIZ\]/g, "")
                    .trim();
                  const kdvAmount = hasKdvSiz ? 0 : proposal.proposal_amount * 0.2;
                  const totalAmount = hasKdvSiz ? proposal.proposal_amount : proposal.proposal_amount * 1.2;

                  return (
                    <>
                      {cleanIdea && (
                        <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/45">
                          {cleanIdea}
                        </p>
                      )}

                      {/* Vergi Badgeleri */}
                      {(hasKdvSiz || hasVergiSiz) && (
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {hasKdvSiz && (
                            <span className="text-[8px] font-black text-amber-400 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
                              KDV'siz
                            </span>
                          )}
                          {hasVergiSiz && (
                            <span className="text-[8px] font-black text-blue-400 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider">
                              Vergisiz
                            </span>
                          )}
                        </div>
                      )}

                      {/* Alt Kısım: Bütçe ve İletişim Tarihi */}
                      <div className="flex justify-between items-center mt-auto pt-2 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} strokeWidth={1.5} className="text-slate-500" />
                          <span>{proposal.contact_date}</span>
                        </div>

                        <div className="text-right text-[9px] text-slate-500 font-medium flex flex-col gap-0.5 leading-tight">
                          <div>Net: <span className="font-bold text-slate-200">{formatCurrency(proposal.proposal_amount)}</span></div>
                          <div>KDV (%20): <span className="text-amber-500 font-bold">{hasKdvSiz ? "0 ₺ (Muaf)" : formatCurrency(kdvAmount)}</span></div>
                          <div className="font-black text-emerald-400 mt-0.5">Toplam: {formatCurrency(totalAmount)}</div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Quick Status Bar (Change status quickly on card) */}
                <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Durum Değiştir:</span>
                  <select
                    className="bg-slate-900 text-[10px] font-semibold text-slate-300 border border-slate-800/60 rounded px-2 py-1 focus:outline-none focus:border-blue-500/40 cursor-pointer"
                    value={proposal.status}
                    onChange={async (e) => {
                      try {
                        const newStatus = e.target.value;
                        const existing = proposals.find(p => p.id === proposal.id);
                        const isApproved = existing && existing.status !== "Onaylandı" && newStatus === "Onaylandı";
                        
                        await updateProposal(proposal.id, { status: newStatus });
                        await loadData();
                        
                        if (isApproved) {
                          showToast("Teklif onaylandı! Projeler/İşler modülünde otomatik olarak aktif bir proje oluşturuldu. 🚀");
                        } else {
                          showToast(`Teklif durumu "${newStatus}" olarak güncellendi.`);
                        }
                      } catch (err) {
                        alert("Durum güncellenirken hata oluştu: " + err);
                      }
                    }}
                  >
                    {STATUS_OPTIONS.slice(1).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Proposal Modal */}
      {proposalModal.isOpen && (
        <ProposalModal 
          isOpen={proposalModal.isOpen}
          onClose={() => setProposalModal({ isOpen: false, data: null })}
          onSave={handleSaveProposal}
          proposal={proposalModal.data}
          clients={clients}
          onQuickAddClient={() => setClientModalOpen(true)}
        />
      )}

      {/* Client Quick Modal */}
      {clientModalOpen && (
        <ClientModal 
          isOpen={clientModalOpen}
          onClose={() => setClientModalOpen(false)}
          onSave={handleQuickAddClient}
          client={null}
        />
      )}
    </AuthenticatedLayout>
  );
}
