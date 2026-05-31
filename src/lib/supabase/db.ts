import { supabase, hasSupabaseKeys } from './supabase';
import { Project, Client, Transaction, Task, Revision, CalendarEvent, Notification, UserProfile, Proposal, Equipment, EquipmentBooking, Gorev } from '../../types';

// Demo Modu Kontrolü
export const isDemoMode = () => {
  if (typeof window !== "undefined") {
    if (localStorage.getItem("demo_session") === "true") {
      return true;
    }
  }
  return !hasSupabaseKeys();
};

// Mock Başlangıç Verileri
const INITIAL_MOCK_DATA = {
  projects: [
    { id: "PRJ-101", user_id: "USER-01", client_id: "MST-101", title: "Tanıtım Filmi Prodüksiyonu", description: "Marka lansmanı için 1 dakikalık ana tanıtım videosu çekimi ve kurgusu.", status: "Kurgu Süreci", project_type: "Video Prodüksiyon", priority: "Yüksek", price: 45000, expense: 5000, net_profit: 40000, start_date: "2026-05-10", due_date: "2026-06-15", completed: false, drive_link: "https://drive.google.com/test", frameio_link: "", moodboard_link: "", backup_disk: "Disk A", revision_count: 2, archived: false },
    { id: "PRJ-102", user_id: "USER-01", client_id: "MST-102", title: "Reklam Filmi Çekimi", description: "30 saniyelik marka tanıtım filmi set çekimleri.", status: "Tamamlandı", project_type: "Video Çekim", priority: "Orta", price: 75000, expense: 11700, net_profit: 63300, start_date: "2026-05-01", due_date: "2026-05-28", completed: true, drive_link: "https://drive.google.com/test", frameio_link: "https://frame.io/test", moodboard_link: "https://miro.com/test", backup_disk: "Disk B", revision_count: 1, archived: false },
    { id: "PRJ-103", user_id: "USER-01", client_id: "MST-101", title: "Sosyal Medya Yönetimi", description: "Aylık Instagram Reels video üretimi ve sosyal medya yönetimi.", status: "Ödeme Bekliyor", project_type: "Sosyal Medya Yönetimi", priority: "Düşük", price: 12000, expense: 0, net_profit: 12000, start_date: "2026-05-01", due_date: "2026-05-31", completed: false, drive_link: "", frameio_link: "", moodboard_link: "", backup_disk: null, revision_count: 0, archived: false },
    { id: "PRJ-104", user_id: "USER-01", client_id: "MST-103", title: "YouTube Video Editörlüğü", description: "Düzenli YouTube içerikleri kurgusu ve ses miksajı.", status: "Revize", project_type: "Video Kurgu", priority: "Yüksek", price: 32000, expense: 1200, net_profit: 30800, start_date: "2026-05-20", due_date: "2026-06-30", completed: false, drive_link: "", frameio_link: "", moodboard_link: "", backup_disk: null, revision_count: 3, archived: false }
  ],
  clients: [
    { id: "MST-101", user_id: "USER-01", name: "Ayşe Yılmaz", phone: "+90 532 111 22 33", email: "ayse@kreatif.com", instagram: "@aysekreatif", company: "Kreatif Ajans", notes: "Ödemelerde hassas, kurgu sürecini yakından izlemek istiyor." },
    { id: "MST-102", user_id: "USER-01", name: "Mehmet Demir", phone: "+90 533 444 55 66", email: "mehmet@apex.com", instagram: "@apexinsaat", company: "Apex İnşaat", notes: "Çekim bütçesi esnek, uzun vadeli işbirliği yapılabilir." },
    { id: "MST-103", user_id: "USER-01", name: "Can Öztürk", phone: "+90 542 777 88 99", email: "can@vortex.com", instagram: "@vortextech", company: "Vortex Tech", notes: "Teknoloji dikeyinde yeni girişim." }
  ],
  transactions: [
    { id: "TX-101", user_id: "USER-01", project_id: "PRJ-101", type: "Gelir", category: "Video Prodüksiyon", amount: 15000, note: "Video Prodüksiyon peşinatı", created_at: "2026-05-10T12:00:00.000Z", archived: false },
    { id: "TX-102", user_id: "USER-01", project_id: "PRJ-102", type: "Gelir", category: "Video Çekim", amount: 40000, note: "Çekim avansi", created_at: "2026-05-02T10:00:00.000Z", archived: false },
    { id: "TX-103", user_id: "USER-01", project_id: "PRJ-102", type: "Gider", category: "Ekipman Kiralama/Satın Alma", amount: 8500, note: "Kamera ve işık kiralama", created_at: "2026-05-11T16:00:00.000Z", archived: false },
    { id: "TX-104", user_id: "USER-01", project_id: "PRJ-102", type: "Gider", category: "Yemek & İkram", amount: 3200, note: "Set ekibi yemek gideri", created_at: "2026-05-12T13:00:00.000Z", archived: false },
    { id: "TX-105", user_id: "USER-01", project_id: "PRJ-102", type: "Gelir", category: "Video Çekim", amount: 35000, note: "Kalan ödeme tahsilati", created_at: "2026-05-28T17:00:00.000Z", archived: false },
    { id: "TX-106", user_id: "USER-01", project_id: "PRJ-104", type: "Gelir", category: "Video Kurgu", amount: 10000, note: "Video Kurgu ilk taksit", created_at: "2026-05-20T09:30:00.000Z", archived: false },
    { id: "TX-107", user_id: "USER-01", project_id: null, type: "Gider", category: "Yazilim Abonelikleri (Adobe/Frame.io vb.)", amount: 1200, note: "Premiere ve Frame.io Lisansi (Genel)", created_at: "2026-05-15T11:00:00.000Z", archived: false }
  ],
  tasks: [
    { id: "TSK-101", project_id: "PRJ-101", title: "Senaryo Yazimi", completed: true, due_date: "2026-05-25" },
    { id: "TSK-102", project_id: "PRJ-101", title: "Video Kurgusu ve Grading", completed: false, due_date: "2026-06-05" },
    { id: "TSK-103", project_id: "PRJ-102", title: "Konsept Belirleme", completed: true, due_date: "2026-05-05" },
    { id: "TSK-104", project_id: "PRJ-102", title: "Set Çekimi", completed: true, due_date: "2026-05-12" },
    { id: "TSK-105", project_id: "PRJ-102", title: "Kaba Kurgu", completed: true, due_date: "2026-05-20" },
    { id: "TSK-106", project_id: "PRJ-102", title: "Color Grading & Mix", completed: true, due_date: "2026-05-25" }
  ],
  revisions: [
    { id: "REV-101", project_id: "PRJ-104", note: "Video giriş logosu hareketli hale getirilmeli." }
  ],
  calendar_events: [
    { id: "EV-101", user_id: "USER-01", project_id: "PRJ-101", title: "Tanitim Filmi Prodüksiyonu Başlangici", event_type: "Başlangiç", start_date: "2026-05-10T09:00:00Z", end_date: "2026-05-10T18:00:00Z" },
    { id: "EV-102", user_id: "USER-01", project_id: "PRJ-102", title: "Reklam Filmi Set Çekimi", event_type: "Çekim", start_date: "2026-05-12T08:00:00Z", end_date: "2026-05-12T20:00:00Z" },
    { id: "EV-103", user_id: "USER-01", project_id: "PRJ-102", title: "Reklam Filmi Teslimi", event_type: "Teslim", start_date: "2026-05-28T17:00:00Z", end_date: "2026-05-28T18:00:00Z" }
  ],
  notifications: [
    { id: "NT-101", user_id: "USER-01", title: "Yaklaşan Teslimat", body: "Tanitim Filmi Prodüksiyonu 6 gün içinde teslim edilmeli.", read: false, created_at: "2026-05-29T10:00:00Z" },
    { id: "NT-102", user_id: "USER-01", title: "Yeni Revizyon Notu", body: "YouTube Video Editörlüğü için yeni bir revizyon eklendi.", read: true, created_at: "2026-05-25T14:30:00Z" }
  ],
  proposals: [
    { id: "PRP-101", user_id: "USER-01", client_id: "MST-101", title: "Instagram Reels Üretim Paketi", project_idea: "Sosyal medya mecralari için 3 adet kısa dikey video çekimi ve kurgusu.", proposal_amount: 25000, status: "Onay Bekliyor", contact_date: "2026-05-12", project_type: "Sosyal Medya Yönetimi", created_at: "2026-05-12T10:00:00.000Z", archived: false },
    { id: "PRP-102", user_id: "USER-01", client_id: "MST-102", title: "Reklam Kampanyasi Prodüksiyonu", project_idea: "Markanın yeni lansmanı için 2 adet reklam filmi video prodüksiyonu.", proposal_amount: 35000, status: "Teklif Hazirlaniyor", contact_date: "2026-05-28", project_type: "Video Prodüksiyon", created_at: "2026-05-28T14:00:00.000Z", archived: false },
    { id: "PRP-103", user_id: "USER-01", client_id: "MST-103", title: "Etkinlik Video Çekimi", project_idea: "Teknoloji zirvesi 2 günlük etkinlik çekimi ve 3 dakikalık aftermovie kurgusu.", proposal_amount: 50000, status: "Onaylandi", contact_date: "2026-05-15", project_type: "Video Çekim", created_at: "2026-05-15T09:00:00.000Z", archived: false }
  ],
  equipment: [
    { id: "EQ-101", user_id: "USER-01", name: "Sony FX3 Camera Body", status: "Aktif", notes: "Ana A-Cam gövdesi" },
    { id: "EQ-102", user_id: "USER-01", name: "Aputure 300d II Light", status: "Aktif", notes: "Ana COB key light" },
    { id: "EQ-103", user_id: "USER-01", name: "DJI Ronin RS3 Pro Gimbal", status: "Aktif", notes: "Kamera stabilizasyon kiti" },
    { id: "EQ-104", user_id: "USER-01", name: "Sennheiser AVX Wireless Mic", status: "Aktif", notes: "Yaka mikrofonu seti" },
    { id: "EQ-105", user_id: "USER-01", name: "Sony FE 24-70mm f/2.8 GM II Lens", status: "Aktif", notes: "Genel amaçli zoom lens" }
  ],
  equipment_bookings: [
    { id: "EQB-101", user_id: "USER-01", project_id: "PRJ-101", equipment_id: "EQ-101", start_date: "2026-05-10", end_date: "2026-05-15" },
    { id: "EQB-102", user_id: "USER-01", project_id: "PRJ-101", equipment_id: "EQ-105", start_date: "2026-05-10", end_date: "2026-05-15" }
  ],
  gorevler: [
    {
      id: "GRV-101",
      user_id: "USER-01",
      proje_id: null,
      gorev_adi: "Şubat 2026 SM - Rol Vize",
      detay: "Şubat 2026 Sosyal Medya ve Schengen Rol Vizesi başvuru dosyası hazırlığı.",
      kategori: "Vize",
      sutun_durumu: "Yapılmayı Bekleyenler",
      planlanan_tarih: "2026-02-28",
      oncelik: "Yüksek",
      checklist: [],
      comments: [
        { id: "c1", user_name: "Yunus Emre Türkoğlu", text: "Bu kart Yapılmayı Bekleyenler listesine eklendi.", created_at: "2026-02-11T17:25:00Z" }
      ],
      created_at: "2026-02-11T17:25:00Z"
    },
    {
      id: "GRV-102",
      user_id: "USER-01",
      proje_id: null,
      gorev_adi: "Reels - Oğuz Yavuz",
      detay: "Oğuz Yavuz Reels çekim planı ve video editi.",
      kategori: "Sosyal Medya",
      sutun_durumu: "Yapılmayı Bekleyenler",
      planlanan_tarih: "2026-06-05",
      oncelik: "Orta",
      checklist: [
        { id: "chk-1", title: "Giriş hook kurgusu", completed: true },
        { id: "chk-2", title: "Renk düzenleme (Color Grading)", completed: true },
        { id: "chk-3", title: "Altyazı ekleme", completed: true },
        { id: "chk-4", title: "Ses miksajı ve SFX", completed: true },
        { id: "chk-5", title: "Kapak fotoğrafı tasarımı", completed: false }
      ],
      comments: [],
      created_at: "2026-05-31T09:00:00Z"
    },
    {
      id: "GRV-103",
      user_id: "USER-01",
      proje_id: null,
      gorev_adi: "Haftalık Plan",
      detay: "Genel haftalık yapılacaklar listesi.",
      kategori: "Kişisel / Rutin",
      sutun_durumu: "Yapılmayı Bekleyenler",
      planlanan_tarih: "2026-06-07",
      oncelik: "Düşük",
      checklist: [
        { id: "hp-1", title: "Ofis temizliği", completed: false },
        { id: "hp-2", title: "Fatura ödemeleri", completed: false },
        { id: "hp-3", title: "Yeni blog yazısı taslağı", completed: false },
        { id: "hp-4", title: "Müşteri maillerini yanıtla", completed: false },
        { id: "hp-5", title: "Spor rutini - 3 gün", completed: false },
        { id: "hp-6", title: "Yedeklemeleri kontrol et", completed: false },
        { id: "hp-7", title: "Haftalık ciro raporu çıkar", completed: false }
      ],
      comments: [],
      created_at: "2026-05-31T09:10:00Z"
    },
    {
      id: "GRV-104",
      user_id: "USER-01",
      proje_id: null,
      gorev_adi: "After Effects ile Hareketli Grafik Tasarımı",
      detay: "Tanıtım videosu için hareketli grafik ve logo animasyonu.",
      kategori: "Prodüksiyon",
      sutun_durumu: "Yapılmayı Bekleyenler",
      planlanan_tarih: "2026-06-12",
      oncelik: "Yüksek",
      checklist: [
        { id: "ae-1", title: "Logo vektörizasyon", completed: true },
        { id: "ae-2", title: "Intro animasyon taslağı", completed: true },
        { id: "ae-3", title: "Geçiş efektleri tasarımı", completed: false },
        { id: "ae-4", title: "Renk paleti uyarlaması", completed: false },
        { id: "ae-5", title: "Lower third tasarımları", completed: false },
        { id: "ae-6", title: "Ses senkronizasyonu", completed: false },
        { id: "ae-7", title: "Render optimizasyonu", completed: false },
        { id: "ae-8", title: "Müşteri revizyonu 1", completed: false },
        { id: "ae-9", title: "Render final v1", completed: false },
        { id: "ae-10", title: "Müşteri revizyonu 2", completed: false },
        { id: "ae-11", title: "Masaüstü yedekleme", completed: false },
        { id: "ae-12", title: "Drive yüklemesi", completed: false },
        { id: "ae-13", title: "Müşteriye link gönderimi", completed: false },
        { id: "ae-14", title: "Arşivleme", completed: false }
      ],
      comments: [],
      created_at: "2026-05-31T09:20:00Z"
    },
    {
      id: "GRV-105",
      user_id: "USER-01",
      proje_id: null,
      gorev_adi: "İşini İyi Yap!",
      detay: "Yaptığın her işi en yüksek standartta tamamla.",
      kategori: "Kişisel / Rutin",
      sutun_durumu: "Yapılmayı Bekleyenler",
      planlanan_tarih: "2026-06-30",
      oncelik: "Yüksek",
      checklist: [],
      comments: [],
      created_at: "2026-05-31T09:30:00Z"
    },
    {
      id: "GRV-106",
      user_id: "USER-01",
      proje_id: null,
      gorev_adi: "Kitap Okuma Listem",
      detay: "Yıllık kitap okuma listem.",
      kategori: "Kişisel / Rutin",
      sutun_durumu: "Yapılmayı Bekleyenler",
      planlanan_tarih: "2026-12-31",
      oncelik: "Düşük",
      checklist: [
        { id: "bk-1", title: "Dune", completed: true },
        { id: "bk-2", title: "Sapiens", completed: true },
        { id: "bk-3", title: "1984", completed: true },
        { id: "bk-4", title: "Fahrenheit 451", completed: true },
        { id: "bk-5", title: "Kürk Mantolu Madonna", completed: true },
        { id: "bk-6", title: "Cesur Yeni Dünya", completed: true },
        { id: "bk-7", title: "Simyacı", completed: true },
        { id: "bk-8", title: "Devlet", completed: true },
        { id: "bk-9", title: "Suç ve Ceza", completed: true },
        { id: "bk-10", title: "Nutuk", completed: true },
        { id: "bk-11", title: "Kırmızı Saçlı Kadın", completed: true },
        { id: "bk-12", title: "Martin Eden", completed: true },
        { id: "bk-13", title: "Böyle Söyledi Zerdüşt", completed: true },
        { id: "bk-14", title: "Sermaye", completed: true },
        { id: "bk-15", title: "Körlük", completed: true },
        { id: "bk-16", title: "Yabancı", completed: true },
        { id: "bk-17", title: "Tutunamayanlar", completed: false },
        { id: "bk-18", title: "Saatleri Ayarlama Enstitüsü", completed: false },
        { id: "bk-19", title: "Amok Koşucusu", completed: false },
        { id: "bk-20", title: "Savaş ve Barış", completed: false },
        { id: "bk-21", title: "Karamazov Kardeşler", completed: false },
        { id: "bk-22", title: "Denemeler", completed: false },
        { id: "bk-23", title: "Puslu Kıtalar Atlası", completed: false },
        { id: "bk-24", title: "Aşk-ı Memnu", completed: false },
        { id: "bk-25", title: "Mai ve Siyah", completed: false }
      ],
      comments: [],
      created_at: "2026-05-31T09:40:00Z"
    },
    {
      id: "GRV-107",
      user_id: "USER-01",
      proje_id: null,
      gorev_adi: "Gisan Shipyard",
      detay: "Gisan Tersanesi tanıtım videosu hazırlık görevleri.",
      kategori: "Prodüksiyon",
      sutun_durumu: "Yapılmayı Bekleyenler",
      planlanan_tarih: "2026-06-20",
      oncelik: "Orta",
      checklist: [
        { id: "gs-1", title: "Tersane drone çekim izinleri", completed: false },
        { id: "gs-2", title: "İş sağlığı güvenliği eğitimi", completed: false },
        { id: "gs-3", title: "Çekim takvimi onaylatma", completed: false },
        { id: "gs-4", title: "Röportaj sorularını gönder", completed: false },
        { id: "gs-5", title: "Ekipman listesini check et", completed: false },
        { id: "gs-6", title: "Ses kayıt cihazları kontrolü", completed: false },
        { id: "gs-7", title: "Müşteri brifingi v2", completed: false }
      ],
      comments: [],
      created_at: "2026-05-31T09:50:00Z"
    },
    {
      id: "GRV-108",
      user_id: "USER-01",
      proje_id: null,
      gorev_adi: "Gemi ve Ücretler - Gisan",
      detay: "Gisan gemi çekimleri ve ücret tekliflendirme detayları.",
      kategori: "Prodüksiyon",
      sutun_durumu: "Yapılmayı Bekleyenler",
      planlanan_tarih: "2026-06-25",
      oncelik: "Yüksek",
      checklist: [
        { id: "gsu-1", title: "Sözleşme taslağı", completed: true },
        { id: "gsu-2", title: "Peşinat tahsilatı", completed: true },
        { id: "gsu-3", title: "Fatura kesimi", completed: true },
        { id: "gsu-4", title: "Gemi yanaşma takvimi takibi", completed: true },
        { id: "gsu-5", title: "Kuru havuz çekim hazırlığı", completed: true },
        { id: "gsu-6", title: "Mühendislik ekibiyle görüşme", completed: true },
        { id: "gsu-7", title: "Ekip yemek ayarlaması", completed: true },
        { id: "gsu-8", title: "Ulaşım / Konaklama rezervasyonu", completed: true },
        { id: "gsu-9", title: "Hava durumu raporu kontrolü", completed: false },
        { id: "gsu-10", title: "Işık ekipmanları listesi", completed: false },
        { id: "gsu-11", title: "Yedek bataryalar şarjı", completed: false },
        { id: "gsu-12", title: "Kartları formatla", completed: false },
        { id: "gsu-13", title: "Gimbal kalibrasyonu", completed: false },
        { id: "gsu-14", title: "Yaka telsiz frekans testi", completed: false },
        { id: "gsu-15", title: "Senaryo çıktısı alma", completed: false },
        { id: "gsu-16", title: "İş kıyafetleri hazırlığı", completed: false },
        { id: "gsu-17", title: "Müşteri imza süreci", completed: false }
      ],
      comments: [],
      created_at: "2026-05-31T09:55:00Z"
    },
    {
      id: "GRV-109",
      user_id: "USER-01",
      proje_id: null,
      gorev_adi: "İhtiyaç Listesi",
      detay: "Ofis ve prodüksiyon genel ihtiyaçları.",
      kategori: "Kişisel / Rutin",
      sutun_durumu: "Yapılmayı Bekleyenler",
      planlanan_tarih: "2026-06-15",
      oncelik: "Düşük",
      checklist: [
        { id: "il-1", title: "Type-C çoklayıcı", completed: true },
        { id: "il-2", title: "Lens temizleme solüsyonu", completed: true },
        { id: "il-3", title: "SSD disk - 2TB", completed: false },
        { id: "il-4", title: "HDMI kablo - 5m", completed: false },
        { id: "il-5", title: "AA şarj edilebilir piller", completed: false },
        { id: "il-6", title: "Ofis kahvesi", completed: false },
        { id: "il-7", title: "Filtre kağıdı", completed: false },
        { id: "il-8", title: "Beyaz tahta kalemleri", completed: false }
      ],
      comments: [],
      created_at: "2026-05-31T09:59:00Z"
    },
    {
      id: "GRV-110",
      user_id: "USER-01",
      proje_id: null,
      gorev_adi: "Luise Borchard - Gisan Shipyard",
      detay: "Luise Borchard gemi çekim hazırlık planı.",
      kategori: "Prodüksiyon",
      sutun_durumu: "Yapılacaklar",
      planlanan_tarih: "2026-06-18",
      oncelik: "Orta",
      checklist: [
        { id: "lb-1", title: "Gemi yanaşma koordinasyonu", completed: false },
        { id: "lb-2", title: "Drone izinleri kontrolü", completed: false },
        { id: "lb-3", title: "Ekipman listesi kontrolü", completed: false },
        { id: "lb-4", title: "İş güvenliği baret yelek temini", completed: false },
        { id: "lb-5", title: "Hava durumu kontrolü", completed: false },
        { id: "lb-6", title: "Müşteri ile çekim saati teyidi", completed: false },
        { id: "lb-7", title: "Yedek disklerin hazırlanması", completed: false }
      ],
      comments: [],
      created_at: "2026-05-31T10:00:00Z"
    },
    {
      id: "GRV-111",
      user_id: "USER-01",
      proje_id: null,
      gorev_adi: "Volaris 54 - Gisan Shipyard",
      detay: "Volaris 54 gemisi çekim planlaması.",
      kategori: "Prodüksiyon",
      sutun_durumu: "Yapılacaklar",
      planlanan_tarih: "2026-06-22",
      oncelik: "Orta",
      checklist: [
        { id: "v54-1", title: "Kaptan ile iletişim kur", completed: false },
        { id: "v54-2", title: "Çekim açılarının belirlenmesi", completed: false },
        { id: "v54-3", title: "Gimbal dengesi testi", completed: false },
        { id: "v54-4", title: "Yaka mikrofonu frekans kontrolü", completed: false },
        { id: "v54-5", title: "Güverte güvenlik yönergeleri", completed: false },
        { id: "v54-6", title: "Giriş kartlarının çıkartılması", completed: false },
        { id: "v54-7", title: "Ekip oteli rezervasyonu", completed: false }
      ],
      comments: [],
      created_at: "2026-05-31T10:10:00Z"
    },
    {
      id: "GRV-112",
      user_id: "USER-01",
      proje_id: null,
      gorev_adi: "Video Birleştirme - Gisan Shipyard",
      detay: "Çekilen ham görüntülerin birleştirilmesi ve kurgu taslağı.",
      kategori: "Prodüksiyon",
      sutun_durumu: "Yapılacaklar",
      planlanan_tarih: "2026-06-29",
      oncelik: "Orta",
      checklist: [],
      comments: [],
      created_at: "2026-05-31T10:15:00Z"
    },
    {
      id: "GRV-113",
      user_id: "USER-01",
      proje_id: null,
      gorev_adi: "Ebru - Gisan Shipyard",
      detay: "Ebru gemi çekimi ve montaj işlerinin tamamlanması.",
      kategori: "Prodüksiyon",
      sutun_durumu: "Tamamlandı",
      planlanan_tarih: "2026-05-28",
      oncelik: "Yüksek",
      checklist: [
        { id: "eb-1", title: "Kaba kurgu", completed: true },
        { id: "eb-2", title: "Ses miksajı", completed: true },
        { id: "eb-3", title: "Color grading", completed: true },
        { id: "eb-4", title: "Müşteri onayı v1", completed: true },
        { id: "eb-5", title: "Revizyonların yapılması", completed: true },
        { id: "eb-6", title: "Drive'a yükleme", completed: true },
        { id: "eb-7", title: "Teslimat maili gönderildi", completed: true }
      ],
      comments: [],
      created_at: "2026-05-20T09:00:00Z"
    }
  ]
};

