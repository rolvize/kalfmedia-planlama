"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase, hasSupabaseKeys } from "../lib/supabase/supabase";
import { getNotifications, markNotificationRead, isDemoMode } from "../lib/supabase/db";
import { Notification } from "../types";
import { 
  LayoutDashboard, 
  KanbanSquare, 
  ArrowRightLeft, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Info,
  RefreshCw,
  Check,
  FileCheck,
  Camera,
  Sun,
  Moon,
  Layers,
  Pen
} from "lucide-react";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Demo Kullanıcı");
  const [userEmail, setUserEmail] = useState("demo@kalfmedia.com");
  const [userAvatar, setUserAvatar] = useState("");
  const [isDemo, setIsDemo] = useState(true);
  
  // Responsive sidebar drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Realtime Notification Drawer state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Theme support state and toggle
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light";
    const defaultTheme = savedTheme || "dark";
    setTheme(defaultTheme);
    if (defaultTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  // Auth Guard & Profil Bilgileri
  useEffect(() => {
    const checkUser = async () => {
      const demoActive = isDemoMode();
      setIsDemo(demoActive);

      if (hasSupabaseKeys() && !demoActive) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/");
          return;
        }
        
        const user = session.user;
        setUserEmail(user.email || "");
        setUserName(
          user.user_metadata?.full_name || 
          user.user_metadata?.name || 
          user.email?.split("@")[0] || 
          "Kullanıcı"
        );
        setUserAvatar(user.user_metadata?.avatar_url || "");
        
        // Bildirimleri Yükle
        try {
          const list = await getNotifications();
          setNotifications(list);
        } catch (e) {
          console.error("Bildirimler yüklenemedi:", e);
        }
      } else {
        if (typeof window !== "undefined") {
          const storedUsername = localStorage.getItem("demo_username");
          if (storedUsername) {
            setUserName(storedUsername);
            setUserEmail(`${storedUsername.toLowerCase()}@kalfmedia.com`);
          }
        }
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  // Sayfa başlığını pathname'e göre belirle
  const getPageTitle = () => {
    switch (pathname) {
      case "/dashboard": return "Finansal Özet";
      case "/projects": return "Proje Yönetim Paneli";
      case "/daily-plan": return "Gündelik Plan";
      case "/proposals": return "Teklifler";
      case "/equipment": return "Ekipman Yönetimi";
      case "/finance": return "Gelir Gider Yönetimi";
      case "/clients": return "Müşteri Portföyü";
      case "/calendar": return "Çalışma Takvimi";
      case "/imla-kontrolu": return "İmla Kontrolü / Editör";
      case "/settings": return "Sistem Ayarları";
      default: return "KalfMedia Planlama";
    }
  };

  // Oturumu Kapat
  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("demo_session");
      localStorage.removeItem("demo_username");
    }
    if (hasSupabaseKeys()) {
      await supabase.auth.signOut();
    }
    router.push("/");
  };

  // Bildirimi Okundu İşaretle
  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { id: "projects", label: "Proje Yönetim Paneli", path: "/projects", icon: <KanbanSquare size={18} strokeWidth={1.5} /> },
    { id: "daily-plan", label: "Gündelik Plan", path: "/daily-plan", icon: <Layers size={18} strokeWidth={1.5} /> },
    { id: "proposals", label: "Teklifler", path: "/proposals", icon: <FileCheck size={18} strokeWidth={1.5} /> },
    { id: "clients", label: "Müşteriler", path: "/clients", icon: <Users size={18} strokeWidth={1.5} /> },
    { id: "dashboard", label: "Finansal Özet", path: "/dashboard", icon: <LayoutDashboard size={18} strokeWidth={1.5} /> },
    { id: "finance", label: "Gelir Gider Yönetimi", path: "/finance", icon: <ArrowRightLeft size={18} strokeWidth={1.5} /> },
    { id: "equipment", label: "Ekipman Yönetimi", path: "/equipment", icon: <Camera size={18} strokeWidth={1.5} /> },
    { id: "imla-kontrolu", label: "İmla Kontrolü", path: "/imla-kontrolu", icon: <Pen size={18} strokeWidth={1.5} /> },
    { id: "calendar", label: "Takvim", path: "/calendar", icon: <Calendar size={18} strokeWidth={1.5} /> },
    { id: "settings", label: "Ayarlar", path: "/settings", icon: <Settings size={18} strokeWidth={1.5} /> }
  ];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen bg-slate-950 text-slate-400">
        <RefreshCw size={36} className="animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-semibold tracking-wider">KalfMedia Planlama Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 overflow-x-hidden w-full" style={{ maxWidth: '100vw' }}>
      
      {/* 1. ÜST BAR (TOPBAR) */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-slate-900/70 dark:bg-zinc-900/70 backdrop-blur-md border-b border-slate-800/40 overflow-hidden" style={{ maxWidth: '100vw' }}>
        
        {/* Sol Logo Alanı */}
        <div className="flex items-center gap-3">
          <button 
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-all duration-300 ease-[0.16,1,0.3,1]"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
          
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center font-extrabold text-sm text-white">
            Ω
          </div>
          <div>
            <h2 className="font-extrabold text-sm tracking-tight hidden sm:block">KalfMedia Planlama</h2>
            <span className="text-[10px] text-slate-500 block leading-none">{getPageTitle()}</span>
          </div>
        </div>

        {/* Sağ Bildirimler & Profil */}
        <div className="flex items-center gap-4">
          
          {/* Tema Değiştirici */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 transition-all duration-300 ease-[0.16,1,0.3,1] cursor-pointer flex items-center justify-center border border-slate-800/20"
            title={theme === "dark" ? "Aydınlık/Parlak Tema" : "Karanlık Tema"}
          >
            {theme === "dark" ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
          </button>
          
          {/* Bildirim Çanı */}
          <div className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/40 hover:bg-slate-800/70 transition-all duration-300 ease-[0.16,1,0.3,1] relative cursor-pointer border border-slate-800/20"
            >
              <Bell size={18} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Bildirim Çekmecesi (Popover) */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-slate-900/80 dark:bg-zinc-900/80 backdrop-blur-lg border border-slate-800/45 shadow-2xl rounded-2xl p-4 z-50 flex flex-col gap-3 transition-all duration-300 ease-[0.16,1,0.3,1]" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                  <h4 className="font-bold text-xs text-slate-200">Bildirimler</h4>
                  <span className="text-[10px] text-slate-500">{unreadCount} Okunmamış</span>
                </div>

                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-slate-500 text-xxs text-center py-6">Kayıtlı bildirim yok.</p>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-2.5 rounded-xl border text-xxs flex flex-col gap-1 transition-all ${
                          n.read 
                            ? "bg-slate-950/40 border-slate-800/30 text-slate-400" 
                            : "bg-blue-500/10 border-blue-500/20 text-slate-200"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold">{n.title}</span>
                          {!n.read && (
                            <button 
                              onClick={() => handleMarkAsRead(n.id)}
                              className="text-emerald-400 hover:text-emerald-300 p-0.5 transition-all duration-300 ease-[0.16,1,0.3,1]"
                              title="Okundu İşaretle"
                            >
                              <Check size={12} strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] leading-relaxed text-slate-400">{n.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profil */}
          <div className="flex items-center gap-2">
            {userAvatar ? (
              <img src={userAvatar} alt="Profil" className="w-8 h-8 rounded-full border border-slate-800/60" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/10">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold leading-tight">{userName}</p>
              <span className="text-[10px] text-slate-500 block">{userEmail}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. DEMO MOD BANNER'I */}
      {isDemo && (
        <div className="bg-gradient-to-r from-amber-500/10 to-blue-500/5 border-b border-amber-500/20 px-4 sm:px-6 py-2 flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs text-amber-400 z-30">
          <Info size={14} strokeWidth={1.5} className="shrink-0" />
          <span>
            <strong>Demo Modu:</strong> Çevrimdışı çalışıyorsunuz. Supabase veritabanınızı bağlamak için <code>.env.local</code> dosyasını düzenleyin ve <code>schema.sql</code> kodunu Supabase stüdyosunda çalıştırın.
          </span>
        </div>
      )}

      {/* 3. ANA SAYFA DÜZENİ (SIDEBAR + MAIN CONTENT) */}
      <div className="flex-1 flex relative overflow-x-hidden" style={{ maxWidth: '100vw' }}>
        
        {/* Sidebar Navigasyon */}
        <aside 
          className={`fixed lg:sticky top-0 bottom-0 left-0 w-72 sm:w-64 bg-slate-900/70 dark:bg-zinc-900/70 backdrop-blur-md border-r border-slate-800/40 p-4 sm:p-6 flex flex-col gap-8 transition-transform duration-300 ease-[0.16,1,0.3,1] z-50 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
          style={{ height: '100dvh', top: 0 }}
        >
          {/* Mobil Kapatma Butonu */}
          <button 
            className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-all duration-300 ease-[0.16,1,0.3,1]"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} strokeWidth={1.5} />
          </button>

          {/* Navigasyon Link Grubu */}
          <div className="flex flex-col gap-2 mt-4 lg:mt-0">
            <span className="text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-2">Navigasyon</span>
            <nav className="flex flex-col gap-1.5">
              {menuItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      router.push(item.path);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all duration-300 ease-[0.16,1,0.3,1] cursor-pointer ${
                      isActive 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" 
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Alt Kısım - Çıkış Yap */}
          <div className="mt-auto border-t border-slate-800/40 pt-4">
            <button
              onClick={handleSignOut}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 flex items-center gap-3 transition-all duration-300 ease-[0.16,1,0.3,1] cursor-pointer"
            >
              <LogOut size={18} strokeWidth={1.5} />
              <span>Oturumu Kapat</span>
            </button>
          </div>
        </aside>

        {/* Karartma Overlay'i (Mobil sidebar açıkken arka planı karartmak için) */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Ana İçerik Gövdesi */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 min-w-0 flex flex-col gap-6 sm:gap-8 overflow-x-hidden" style={{ maxWidth: '100%', width: 0, flexGrow: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
