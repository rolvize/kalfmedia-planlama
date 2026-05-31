"use client";

import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { getTransactions, addTransaction, deleteTransaction, getProjects, updateTransaction } from "../../lib/supabase/db";
import { Transaction, Project } from "../../types";
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  Filter, 
  Calculator,
  Percent,
  Calendar,
  Archive
} from "lucide-react";

import TransactionModal from "../../components/forms/TransactionModal";

export default function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Arama & Filtreleme
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Vergi Parametreleri
  const [taxRate, setTaxRate] = useState(20); // varsayılan %20 gelir vergisi
  const [kdvRate, setKdvRate] = useState(20); // varsayılan %20 KDV

  // Modal
  const [txModalOpen, setTxModalOpen] = useState(false);

  const handleToggleArchiveTransaction = async (id: string, currentArchived: boolean) => {
    try {
      await updateTransaction(id, { archived: !currentArchived });
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, archived: !currentArchived } : t));
    } catch (e: any) {
      alert("Finansal hareket arşiv durumu güncellenemedi: " + (e?.message || e?.details || String(e)));
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const txs = await getTransactions();
      const prjs = await getProjects();
      setTransactions(txs);
      setProjects(prjs);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTransaction = async (formData: any) => {
    try {
      await addTransaction(formData);
      setTxModalOpen(false);
      loadData();
    } catch (e: any) {
      alert("İşlem kaydedilemedi: " + (e?.message || e?.details || String(e)));
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm("Bu finansal hareketi silmek istediğinizden emin misiniz?")) {
      try {
        await deleteTransaction(id);
        loadData();
      } catch (e: any) {
        alert("İşlem silinemedi: " + (e?.message || e?.details || String(e)));
      }
    }
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return "Genel (Ofis / Ekip)";
    const p = projects.find(prj => prj.id === projectId);
    return p ? p.title : `Proje (${projectId.slice(0, 8)})`;
  };

  // KATEGORİLER
  const categories = ["all", ...new Set(transactions.map(t => t.category))];

  // Dinamik Yıl Listesi Çıkarma
  const availableYears = Array.from(new Set([
    ...transactions.map(t => t.created_at ? new Date(t.created_at).getFullYear() : null)
  ].filter((y): y is number => y !== null))).sort((a, b) => b - a);

  // FİLTRELEME MANTIĞI
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = (t.note || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          getProjectName(t.project_id).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    
    // Arşiv Filtresi
    const matchesArchived = showArchived ? true : !t.archived;

    // Tarih Filtreleri
    let matchesYear = true;
    let matchesMonth = true;
    let matchesDay = true;
    
    if (t.created_at) {
      const d = new Date(t.created_at);
      if (yearFilter) matchesYear = d.getFullYear().toString() === yearFilter;
      if (monthFilter) matchesMonth = (d.getMonth() + 1).toString() === monthFilter;
      if (dayFilter) matchesDay = d.getDate().toString() === dayFilter;
    } else if (yearFilter || monthFilter || dayFilter) {
      matchesYear = matchesMonth = matchesDay = false;
    }

    return matchesSearch && matchesType && matchesCategory && matchesArchived && matchesYear && matchesMonth && matchesDay;
  });

  // HESAPLAMALAR
  const totalIncome = filteredTransactions
    .filter(t => t.type === "Gelir")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === "Gider")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netProfit = totalIncome - totalExpense;

  // Vergi Tahmini Hesaplama
  const taxableIncome = filteredTransactions
    .filter(t => t.type === "Gelir" && !(t.note || "").includes("[VERGI_SIZ]"))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const deductibleExpense = filteredTransactions
    .filter(t => t.type === "Gider" && !(t.note || "").includes("[VERGI_SIZ]"))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const taxableNetProfit = Math.max(0, taxableIncome - deductibleExpense);
  const estimatedIncomeTax = Math.max(0, taxableNetProfit * (taxRate / 100));

  const kdvIncome = filteredTransactions
    .filter(t => t.type === "Gelir" && !(t.note || "").includes("[KDV_SIZ]"))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const kdvExpense = filteredTransactions
    .filter(t => t.type === "Gider" && !(t.note || "").includes("[KDV_SIZ]"))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const estimatedKDV = Math.max(0, kdvIncome * (kdvRate / 100) - kdvExpense * (kdvRate / 100));
  const remainingCash = Math.max(0, netProfit - estimatedIncomeTax - estimatedKDV);

  const formatCurrency = (val: number) => {
    return val.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
  };

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        
        {/* Üst Başlık */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black">Gelir Gider Yönetimi</h1>
            <p className="text-xs text-slate-400">Gelir gider hareketleri, fatura takibi ve vergi analizleri</p>
          </div>

          <button 
            onClick={() => setTxModalOpen(true)}
            className="btn btn-primary bg-blue-600 hover:bg-blue-700 flex gap-2 items-center text-xs cursor-pointer"
          >
            <Plus size={14} /> Yeni Hareket Ekle
          </button>
        </div>

        {/* Finansal Akış Filtreleme Paneli */}
        <div className="glass-card flex flex-col gap-4">
          <div className="flex flex-wrap gap-3 items-center w-full">
            {/* Arama */}
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Açıklama, kategori veya proje ile ara..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800/60 focus:border-blue-500/50 rounded-xl outline-none text-xs text-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Tür Filtresi */}
            <select
              className="w-40 bg-slate-950/60 border border-slate-800/60 rounded-xl outline-none text-xs text-slate-200 px-3 py-2 cursor-pointer focus:border-blue-500/50"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tüm Hareketler</option>
              <option value="Gelir">Sadece Gelirler</option>
              <option value="Gider">Sadece Giderler</option>
            </select>

            {/* Kategori Filtresi */}
            <select
              className="w-44 bg-slate-950/60 border border-slate-800/60 rounded-xl outline-none text-xs text-slate-200 px-3 py-2 cursor-pointer focus:border-blue-500/50"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Tüm Kategoriler</option>
              {categories.filter(c => c !== "all").map(cat => (
                <option key={cat} value={cat}>{cat}</option>
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

        {/* Üçlü Finansal Özet & Vergi Tahmin Split'i */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Sol: Kasa Özeti */}
          <div className="glass-card flex flex-col gap-4">
            <h3 className="text-sm font-bold border-b border-slate-800/60 pb-3 text-slate-100">Kasa Filtre Özeti</h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Filtrelenmiş Gelir</span>
                <span className="font-bold text-emerald-400">+{formatCurrency(totalIncome)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Filtrelenmiş Gider</span>
                <span className="font-bold text-red-400">-{formatCurrency(totalExpense)}</span>
              </div>
              <div className="h-[1px] bg-slate-800/60 my-1"></div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Net Kasa Durumu</span>
                <span className={`font-black text-sm ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Orta: Vergi Ayarları */}
          <div className="glass-card flex flex-col gap-4">
            <h3 className="text-sm font-bold border-b border-slate-800/60 pb-3 text-slate-100">Vergi Oranları</h3>
            
            <div className="flex flex-col gap-4">
              {/* Gelir Vergisi Segmented Tabs */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tahmini Gelir Vergisi Dilimi</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { value: 0, label: "%0", desc: "Muaf" },
                    { value: 15, label: "%15", desc: "Düşük" },
                    { value: 20, label: "%20", desc: "Standart" },
                    { value: 27, label: "%27", desc: "Orta" },
                    { value: 35, label: "%35", desc: "Yüksek" }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTaxRate(opt.value)}
                      className={`py-2.5 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        taxRate === opt.value
                          ? "bg-blue-600 border-blue-500 text-white font-bold shadow-md shadow-blue-500/20"
                          : "bg-slate-950/20 border-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                      }`}
                    >
                      <span className="text-xs">{opt.label}</span>
                      <span className="text-[8px] font-medium opacity-80">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* KDV Oranı Segmented Tabs */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">KDV Oranı</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 0, label: "%0", desc: "KDV'siz" },
                    { value: 10, label: "%10", desc: "Düşük" },
                    { value: 20, label: "%20", desc: "Standart" }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setKdvRate(opt.value)}
                      className={`py-2.5 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        kdvRate === opt.value
                          ? "bg-blue-600 border-blue-500 text-white font-bold shadow-md shadow-blue-500/20"
                          : "bg-slate-950/20 border-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                      }`}
                    >
                      <span className="text-xs">{opt.label}</span>
                      <span className="text-[8px] font-medium opacity-80">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sağ: Vergi Tahmini Raporu */}
          <div className="glass-card flex flex-col gap-4" style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(59, 130, 246, 0.04) 100%)",
            borderColor: "rgba(16, 185, 129, 0.25)"
          }}>
            <h3 className="text-sm font-bold border-b border-slate-800/60 pb-3 flex gap-2 items-center text-slate-100">
              <Calculator size={14} className="text-emerald-400" />
              Freelancer Vergi Tahmini
            </h3>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Tahmini Gelir Vergisi ({taxRate}%)</span>
                <span className="font-semibold text-slate-200">{formatCurrency(estimatedIncomeTax)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Net KDV Yükümlülüğü ({kdvRate}%)</span>
                <span className="font-semibold text-slate-200">{formatCurrency(estimatedKDV)}</span>
              </div>
              
              {/* Oransal Oran Dağılım Grafiği */}
              {netProfit > 0 && (
                <div className="flex flex-col gap-1.5 my-1">
                  <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-800/30">
                    <div style={{ width: `${Math.max(5, (remainingCash / netProfit) * 100)}%` }} className="bg-emerald-500" title="Net Kazanç" />
                    <div style={{ width: `${Math.max(5, (estimatedIncomeTax / netProfit) * 100)}%` }} className="bg-amber-500" title="Gelir Vergisi" />
                    <div style={{ width: `${Math.max(5, (estimatedKDV / netProfit) * 100)}%` }} className="bg-blue-500" title="KDV" />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-semibold px-0.5">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Net: %{Math.round((remainingCash / netProfit) * 100)}</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Gelir V: %{Math.round((estimatedIncomeTax / netProfit) * 100)}</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>KDV: %{Math.round((estimatedKDV / netProfit) * 100)}</span>
                  </div>
                </div>
              )}

              <div className="h-[1px] bg-slate-800/60"></div>
              
              {/* Vurgulu Net Kazanç Skoru */}
              <div className="flex flex-col gap-1.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vergiler Sonrası Net Kazanç</span>
                <span className="text-xl font-black text-emerald-400">{formatCurrency(remainingCash)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Kasa Defteri Detaylı Hareket Tablosu */}
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800/60 text-slate-400">
                  <th className="p-3 font-bold">Tür</th>
                  <th className="p-3 font-bold">Açıklama</th>
                  <th className="p-3 font-bold">İlişkili İş</th>
                  <th className="p-3 font-bold">Kategori</th>
                  <th className="p-3 font-bold">Tarih</th>
                  <th className="p-3 font-bold">Tutar</th>
                  <th className="p-3 font-bold text-right">Eylem</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">Finansal hareket kaydı bulunamadı.</td>
                  </tr>
                ) : (
                  filteredTransactions
                    .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())
                    .map(t => {
                      const isIncome = t.type === "Gelir";
                      const isKdvSiz = (t.note || "").includes("[KDV_SIZ]");
                      const isVergiSiz = (t.note || "").includes("[VERGI_SIZ]");
                      const cleanNote = (t.note || "")
                        .replace(/\[KDV_SIZ\]/g, "")
                        .replace(/\[VERGI_SIZ\]/g, "")
                        .trim();

                      return (
                        <tr key={t.id} className="border-b border-slate-800/40 hover:bg-slate-900/40 even:bg-slate-900/10 transition-all">
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex gap-1 items-center w-max ${
                              isIncome ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                              {isIncome ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                              {t.type}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-slate-200">{cleanNote || "-"}</span>
                              <div className="flex gap-1.5 flex-wrap">
                                {isKdvSiz && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800/60 text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                    KDV'siz
                                  </span>
                                )}
                                {isVergiSiz && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800/60 text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                    Gelir Vergisiz
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-400">{getProjectName(t.project_id)}</td>
                          <td className="p-3 text-slate-400">{t.category}</td>
                          <td className="p-3 text-slate-400">{(t.created_at || "").split("T")[0]}</td>
                          <td className={`p-3 font-bold ${isIncome ? "text-emerald-400" : "text-red-400"}`}>
                            {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => handleToggleArchiveTransaction(t.id, !!t.archived)}
                                className={`btn-icon p-1 ${t.archived ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"}`}
                                title={t.archived ? "Arşivden Çıkar" : "Arşive Gönder"}
                              >
                                <Archive size={13} />
                              </button>
                              <button 
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="btn-icon p-1 text-red-400 hover:text-red-300"
                                title="Sil"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <TransactionModal 
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSave={handleSaveTransaction}
        projects={projects}
      />
    </AuthenticatedLayout>
  );
}