// LocalStorage Helper Metotları
const getLocalDB = () => {
  if (typeof window === "undefined") return INITIAL_MOCK_DATA;
  const db = localStorage.getItem("freelancer_os_db");
  if (!db) {
    localStorage.setItem("freelancer_os_db", JSON.stringify(INITIAL_MOCK_DATA));
    return INITIAL_MOCK_DATA;
  }
  const parsed = JSON.parse(db);
  // Yeni eklenen tabloların/alanların yerel veritabanında olduğundan emin ol
  if (!parsed.equipment) parsed.equipment = INITIAL_MOCK_DATA.equipment;
  if (!parsed.equipment_bookings) parsed.equipment_bookings = INITIAL_MOCK_DATA.equipment_bookings;
  if (!parsed.proposals) parsed.proposals = INITIAL_MOCK_DATA.proposals;
  if (!parsed.gorevler) parsed.gorevler = INITIAL_MOCK_DATA.gorevler;
  parsed.projects = parsed.projects.map((p: any) => ({
    ...p,
    backup_disk: p.backup_disk !== undefined ? p.backup_disk : null,
    revision_count: p.revision_count !== undefined ? p.revision_count : 0,
    archived: p.archived !== undefined ? p.archived : false
  }));
  parsed.proposals = (parsed.proposals || []).map((pr: any) => ({
    ...pr,
    archived: pr.archived !== undefined ? pr.archived : false
  }));
  parsed.transactions = (parsed.transactions || []).map((t: any) => ({
    ...t,
    archived: t.archived !== undefined ? t.archived : false
  }));
  return parsed;
};

