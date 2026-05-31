"use client";

import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { getProjects, getTransactions, getClients } from "../../lib/supabase/db";
import { Project, Transaction, Client } from "../../types";
import { 
  TrendingUp, 
  TrendingDown, 
  TurkishLira, 
  Briefcase, 
  Clock, 
  AlertTriangle,
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  FolderDot
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Filtreleme State'leri
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Verileri yükle
  const loadData = async () => {
    setLoading(true);
    try {
      const prjs = await getProjects();
      const txs = await getTransactions();
      const clis = await getClients();
      setProjects(prjs);
      setTransactions(txs);
      setClients(clis);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Dinamik Yıl Listesi Çıkarma
  const availableYears = Array.from(new Set([
    ...projects.map(p => p.start_date ? new Date(p.start_date).getFullYear() : null),
    ...projects.map(p => p.due_date ? new Date(p.due_date).getFullYear() : null),
    ...transactions.map(t => t.created_at ? new Date(t.created_at).getFullYear() : null)
  ].filter((y): y is number => y !== null))).sort((a, b) => b - a);

  // Filtrelenmiş Veri Kümeleri
  const filteredProjects = projects.filter(p => {
    const matchesArchived = showArchived ? true : !p.archived;
    
    let matchesYear = true;
    let matchesMonth = true;
    let matchesDay = true;
    
    const dateStr = p.start_date || p.due_date;
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

  const filteredTransactions = transactions.filter(t => {
    const matchesArchived = showArchived ? true : !t.archived;
    
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
    
    return matchesArchived && matchesYear && matchesMonth && matchesDay;
  });

  // Tarih periyodu kontrol helper'ları
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const isThisMonth = (dateStr: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const isThisYear = (dateStr: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === currentYear;
  };

  // FİNANSAL HESAPLAMALAR
  // 1. Aylık Ciro (Gelir)
  const monthlyRevenue = filteredTransactions
    .filter(t => t.type === "Gelir" && isThisMonth(t.created_at || null))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // 2. Yıllık Ciro (Gelir)
  const yearlyRevenue = filteredTransactions
    .filter(t => t.type === "Gelir" && isThisYear(t.created_at || null))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // 3. Toplam Gelir (Ciro)
  const totalIncome = filteredTransactions
    .filter(t => t.type === "Gelir")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // 4. Toplam Gider
  const totalExpense = filteredTransactions
    .filter(t => t.type === "Gider")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // 5. Net Kâr
  const netProfit = totalIncome - totalExpense;

  // 6. Bekleyen Ödemeler (Tahsil edilmemiş proje alacakları)
  const pendingPayments = filteredProjects
    .filter(p => !p.completed)
    .reduce((sum, p) => sum + Number(p.price - p.expense - p.net_profit), 0);
  
  // Asıl alacak formülü
  const actualRemainingPayments = filteredProjects.reduce((sum, p) => {
    return p.completed ? sum : sum + Number(p.price);
  }, 0);

  // PROJE İSTATİSTİKLERİ
  const activeProjects = filteredProjects.filter(p => p.status !== "Tamamlandı");
  const completedProjects = filteredProjects.filter(p => p.status === "Tamamlandı");
  
  // Yaklaşan Teslimatlar (Son 7 gün kalanlar)
  const upcomingDeadlines = filteredProjects
    .filter(p => p.due_date && p.status !== "Tamamlandı")
    .map(p => {
      const due = new Date(p.due_date!);
      const remainingDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { project: p, remainingDays };
    })
    .filter(item => item.remainingDays >= 0 && item.remainingDays <= 14)
    .sort((a, b) => a.remainingDays - b.remainingDays)
    .slice(0, 4);

  // RECHARTS GRAFİK VERİSİ
  // Son 6 ayın gelir/gider hareketlerini derle
  const getChartData = () => {
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    const dataMap: { [key: string]: { Gelir: number; Gider: number; Net: number } } = {};
    
    // Son 6 ayı doldur
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      dataMap[label] = { Gelir: 0, Gider: 0, Net: 0 };
    }

    filteredTransactions.forEach(t => {
      if (!t.created_at) return;
      const td = new Date(t.created_at);
      const label = `${months[td.getMonth()]} ${td.getFullYear().toString().slice(-2)}`;
      if (dataMap[label]) {
        if (t.type === "Gelir") {
          dataMap[label].Gelir += Number(t.amount);
        } else {
          dataMap[label].Gider += Number(t.amount);
        }
        dataMap[label].Net = dataMap[label].Gelir - dataMap[label].Gider;
      }
    });

    return Object.entries(dataMap).map(([name, vals]) => ({
      name,
      ...vals
    }));
  };

  const chartData = getChartData();

  const formatCurrency = (val: number) => {
    return val.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "Genel";
    const c = clients.find(cl => cl.id === clientId);
    return c ? (c.company || c.name) : "Bilinmeyen";
  };

  // Son 3 Proje
  const recentProjects = [...filteredProjects].slice(0, 3);

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-8">
        
        {/* Başlık Alanı */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Finansal Özet & Analiz</h1>
            <p className="text-xs text-slate-400">Genel gelir-gider trendleri ve yaklaşan teslimatlar</p>
          </div>
          <button 
            onClick={loadData}
            className="btn btn-secondary text-xs flex gap-2 items-center cursor-pointer"
            disabled={loading}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Verileri Yenile
          </button>
        </div>

        {/* Filtreleme Paneli */}
        <div className="glass-card flex flex-wrap gap-4 justify-between items-center py-4 px-5">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xxs font-black text-slate-400 uppercase tracking-widest mr-1">Tarih Filtreleri</span>
            
            {/* Yıl Seçimi */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-slate-950/60 border border-slate-800/60 text-xs rounded-xl px-3 py-2 cursor-pointer text-slate-300 outline-none focus:border-blue-500/50"
            >
              <option value="">Tüm Yıllar</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {/* Ay Seçimi */}
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-slate-950/60 border border-slate-800/60 text-xs rounded-xl px-3 py-2 cursor-pointer text-slate-300 outline-none focus:border-blue-500/50"
            >
              <option value="">Tüm Aylar</option>
              {["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"].map((name, idx) => (
                <option key={name} value={idx + 1}>{name}</option>
              ))}
            </select>

            {/* Gün Seçimi */}
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="bg-slate-950/60 border border-slate-800/60 text-xs rounded-xl px-3 py-2 cursor-pointer text-slate-300 outline-none focus:border-blue-500/50"
            >
              <option value="">Tüm Günler</option>
              {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div>
            {/* Arşiv Göster/Gizle */}
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

        {/* KPI Skor Kartları */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-24 w-full"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Kâr Kartı */}
            <div className="glass-card" style={{
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%)",
              borderColor: "rgba(59, 130, 246, 0.15)"
            }}>
              <div className="flex justify-between items-start text-slate-400 text-xxs font-bold uppercase tracking-wider">
                <span>Net Kazanç (Kâr)</span>
                <TurkishLira size={16} className="text-blue-400" />
              </div>
              <h3 className={`text-xl font-black mt-3 ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatCurrency(netProfit)}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Tüm zamanlar toplam kârı</p>
            </div>

            {/* Aylık Ciro */}
            <div className="glass-card">
              <div className="flex justify-between items-start text-slate-400 text-xxs font-bold uppercase tracking-wider">
                <span>Aylık Ciro (Bu Ay)</span>
                <TrendingUp size={16} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-black mt-3 text-slate-100">
                {formatCurrency(monthlyRevenue)}
              </h3>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                <ArrowUpRight size={12} /> Bu ay gelen ödemeler
              </p>
            </div>

            {/* Yıllık Ciro */}
            <div className="glass-card">
              <div className="flex justify-between items-start text-slate-400 text-xxs font-bold uppercase tracking-wider">
                <span>Yıllık Ciro</span>
                <TrendingUp size={16} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-black mt-3 text-slate-100">
                {formatCurrency(yearlyRevenue)}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Bu yıl içindeki toplam gelir</p>
            </div>

            {/* Aktif İşler */}
            <div className="glass-card">
              <div className="flex justify-between items-start text-slate-400 text-xxs font-bold uppercase tracking-wider">
                <span>Aktif İş Sayısı</span>
                <Briefcase size={16} className="text-purple-400" />
              </div>
              <h3 className="text-xl font-black mt-3 text-slate-100">
                {activeProjects.length} Proje
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">{completedProjects.length} Proje tamamlandı</p>
            </div>

          </div>
        )}

        {/* 12 Aylık Gelir Grafik Widget'ı */}
        <div className="glass-card">
          <div className="mb-6">
            <h3 className="text-base font-bold">Gelir & Gider Akış Analizi</h3>
            <p className="text-xxs text-slate-400">Son 6 ay içindeki gelir ve gider dağılımları</p>
          </div>
          
          <div className="h-72 w-full text-xs">
            {loading ? (
              <div className="skeleton h-full w-full"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGider" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "10px" }} />
                  <YAxis stroke="#64748b" style={{ fontSize: "10px" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(51, 65, 85, 0.4)", borderRadius: "12px", color: "#f8fafc" }}
                    itemStyle={{ fontSize: "11px" }}
                  />
                  <Area type="monotone" dataKey="Gelir" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorGelir)" />
                  <Area type="monotone" dataKey="Gider" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorGider)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Dashboard Split - Son Projeler & Yaklaşan Teslimatlar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Son Projeler */}
          <div className="glass-card flex flex-col gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">Son Eklenen Projeler</h3>
              <p className="text-xxs text-slate-400">Üzerinde çalışılan en yeni işler</p>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="skeleton h-14 w-full"></div>)
              ) : recentProjects.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">Henüz proje eklenmemiş.</p>
              ) : (
                recentProjects.map(p => (
                  <div key={p.id} className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl flex items-center justify-between text-xs hover:border-slate-700/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                        <FolderDot size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200">{p.title}</h4>
                        <span className="text-[10px] text-slate-500">{getClientName(p.client_id)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-200">{formatCurrency(p.price)}</span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">{p.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Yaklaşan Teslimatlar */}
          <div className="glass-card flex flex-col gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">Yaklaşan Teslimatlar</h3>
              <p className="text-xxs text-slate-400">Teslim tarihi en yakın olan aktif işler</p>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="skeleton h-14 w-full"></div>)
              ) : upcomingDeadlines.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">Yaklaşan teslimat bulunmuyor.</p>
              ) : (
                upcomingDeadlines.map(({ project, remainingDays }) => (
                  <div key={project.id} className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl flex items-center justify-between text-xs hover:border-slate-700/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                        <Clock size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200">{project.title}</h4>
                        <span className="text-[10px] text-slate-500">Teslim: {project.due_date}</span>
                      </div>
                    </div>
                    
                    <div>
                      {remainingDays === 0 ? (
                        <span className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold">
                          Bugün Teslim!
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                          {remainingDays} Gün Kaldı
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </AuthenticatedLayout>
  );
}
