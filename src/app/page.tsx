"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, hasSupabaseKeys } from "../lib/supabase/supabase";
import { ArrowRight, Mail, Play, AlertCircle, Info, Globe, User, Lock } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [authMessage, setAuthMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Şifreli Giriş State'leri
  const [loginTab, setLoginTab] = useState<"magic" | "password">("magic");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  useEffect(() => {
    setIsDemo(!hasSupabaseKeys());

    // Oturumu denetle
    const checkSession = async () => {
      if (hasSupabaseKeys()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push("/dashboard");
        }
      }
    };
    checkSession();
  }, [router]);

  // Magic Link Giriş İşlemi
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (typeof window !== "undefined") {
      localStorage.removeItem("demo_session");
      localStorage.removeItem("demo_username");
    }

    if (isDemo) {
      setAuthMessage({
        type: "error",
        text: "Supabase anahtarları tanımlı değil. Lütfen Demo Giriş butonunu kullanın."
      });
      return;
    }

    setLoading(true);
    setAuthMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
        },
      });

      if (error) throw error;

      setAuthMessage({
        type: "success",
        text: "Giriş bağlantısı e-posta adresinize gönderildi! Gelen kutunuzu kontrol edin."
      });
    } catch (err: any) {
      setAuthMessage({
        type: "error",
        text: err.message || "Giriş bağlantısı gönderilirken hata oluştu."
      });
    } finally {
      setLoading(false);
    }
  };

  // Google Giriş İşlemi
  const handleGoogleLogin = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("demo_session");
      localStorage.removeItem("demo_username");
    }

    if (isDemo) {
      setAuthMessage({
        type: "error",
        text: "Supabase anahtarları tanımlı değil. Lütfen Demo Giriş butonunu kullanın."
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/dashboard",
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthMessage({
        type: "error",
        text: err.message || "Google ile giriş yaparken hata oluştu."
      });
      setLoading(false);
    }
  };

  // Çevrimdışı Demo Giriş İşlemi
  const handleDemoLogin = () => {
    setLoading(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("demo_session", "true");
      localStorage.removeItem("demo_username");
    }
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  // Kullanıcı Adı ve Şifre Giriş İşlemi
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput) return;

    setLoading(true);
    setAuthMessage(null);

    const normalizedUsername = usernameInput.trim().toLowerCase();
    const matchesPassword = passwordInput === "@Yeturko2257." || passwordInput === "@Yeturko2257";

    if (normalizedUsername === "yeturk" && matchesPassword) {
      if (typeof window !== "undefined") {
        localStorage.setItem("demo_session", "true");
        localStorage.setItem("demo_username", "Yetürk");
      }
      setAuthMessage({
        type: "success",
        text: "Başarıyla giriş yapıldı! Yönlendiriliyorsunuz..."
      });
      setTimeout(() => {
        router.push("/dashboard");
      }, 600);
    } else {
      setAuthMessage({
        type: "error",
        text: "Hatalı kullanıcı adı veya şifre!"
      });
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col justify-center items-center px-4 relative overflow-hidden bg-[#090a0f] text-slate-100 min-h-screen">
      {/* Arkaplan Glowing Efektleri */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-10 right-10 w-[200px] h-[200px] rounded-full bg-emerald-600/5 blur-[80px] pointer-events-none z-0"></div>

      <div className="w-full max-w-md z-10 flex flex-col gap-8">
        {/* Logo & Slogan */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center font-extrabold text-2xl shadow-xl shadow-blue-500/20 text-white">
            Ω
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent" style={{ fontFamily: "var(--font-geist-sans)" }}>
              KalfMedia Planlama
            </h1>
            <p className="text-emerald-400 font-semibold text-xs tracking-widest uppercase mt-1">
              Creative Freelancer OS
            </p>
          </div>
          <p className="text-slate-400 text-sm mt-2 max-w-sm">
            Kreatif stüdyolar, solo editörler ve ajanslar için Supabase tabanlı gerçek zamanlı iş ve finans yönetim paneli.
          </p>
        </div>

        {/* Giriş Paneli */}
        <div className="glass-card" style={{ padding: "2rem" }}>
          {/* Sekmeler */}
          <div className="flex gap-2 p-1 bg-slate-900/60 rounded-xl mb-6 border border-slate-800/40">
            <button
              onClick={() => {
                setLoginTab("magic");
                setAuthMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                loginTab === "magic"
                  ? "bg-slate-800 text-slate-100 shadow-sm border border-slate-700/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Hızlı Giriş
            </button>
            <button
              onClick={() => {
                setLoginTab("password");
                setAuthMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                loginTab === "password"
                  ? "bg-slate-800 text-slate-100 shadow-sm border border-slate-700/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Kullanıcı Girişi
            </button>
          </div>

          {loginTab === "magic" ? (
            <>
              <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400">E-Posta Adresi</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      placeholder="isim@sirket.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800/60 focus:border-blue-500/50 rounded-xl outline-none text-sm text-slate-200 transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700/80 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-800/60 transition-all cursor-pointer disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Giriş Yapılıyor..." : "Magic Link Gönder"}
                  <ArrowRight size={14} />
                </button>
              </form>

              {/* Ayraç */}
              <div className="flex items-center my-6 text-slate-600">
                <div className="flex-1 h-[1px] bg-slate-800/60"></div>
                <span className="px-3 text-xxs tracking-wider uppercase font-semibold text-slate-500">Veya</span>
                <div className="flex-1 h-[1px] bg-slate-800/60"></div>
              </div>

              {/* Google Giriş Butonu */}
              <button
                onClick={handleGoogleLogin}
                className="w-full py-2.5 bg-white text-slate-950 hover:bg-slate-100 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mb-3"
                disabled={loading}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#EA4335" d="M12 5.04c1.67 0 3.2.58 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.89 3.02C6.21 7.62 8.87 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.45 12.3c0-.82-.07-1.6-.21-2.3H12v4.38h6.43c-.28 1.44-1.1 2.66-2.33 3.48l3.6 2.79c2.1-1.94 3.75-4.8 3.75-8.35z" />
                  <path fill="#FBBC05" d="M5.28 14.02a7.1 7.1 0 0 1 0-4.04L1.39 6.96a11.96 11.96 0 0 0 0 10.08l3.89-3.02z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.6-2.79c-1 .67-2.28 1.07-3.96 1.07-3.13 0-5.79-2.58-6.72-5.54l-3.89 3.02C3.37 19.33 7.35 23 12 23z" />
                </svg>
                Google ile Giriş Yap
              </button>

              {/* Çevrimdışı Demo Modu Girişi (Vurgulu) */}
              <button
                onClick={handleDemoLogin}
                className="w-full py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                disabled={loading}
              >
                <Play size={14} />
                Hızlı Demo Girişi (Çevrimdışı)
              </button>
            </>
          ) : (
            <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400">Kullanıcı Adı</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Yetürk"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800/60 focus:border-blue-500/50 rounded-xl outline-none text-sm text-slate-200 transition-all"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400">Şifre</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800/60 focus:border-blue-500/50 rounded-xl outline-none text-sm text-slate-200 transition-all"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 border border-blue-600/30 text-white transition-all cursor-pointer disabled:opacity-50 mt-2 shadow-lg shadow-blue-600/10"
                disabled={loading}
              >
                {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
                <ArrowRight size={14} />
              </button>
            </form>
          )}
        </div>

        {/* Durum Mesajları */}
        {authMessage && (
          <div className={`p-4 rounded-xl text-xs flex gap-2 items-start border ${
            authMessage.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {authMessage.type === "success" ? <Info size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
            <span>{authMessage.text}</span>
          </div>
        )}

        {/* Demo Mod Bilgilendirmesi */}
        {isDemo && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex gap-2">
            <Info size={16} className="shrink-0" />
            <span>
              <strong>Kurulum Uyarısı:</strong> Yerel anahtarlar bulunamadı. Uygulama otomatik olarak çevrimdışı Demo Moduna uyarlanmıştır. Gerçek veri tabanı entegrasyonu için <code>.env.local</code> dosyasını yapılandırın.
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