const saveLocalDB = (db: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("freelancer_os_db", JSON.stringify(db));
  }
};

// Aktif Supabase Kullanıcı ID'sini Çek
const getUserId = async () => {
  if (isDemoMode()) return "USER-01";
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return user.id;
};

const getUserIdOrThrow = async () => {
  const uid = await getUserId();
  if (!uid) throw new Error("Oturum açmış kullanıcı bulunamadı.");
  return uid;
};

// =========================================================================
// API METOTLARI
// =========================================================================

// A. MÜŞTERİ (CLIENTS) CRUD
export const getClients = async (): Promise<Client[]> => {
  if (isDemoMode()) {
    return getLocalDB().clients;
  }
  const uid = await getUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const addClient = async (client: Omit<Client, 'id' | 'user_id' | 'created_at'>): Promise<Client> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    const newClient: Client = {
      ...client,
      id: `MST-${Date.now()}`,
      user_id: "USER-01",
      created_at: new Date().toISOString()
    };
    db.clients.push(newClient);
    saveLocalDB(db);
    return newClient;
  }
  const uid = await getUserIdOrThrow();
  // Strip any stale id/user_id/created_at that may come from form data
  const { id: _id, user_id: _uid, created_at: _cat, ...cleanClient } = client as any;
  const { data, error } = await supabase
    .from('clients')
    .insert([{ ...cleanClient, user_id: uid }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateClient = async (id: string, client: Partial<Client>): Promise<Client> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    let updated: any = null;
    db.clients = db.clients.map((c: any) => {
      if (c.id === id) {
        updated = { ...c, ...client };
        return updated;
      }
      return c;
    });
    saveLocalDB(db);
    return updated;
  }
  // Strip readonly fields before update
  const { id: _id, user_id: _uid, created_at: _cat, ...cleanClient } = client as any;
  const { data, error } = await supabase
    .from('clients')
    .update(cleanClient)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteClient = async (id: string): Promise<void> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    db.clients = db.clients.filter((c: any) => c.id !== id);
    saveLocalDB(db);
    return;
  }
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);
  if (error) throw error;
};


