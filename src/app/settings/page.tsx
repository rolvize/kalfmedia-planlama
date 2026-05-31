"use client";

import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { supabase, hasSupabaseKeys } from "../../lib/supabase/supabase";
import { 
  Settings as SettingsIcon, 
  Database, 
  Key, 
  HelpCircle, 
  Info,
  ShieldAlert,
  ShieldCheck,
  Code
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(true);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; id: string } | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const keysExist = hasSupabaseKeys();
      setIsDemo(!keysExist);

      if (keysExist) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          setUserInfo({
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "Bilinmeyen Kullanıcı",
            email: session.user.email || "",
            id: session.user.id
          });
        }
      }
      setLoading(false);
    };

    checkStatus();
  }, []);

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6 max-w-4xl">
        
        {/* Üst Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-500/10 text-slate-400">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black">Sistem Ayarları</h1>
            <p className="text-xs text-slate-400">Veritabanı bağlantı durumları, profil detayları ve dokümantasyon</p>
          </div>
        </div>

        {/* Bağlantı Durumu Kartı */}
        <div className="glass-card flex flex-col gap-4">
          <h3 className="text-sm font-bold border-b border-slate-800/60 pb-2 flex gap-2 items-center">
            <Database size={14} className="text-blue-500" />
            Supabase Veritabanı Durumu
          </h3>

          <div className="flex items-start gap-4">
            {isDemo ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl shrink-0 flex items-center justify-center">
                <ShieldAlert size={28} />
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl shrink-0 flex items-center justify-center">
                <ShieldCheck size={28} />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold text-slate-200">
                {isDemo ? "Çevrimdışı Demo Modunda Çalışıyor" : "Supabase Cloud Bağlantısı Aktif"}
              </h4>
              <p className="text-xxs leading-relaxed text-slate-400">
                {isDemo 
                  ? "Uygulama yerel çevre değişkenlerini (.env.local) bulamadığı için LocalStorage tabanlı demo modunu başlattı. Eklediğiniz tüm veriler tarayıcınızda geçici olarak saklanır."
                  : "Uygulamanız Supabase PostgreSQL bulut veritabanına başarıyla bağlandı. Tüm veri okuma, yazma ve gerçek zamanlı (realtime) güncelleme akışları aktiftir."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Profil Bilgileri */}
        {!isDemo && userInfo && (
          <div className="glass-card flex flex-col gap-4">
            <h3 className="text-sm font-bold border-b border-slate-800/60 pb-2">Aktif Kullanıcı Profili</h3>
            <div className="flex flex-col gap-2 text-xs text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>Kullanıcı Adı:</span>
                <span className="font-bold text-slate-200">{userInfo.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>E-Posta Adresi:</span>
                <span className="font-bold text-slate-200">{userInfo.email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>User UUID (Supabase Auth):</span>
                <span className="font-mono font-bold text-slate-200 text-[10px]">{userInfo.id}</span>
              </div>
            </div>
          </div>
        )}

        {/* Entegrasyon Yönergeleri */}
        <div className="glass-card flex flex-col gap-4">
          <h3 className="text-sm font-bold border-b border-slate-800/60 pb-2 flex gap-2 items-center">
            <Code size={14} className="text-emerald-400" />
            Google / Supabase SaaS Entegrasyon Kılavuzu
          </h3>

          <div className="flex flex-col gap-4 text-xs text-slate-400 leading-relaxed font-medium">
            <p>
              Uygulamayı kendi Supabase veritabanınıza bağlamak son derece kolaydır. Aşağıdaki adımları uygulayın:
            </p>

            <div className="flex flex-col gap-3 pl-4 border-l-2 border-blue-500">
              <div>
                <strong className="text-slate-300">Adım 1: Supabase Projesi Oluşturun</strong>
                <p className="mt-0.5 text-xxs text-slate-500">supabase.com adresinde ücretsiz bir hesap açıp yeni bir PostgreSQL projesi başlatın.</p>
              </div>

              <div>
                <strong className="text-slate-300">Adım 2: Veritabanı Tablolarını Kurun</strong>
                <p className="mt-0.5 text-xxs text-slate-500">
                  Proje kök dizininde bulunan <code>schema.sql</code> dosyasının içeriğini kopyalayın. Supabase stüdyosundaki <strong>SQL Editor</strong> bölümüne yapıştırıp <strong>RUN</strong> butonuna basarak tüm RLS ve tablo yapılarını otomatik kurun.
                </p>
              </div>

              <div>
                <strong className="text-slate-300">Adım 3: Çevre Değişkenlerini Tanımlayın</strong>
                <p className="mt-0.5 text-xxs text-slate-500">
                  Supabase projenizin <strong>Settings &gt; API</strong> menüsündeki Project URL ve Anon Key değerlerini, yereldeki <code>.env.local</code> dosyasının içerisine yapıştırın:
                </p>
                <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/60 font-mono text-[10px] text-slate-300 mt-1 max-w-full overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
                </pre>
              </div>

              <div>
                <strong className="text-slate-300">Adım 4: Oturumu Başlatın</strong>
                <p className="mt-0.5 text-xxs text-slate-500">
                  Uygulamanın terminalinde <code>npm run dev</code> komutunu çalıştırın. Artık Google OAuth veya Magic Link ile kendi e-postanız üzerinden gerçek zamanlı çalışmaya hazırsınız!
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl text-xxs text-slate-400 flex gap-2">
              <Info size={16} className="text-blue-400 shrink-0" />
              <span>
                <strong>Güvenlik Notu:</strong> Supabase veritabanında Row Level Security (RLS) politikaları etkindir. Her kullanıcı yalnızca kendi oluşturduğu müşterileri, projeleri ve kasayı yönetebilir; diğer kullanıcılar verilerinize erişemez.
              </span>
            </div>
          </div>
        </div>

      </div>
    </AuthenticatedLayout>
  );
}
