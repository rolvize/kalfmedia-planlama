export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  created_at?: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  company: string | null;
  notes: string | null;
  created_at?: string;
}

export interface Project {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  status: string; // 'Yeni Talep', 'Görüşme', 'Teklif Gönderildi', 'Onaylandı', 'Çekim Planlandı', 'Çekim Yapıldı', 'Kurgu Süreci', 'Revize', 'Teslim Edildi', 'Ödeme Bekliyor', 'Tamamlandı'
  project_type: string | null;
  priority: string | null; // 'Düşük', 'Orta', 'Yüksek'
  price: number;
  expense: number;
  net_profit: number;
  start_date: string | null;
  due_date: string | null;
  completed: boolean;
  drive_link: string | null;
  frameio_link: string | null;
  moodboard_link: string | null;
  backup_disk: string | null;
  revision_count: number;
  archived?: boolean;
  created_at?: string;
}

export interface Equipment {
  id: string;
  user_id: string;
  name: string;
  status: string; // 'Aktif' | 'Bakımda' | 'Pasif'
  notes: string | null;
  created_at?: string;
}

export interface EquipmentBooking {
  id: string;
  user_id: string;
  project_id: string;
  equipment_id: string;
  start_date: string; // date string YYYY-MM-DD
  end_date: string; // date string YYYY-MM-DD
  created_at?: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  created_at?: string;
}

export interface Revision {
  id: string;
  project_id: string;
  note: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  project_id: string | null;
  type: string; // 'Gelir' | 'Gider'
  category: string;
  amount: number;
  note: string | null;
  archived?: boolean;
  created_at?: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  event_type: string; // 'Çekim' | 'Teslim' | 'Toplantı' | 'Ödeme' | 'Revize'
  start_date: string;
  end_date: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at?: string;
}

export interface Proposal {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  project_idea: string | null;
  proposal_amount: number;
  status: string; // 'Teklif Hazırlanıyor', 'Teklif Gönderildi', 'Onay Bekliyor', 'Onaylandı', 'Reddedildi'
  contact_date: string;
  project_type: string | null;
  archived?: boolean;
  updated_at?: string;
  created_at?: string;
}

export interface GorevChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface GorevComment {
  id: string;
  user_name: string;
  text: string;
  created_at: string;
}

export interface Gorev {
  id: string;
  user_id: string;
  proje_id: string | null;
  gorev_adi: string;
  detay: string | null;
  kategori: "Prodüksiyon" | "Sosyal Medya" | "Vize" | "Kişisel / Rutin";
  sutun_durumu: "Yapılmayı Bekleyenler" | "Yapılacaklar" | "Yapılıyor" | "Test" | "Tamamlandı";
  planlanan_tarih: string; // date string YYYY-MM-DD
  oncelik: "Düşük" | "Orta" | "Yüksek";
  checklist?: GorevChecklistItem[];
  comments?: GorevComment[];
  created_at?: string;
}