// B. PROJE (PROJECTS) CRUD
export const getProjects = async (): Promise<Project[]> => {
  if (isDemoMode()) {
    return getLocalDB().projects;
  }
  const uid = await getUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const addProject = async (project: Omit<Project, 'id' | 'user_id' | 'created_at'>): Promise<Project> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    const newPrj: Project = {
      ...project,
      id: `PRJ-${Date.now()}`,
      user_id: "USER-01",
      price: Number(project.price || 0),
      expense: Number(project.expense || 0),
      net_profit: Number(project.price || 0) - Number(project.expense || 0),
      created_at: new Date().toISOString()
    };
    db.projects.push(newPrj);
    
    // Proje başlangıç ve bitişini otomatik olarak takvime ekle
    if (newPrj.start_date) {
      db.calendar_events.push({
        id: `EV-${Date.now()}-1`,
        user_id: "USER-01",
        project_id: newPrj.id,
        title: `${newPrj.title} Başlangıcı`,
        event_type: "Başlangıç",
        start_date: `${newPrj.start_date}T09:00:00Z`,
        end_date: `${newPrj.start_date}T18:00:00Z`
      });
    }
    if (newPrj.due_date) {
      db.calendar_events.push({
        id: `EV-${Date.now()}-2`,
        user_id: "USER-01",
        project_id: newPrj.id,
        title: `${newPrj.title} Teslimi`,
        event_type: "Teslim",
        start_date: `${newPrj.due_date}T17:00:00Z`,
        end_date: `${newPrj.due_date}T18:00:00Z`
      });
    }

    saveLocalDB(db);
    return newPrj;
  }
  const uid = await getUserIdOrThrow();
  // Strip readonly fields + convert empty string FKs to null
  const { id: _id, user_id: _uid, created_at: _cat, net_profit: _np, ...cleanProject } = project as any;
  const price = Number(cleanProject.price || 0);
  const expense = Number(cleanProject.expense || 0);
  const payload = {
    ...cleanProject,
    user_id: uid,
    price,
    expense,
    net_profit: price - expense,
    client_id: cleanProject.client_id || null,
    start_date: cleanProject.start_date || null,
    due_date: cleanProject.due_date || null,
    drive_link: cleanProject.drive_link || null,
    frameio_link: cleanProject.frameio_link || null,
    moodboard_link: cleanProject.moodboard_link || null,
    backup_disk: cleanProject.backup_disk || null,
  };
  const { data, error } = await supabase
    .from('projects')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;

  // Projeyi takvime de ekle (başlangıç + teslim tarihleri)
  if (data) {
    const calEvents = [];
    if (payload.start_date) {
      calEvents.push({
        user_id: uid,
        project_id: data.id,
        title: `${payload.title} Başlangıcı`,
        event_type: 'Başlangıç',
        start_date: `${payload.start_date}T09:00:00Z`,
        end_date: `${payload.start_date}T18:00:00Z`
      });
    }
    if (payload.due_date) {
      calEvents.push({
        user_id: uid,
        project_id: data.id,
        title: `${payload.title} Teslimi`,
        event_type: 'Teslim',
        start_date: `${payload.due_date}T17:00:00Z`,
        end_date: `${payload.due_date}T18:00:00Z`
      });
    }
    if (calEvents.length > 0) {
      try {
        await supabase.from('calendar_events').insert(calEvents);
      } catch (_) { /* Takvim hatası proje kaydını engellemesin */ }
    }
  }

  return data;
};

export const updateProject = async (id: string, project: Partial<Project>): Promise<Project> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    let updated: any = null;
    db.projects = db.projects.map((p: any) => {
      if (p.id === id) {
        const temp = { ...p, ...project };
        temp.price = Number(temp.price || 0);
        temp.expense = Number(temp.expense || 0);
        temp.net_profit = temp.price - temp.expense;
        updated = temp;
        return temp;
      }
      return p;
    });
    saveLocalDB(db);
    return updated;
  }
  
  // Strip readonly fields
  const { id: _id, user_id: _uid, created_at: _cat, ...cleanProject } = project as any;
  
  // Recalculate net_profit if price or expense changed
  let updatePayload = { ...cleanProject };
  if (cleanProject.price !== undefined || cleanProject.expense !== undefined) {
    const { data: current } = await supabase.from('projects').select('price, expense').eq('id', id).single();
    if (current) {
      const price = cleanProject.price !== undefined ? Number(cleanProject.price) : Number(current.price);
      const expense = cleanProject.expense !== undefined ? Number(cleanProject.expense) : Number(current.expense);
      updatePayload.net_profit = price - expense;
    }
  }
  // Convert empty string FKs to null
  if ('client_id' in updatePayload) updatePayload.client_id = updatePayload.client_id || null;
  if ('start_date' in updatePayload) updatePayload.start_date = updatePayload.start_date || null;
  if ('due_date' in updatePayload) updatePayload.due_date = updatePayload.due_date || null;
  if ('drive_link' in updatePayload) updatePayload.drive_link = updatePayload.drive_link || null;
  if ('frameio_link' in updatePayload) updatePayload.frameio_link = updatePayload.frameio_link || null;
  if ('moodboard_link' in updatePayload) updatePayload.moodboard_link = updatePayload.moodboard_link || null;
  if ('backup_disk' in updatePayload) updatePayload.backup_disk = updatePayload.backup_disk || null;

  const { data, error } = await supabase
    .from('projects')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteProject = async (id: string): Promise<void> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    db.projects = db.projects.filter((p: any) => p.id !== id);
    db.tasks = db.tasks.filter((t: any) => t.project_id !== id);
    db.revisions = db.revisions.filter((r: any) => r.project_id !== id);
    db.calendar_events = db.calendar_events.filter((e: any) => e.project_id !== id);
    saveLocalDB(db);
    return;
  }
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  if (error) throw error;
};


// C. GÖREVLER (TASKS) CRUD
export const getTasks = async (projectId: string): Promise<Task[]> => {
  if (isDemoMode()) {
    return getLocalDB().tasks.filter((t: any) => t.project_id === projectId);
  }
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

export const addTask = async (task: Omit<Task, 'id' | 'created_at'>): Promise<Task> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    const newTask: Task = {
      ...task,
      id: `TSK-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    db.tasks.push(newTask);
    saveLocalDB(db);
    return newTask;
  }
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const toggleTask = async (id: string, completed: boolean): Promise<Task> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    let updated: any = null;
    db.tasks = db.tasks.map((t: any) => {
      if (t.id === id) {
        updated = { ...t, completed };
        return updated;
      }
      return t;
    });
    saveLocalDB(db);
    return updated;
  }
  const { data, error } = await supabase
    .from('tasks')
    .update({ completed })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteTask = async (id: string): Promise<void> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    db.tasks = db.tasks.filter((t: any) => t.id !== id);
    saveLocalDB(db);
    return;
  }
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  if (error) throw error;
};


// D. REVİZYON NOTLARI (REVISIONS) CRUD
export const getRevisions = async (projectId: string): Promise<Revision[]> => {
  if (isDemoMode()) {
    return getLocalDB().revisions.filter((r: any) => r.project_id === projectId);
  }
  const { data, error } = await supabase
    .from('revisions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const addRevision = async (revision: Omit<Revision, 'id' | 'created_at'>): Promise<Revision> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    const newRev: Revision = {
      ...revision,
      id: `REV-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    db.revisions.push(newRev);
    saveLocalDB(db);
    return newRev;
  }
  const { data, error } = await supabase
    .from('revisions')
    .insert([revision])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteRevision = async (id: string): Promise<void> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    db.revisions = db.revisions.filter((r: any) => r.id !== id);
    saveLocalDB(db);
    return;
  }
  const { error } = await supabase
    .from('revisions')
    .delete()
    .eq('id', id);
  if (error) throw error;
};


// E. FİNANSAL İŞLEMLER (TRANSACTIONS) CRUD
export const getTransactions = async (): Promise<Transaction[]> => {
  if (isDemoMode()) {
    return getLocalDB().transactions;
  }
  const uid = await getUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>): Promise<Transaction> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    const newTx: Transaction = {
      ...transaction,
      id: `TX-${Date.now()}`,
      user_id: "USER-01",
      created_at: new Date().toISOString()
    };
    db.transactions.push(newTx);
    
    // Proje bazlı finans güncellemeleri
    if (newTx.project_id) {
      db.projects = db.projects.map((p: any) => {
        if (p.id === newTx.project_id) {
          if (newTx.type === "Gelir") {
            // (Opsiyonel ciro takibi için)
          } else {
            // Masrafları arttır
            p.expense = Number(p.expense || 0) + newTx.amount;
            p.net_profit = Number(p.price || 0) - p.expense;
          }
        }
        return p;
      });
    }

    saveLocalDB(db);
    return newTx;
  }
  const uid = await getUserIdOrThrow();
  // Strip readonly fields + convert empty string FKs to null
  const { id: _id, user_id: _uid, created_at: _cat, ...cleanTx } = transaction as any;
  const payload = {
    ...cleanTx,
    user_id: uid,
    amount: Number(cleanTx.amount || 0),
    // Convert empty string project_id to null (UUID foreign key)
    project_id: cleanTx.project_id || null,
  };
  const { data, error } = await supabase
    .from('transactions')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;

  // Gider eklendiyse, projenin masrafını da güncelle
  if (payload.type === 'Gider' && payload.project_id) {
    const { data: currentPrj } = await supabase.from('projects').select('expense').eq('id', payload.project_id).single();
    if (currentPrj) {
      const newExpense = Number(currentPrj.expense || 0) + Number(payload.amount);
      await supabase.from('projects').update({ expense: newExpense }).eq('id', payload.project_id);
    }
  }

  return data;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    const tx = db.transactions.find((t: any) => t.id === id);
    db.transactions = db.transactions.filter((t: any) => t.id !== id);
    
    if (tx && tx.project_id && tx.type === "Gider") {
      db.projects = db.projects.map((p: any) => {
        if (p.id === tx.project_id) {
          p.expense = Math.max(0, Number(p.expense || 0) - tx.amount);
          p.net_profit = Number(p.price || 0) - p.expense;
        }
        return p;
      });
    }

    saveLocalDB(db);
    return;
  }
  
  // Gider siliniyorsa projedeki masrafı düş
  const { data: tx } = await supabase.from('transactions').select('project_id, amount, type').eq('id', id).single();
  if (tx && tx.type === 'Gider' && tx.project_id) {
    const { data: currentPrj } = await supabase.from('projects').select('expense').eq('id', tx.project_id).single();
    if (currentPrj) {
      const newExpense = Math.max(0, Number(currentPrj.expense || 0) - Number(tx.amount));
      await supabase.from('projects').update({ expense: newExpense }).eq('id', tx.project_id);
    }
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const updateTransaction = async (id: string, tx: Partial<Transaction>): Promise<Transaction> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    let updated = {} as Transaction;
    db.transactions = db.transactions.map((item: any) => {
      if (item.id === id) {
        updated = { ...item, ...tx };
        return updated;
      }
      return item;
    });
    saveLocalDB(db);
    return updated;
  }
  // Strip readonly fields before update
  const { id: _id, user_id: _uid, created_at: _cat, ...cleanTx } = tx as any;
  if ('project_id' in cleanTx) cleanTx.project_id = cleanTx.project_id || null;
  const { data, error } = await supabase
    .from('transactions')
    .update(cleanTx)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};


// F. BİLDİRİMLER (NOTIFICATIONS)
export const getNotifications = async (): Promise<Notification[]> => {
  if (isDemoMode()) {
    return getLocalDB().notifications;
  }
  const uid = await getUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    db.notifications = db.notifications.map((n: any) => {
      if (n.id === id) n.read = true;
      return n;
    });
    saveLocalDB(db);
    return;
  }
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) throw error;
};

// G. TAKVİM ETKİNLİKLERİ (CALENDAR EVENTS)
export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
  if (isDemoMode()) {
    return getLocalDB().calendar_events;
  }
  const uid = await getUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', uid);
  if (error) throw error;
  return data;
};

export const addCalendarEvent = async (event: Omit<CalendarEvent, 'id' | 'user_id'>): Promise<CalendarEvent> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    const newEv: CalendarEvent = {
      ...event,
      id: `EV-${Date.now()}`,
      user_id: "USER-01"
    };
    db.calendar_events.push(newEv);
    saveLocalDB(db);
    return newEv;
  }
  const uid = await getUserIdOrThrow();
  // Strip readonly fields + convert empty string FKs to null
  const { id: _id, user_id: _uid, ...cleanEvent } = event as any;
  const payload = {
    ...cleanEvent,
    user_id: uid,
    project_id: cleanEvent.project_id || null,
  };
  const { data, error } = await supabase
    .from('calendar_events')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteCalendarEvent = async (id: string): Promise<void> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    db.calendar_events = db.calendar_events.filter((e: any) => e.id !== id);
    saveLocalDB(db);
    return;
  }
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// H. TEKLİFLER / CRM (PROPOSALS) CRUD
const spawnProjectFromProposal = async (proposal: Proposal) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  const dueDateStr = dueDate.toISOString().split('T')[0];
  
  await addProject({
    client_id: proposal.client_id || null,
    title: proposal.title,
    description: proposal.project_idea || '',
    status: 'Yeni Talep',
    project_type: proposal.project_type || 'Diğer',
    priority: 'Orta',
    price: Number(proposal.proposal_amount || 0),
    expense: 0,
    net_profit: Number(proposal.proposal_amount || 0),
    start_date: todayStr,
    due_date: dueDateStr,
    completed: false,
    drive_link: '',
    frameio_link: '',
    moodboard_link: '',
    backup_disk: null,
    revision_count: 0
  });
};

export const getProposals = async (): Promise<Proposal[]> => {
  if (isDemoMode()) {
    return getLocalDB().proposals || [];
  }
  const uid = await getUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const addProposal = async (proposal: Omit<Proposal, 'id' | 'user_id' | 'created_at'>): Promise<Proposal> => {
  let createdProposal = {} as Proposal;
  if (isDemoMode()) {
    const db = getLocalDB();
    if (!db.proposals) db.proposals = [];
    createdProposal = {
      ...proposal,
      id: `PRP-${Date.now()}`,
      user_id: "USER-01",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.proposals.push(createdProposal);
    saveLocalDB(db);
  } else {
    const uid = await getUserIdOrThrow();
    // Strip readonly fields + convert empty string FKs to null
    const { id: _id, user_id: _uid, created_at: _cat, updated_at: _uat, ...cleanProposal } = proposal as any;
    const payload = {
      ...cleanProposal,
      user_id: uid,
      client_id: cleanProposal.client_id || null,
      proposal_amount: Number(cleanProposal.proposal_amount || 0),
    };
    const { data, error } = await supabase
      .from('proposals')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    createdProposal = data;
  }

  // Teklif durumu 'Onaylandı' ise otomatik olarak projeye dönüştür
  if (createdProposal.status === 'Onaylandı') {
    try {
      await spawnProjectFromProposal(createdProposal);
    } catch (e) {
      console.error("Failed to spawn project from proposal:", e);
    }
  }

  return createdProposal;
};

export const updateProposal = async (id: string, proposalUpdate: Partial<Proposal>): Promise<Proposal> => {
  let updatedProposal = {} as Proposal;
  let previousStatus: string | null = null;

  if (isDemoMode()) {
    const db = getLocalDB();
    if (!db.proposals) db.proposals = [];
    
    const existing = db.proposals.find((p: any) => p.id === id);
    if (!existing) throw new Error("Teklif bulunamadı.");
    previousStatus = existing.status;

    db.proposals = db.proposals.map((p: any) => {
      if (p.id === id) {
        const temp = { ...p, ...proposalUpdate, updated_at: new Date().toISOString() };
        updatedProposal = temp;
        return temp;
      }
      return p;
    });
    saveLocalDB(db);
  } else {
    const { data: currentProposal } = await supabase
      .from('proposals')
      .select('status')
      .eq('id', id)
      .single();
    if (currentProposal) {
      previousStatus = currentProposal.status;
    }

    // Strip readonly fields before update
    const { id: _id, user_id: _uid, created_at: _cat, ...cleanUpdate } = proposalUpdate as any;
    if ('client_id' in cleanUpdate) cleanUpdate.client_id = cleanUpdate.client_id || null;
    const { data, error } = await supabase
      .from('proposals')
      .update({ ...cleanUpdate, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    updatedProposal = data;
  }

  // Teklif durumu 'Onaylandı' olarak değiştiyse otomatik olarak projeye dönüştür
  if (updatedProposal.status === 'Onaylandı' && previousStatus !== 'Onaylandı') {
    try {
      await spawnProjectFromProposal(updatedProposal);
    } catch (e) {
      console.error("Failed to spawn project from proposal:", e);
    }
  }

  return updatedProposal;
};

export const deleteProposal = async (id: string): Promise<void> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    if (db.proposals) {
      db.proposals = db.proposals.filter((p: any) => p.id !== id);
      saveLocalDB(db);
    }
    return;
  }
  const { error } = await supabase
    .from('proposals')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// G. EKİPMAN (EQUIPMENT) CRUD
export const getEquipment = async (): Promise<Equipment[]> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    if (!db.equipment) db.equipment = INITIAL_MOCK_DATA.equipment;
    return db.equipment;
  }
  const uid = await getUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const addEquipment = async (eq: Omit<Equipment, 'id' | 'user_id' | 'created_at'>): Promise<Equipment> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    if (!db.equipment) db.equipment = INITIAL_MOCK_DATA.equipment;
    const newEq: Equipment = {
      ...eq,
      id: `EQ-${Date.now()}`,
      user_id: "USER-01",
      created_at: new Date().toISOString()
    };
    db.equipment.push(newEq);
    saveLocalDB(db);
    return newEq;
  }
  const uid = await getUserIdOrThrow();
  // Strip readonly fields
  const { id: _id, user_id: _uid, created_at: _cat, ...cleanEq } = eq as any;
  const { data, error } = await supabase
    .from('equipment')
    .insert([{ ...cleanEq, user_id: uid }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateEquipment = async (id: string, eq: Partial<Equipment>): Promise<Equipment> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    if (!db.equipment) db.equipment = INITIAL_MOCK_DATA.equipment;
    let updated = {} as Equipment;
    db.equipment = db.equipment.map((item: any) => {
      if (item.id === id) {
        updated = { ...item, ...eq };
        return updated;
      }
      return item;
    });
    saveLocalDB(db);
    return updated;
  }
  // Strip readonly fields before update
  const { id: _id, user_id: _uid, created_at: _cat, ...cleanEq } = eq as any;
  const { data, error } = await supabase
    .from('equipment')
    .update(cleanEq)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteEquipment = async (id: string): Promise<void> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    if (!db.equipment) db.equipment = INITIAL_MOCK_DATA.equipment;
    if (!db.equipment_bookings) db.equipment_bookings = INITIAL_MOCK_DATA.equipment_bookings;
    db.equipment = db.equipment.filter((item: any) => item.id !== id);
    db.equipment_bookings = db.equipment_bookings.filter((b: any) => b.equipment_id !== id);
    saveLocalDB(db);
    return;
  }
  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// H. EKİPMAN REZERVASYON (EQUIPMENT BOOKINGS) CRUD
export const getEquipmentBookings = async (): Promise<EquipmentBooking[]> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    if (!db.equipment_bookings) db.equipment_bookings = INITIAL_MOCK_DATA.equipment_bookings;
    return db.equipment_bookings;
  }
  const uid = await getUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from('equipment_bookings')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// Çakışma kontrolü fonksiyonu
export const checkEquipmentConflict = async (
  equipmentId: string,
  startDate: string,
  endDate: string,
  ignoreBookingId?: string
): Promise<EquipmentBooking | null> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    const bookings = db.equipment_bookings || [];
    const conflict = bookings.find((b: any) => {
      if (b.equipment_id !== equipmentId) return false;
      if (ignoreBookingId && b.id === ignoreBookingId) return false;
      // Overlap: S1 <= E2 && E1 >= S2
      return b.start_date <= endDate && b.end_date >= startDate;
    });
    return conflict || null;
  }
  
  const uid = await getUserId();
  if (!uid) return null;
  let query = supabase
    .from('equipment_bookings')
    .select('*')
    .eq('user_id', uid)
    .eq('equipment_id', equipmentId)
    .lte('start_date', endDate)
    .gte('end_date', startDate);
    
  if (ignoreBookingId) {
    query = query.neq('id', ignoreBookingId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
};

export const addEquipmentBooking = async (
  booking: Omit<EquipmentBooking, 'id' | 'user_id' | 'created_at'>
): Promise<EquipmentBooking> => {
  // Önce çakışma var mı kontrol et
  const conflict = await checkEquipmentConflict(booking.equipment_id, booking.start_date, booking.end_date);
  if (conflict) {
    throw new Error(`Çakışma Tespit Edildi: Bu ekipman belirtilen tarihlerde başka bir projeye rezerve edilmiştir.`);
  }

  if (isDemoMode()) {
    const db = getLocalDB();
    if (!db.equipment_bookings) db.equipment_bookings = INITIAL_MOCK_DATA.equipment_bookings;
    const newBooking: EquipmentBooking = {
      ...booking,
      id: `EQB-${Date.now()}`,
      user_id: "USER-01",
      created_at: new Date().toISOString()
    };
    db.equipment_bookings.push(newBooking);
    saveLocalDB(db);
    return newBooking;
  }
  
  const uid = await getUserIdOrThrow();
  // Strip readonly fields + convert empty string FKs to null
  const { id: _id, user_id: _uid, created_at: _cat, ...cleanBooking } = booking as any;
  const payload = {
    ...cleanBooking,
    user_id: uid,
    project_id: cleanBooking.project_id || null,
    equipment_id: cleanBooking.equipment_id || null,
  };
  const { data, error } = await supabase
    .from('equipment_bookings')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
};
export const deleteEquipmentBooking = async (id: string): Promise<void> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    if (!db.equipment_bookings) db.equipment_bookings = INITIAL_MOCK_DATA.equipment_bookings;
    db.equipment_bookings = db.equipment_bookings.filter((b: any) => b.id !== id);
    saveLocalDB(db);
    return;
  }
  const { error } = await supabase
    .from('equipment_bookings')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// I. GÜNDELİK PLAN VE MİKRO GÖREVLER (GOREVLER) CRUD
export const getGorevler = async (projectId?: string | null): Promise<Gorev[]> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    if (!db.gorevler) db.gorevler = INITIAL_MOCK_DATA.gorevler;
    if (projectId !== undefined) {
      return db.gorevler.filter((g: any) => g.proje_id === projectId);
    }
    return db.gorevler;
  }
  
  const uid = await getUserId();
  if (!uid) return [];
  let query = supabase.from('gorevler').select('*').eq('user_id', uid);
  if (projectId !== undefined) {
    if (projectId === null) {
      query = query.is('proje_id', null);
    } else {
      query = query.eq('proje_id', projectId);
    }
  }
  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const addGorev = async (gorev: Omit<Gorev, 'id' | 'user_id' | 'created_at'>): Promise<Gorev> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    if (!db.gorevler) db.gorevler = INITIAL_MOCK_DATA.gorevler;
    const newGorev: Gorev = {
      ...gorev,
      id: `GRV-${Date.now()}`,
      user_id: "USER-01",
      created_at: new Date().toISOString()
    };
    db.gorevler.push(newGorev);
    // Demo modda da takvim etkinliği ekle
    if (newGorev.planlanan_tarih) {
      if (!db.calendar_events) db.calendar_events = [];
      db.calendar_events.push({
        id: `EV-GRV-${newGorev.id}`,
        user_id: "USER-01",
        title: newGorev.gorev_adi,
        event_type: "Görev",
        start_date: `${newGorev.planlanan_tarih}T09:00:00Z`,
        end_date: `${newGorev.planlanan_tarih}T10:00:00Z`,
        project_id: newGorev.proje_id || null
      });
    }
    saveLocalDB(db);
    return newGorev;
  }
  const uid = await getUserIdOrThrow();
  // Strip auto-generated / forbidden fields that shouldn't be sent on INSERT
  const { id: _id, user_id: _uid, created_at: _cat, ...cleanGorev } = gorev as any;
  const payload = {
    ...cleanGorev,
    user_id: uid,
    // Convert empty string proje_id to null (UUID foreign key can't be empty string)
    proje_id: cleanGorev.proje_id || null,
  };
  const { data, error } = await supabase
    .from('gorevler')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  
  // Görev eklenince takvimde de göster
  if (data && payload.planlanan_tarih) {
    try {
      await supabase.from('calendar_events').insert([{
        user_id: uid,
        title: payload.gorev_adi,
        event_type: 'Görev',
        start_date: `${payload.planlanan_tarih}T09:00:00Z`,
        end_date: `${payload.planlanan_tarih}T10:00:00Z`,
        project_id: payload.proje_id || null
      }]);
    } catch (_) { /* Takvim hatası görev kaydını engellemesin */ }
  }
  
  return data;
};

export const updateGorev = async (id: string, gorev: Partial<Gorev>): Promise<Gorev> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    if (!db.gorevler) db.gorevler = INITIAL_MOCK_DATA.gorevler;
    let updated: any = null;
    db.gorevler = db.gorevler.map((g: any) => {
      if (g.id === id) {
        updated = { ...g, ...gorev };
        return updated;
      }
      return g;
    });
    saveLocalDB(db);
    return updated;
  }
  // Strip forbidden fields from the update payload
  const { id: _id, user_id: _uid, created_at: _cat, ...cleanGorev } = gorev as any;
  const payload = {
    ...cleanGorev,
    // Convert empty string proje_id to null
    ...(cleanGorev.proje_id !== undefined ? { proje_id: cleanGorev.proje_id || null } : {}),
  };
  const { data, error } = await supabase
    .from('gorevler')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteGorev = async (id: string): Promise<void> => {
  if (isDemoMode()) {
    const db = getLocalDB();
    if (!db.gorevler) db.gorevler = INITIAL_MOCK_DATA.gorevler;
    db.gorevler = db.gorevler.filter((g: any) => g.id !== id);
    saveLocalDB(db);
    return;
  }
  const { error } = await supabase
    .from('gorevler')
    .delete()
    .eq('id', id);
  if (error) throw error;
};
