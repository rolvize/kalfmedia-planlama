"use client";

import React, { useState } from "react";
import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import {
  PenTool,
  Copy,
  Check,
  Trash2,
  Sparkles,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  FileText,
  Edit3,
  Zap,
} from "lucide-react";

interface Correction {
  id: string;
  original: string;
  corrected: string;
  type: "Yazım Hatası" | "Soru Eki" | "Noktalama" | "Büyük/Küçük Harf" | "Özel İsim";
}

interface Segment {
  id: string;
  text: string;
  isCorrection: boolean;
  correction?: Correction;
}

const TYPE_COLORS: Record<string, string> = {
  "Yazım Hatası":      "bg-red-500/10 text-red-400 border-red-500/30",
  "Soru Eki":          "bg-amber-500/10 text-amber-400 border-amber-500/30",
  "Noktalama":         "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "Büyük/Küçük Harf": "bg-purple-500/10 text-purple-400 border-purple-500/30",
  "Özel İsim":         "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

const TYPE_BADGE: Record<string, string> = {
  "Yazım Hatası":      "bg-red-950/60 border-red-800 text-red-400",
  "Soru Eki":          "bg-amber-950/60 border-amber-800 text-amber-400",
  "Noktalama":         "bg-blue-950/60 border-blue-800 text-blue-400",
  "Büyük/Küçük Harf": "bg-purple-950/60 border-purple-800 text-purple-400",
  "Özel İsim":         "bg-emerald-950/60 border-emerald-800 text-emerald-400",
};

const EXAMPLES = [
  {
    title: "Sosyal Medya Başlığı",
    text: "herkez buradamı ? süpriz gelişmeyi duydunuzmu yalnış duymadınız yarın görüşüyoruz !",
  },
  {
    title: "Müşteri Revize/Brief",
    text: "kalfmedianın logoları şarz cihazı görseline eklenecekmi tabi ki yarın teslim edilsin.",
  },
  {
    title: "Gündelik Plan Notu",
    text: "herşey hazırlandı istanbulun çekimleri bittimi ? malesef birşeyler eksik gibi orjinal kartı kontrol et.",
  },
];

// Build inline diff segments from corrected text + correction list
function buildSegments(correctedFull: string, corrections: Correction[]): Segment[] {
  if (!corrections.length) {
    return [{ id: "s0", text: correctedFull, isCorrection: false }];
  }

  // For each correction, find its position in the corrected text and mark it
  const segments: Segment[] = [];
  let remaining = correctedFull;
  let offset = 0;
  let segIdx = 0;

  // Sort corrections by their position in the corrected text (left to right)
  const used = new Set<string>();
  const ordered: Array<{ corr: Correction; pos: number }> = [];

  for (const corr of corrections) {
    const searchFrom = 0;
    const pos = remaining.indexOf(corr.corrected, searchFrom);
    if (pos !== -1 && !used.has(corr.id)) {
      ordered.push({ corr, pos });
      used.add(corr.id);
    }
  }

  ordered.sort((a, b) => a.pos - b.pos);

  // Rebuild without overlap
  let cursor = 0;
  for (const { corr, pos } of ordered) {
    if (pos < cursor) continue; // skip overlapping
    if (pos > cursor) {
      segments.push({
        id: `t${segIdx++}`,
        text: remaining.slice(cursor, pos),
        isCorrection: false,
      });
    }
    segments.push({
      id: corr.id,
      text: corr.corrected,
      isCorrection: true,
      correction: corr,
    });
    cursor = pos + corr.corrected.length;
  }

  if (cursor < remaining.length) {
    segments.push({ id: `t${segIdx++}`, text: remaining.slice(cursor), isCorrection: false });
  }

  return segments;
}

export default function ImlaKontroluPage() {
  const [inputText, setInputText] = useState("");
  const [correctedFull, setCorrectedFull] = useState("");
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [disabledIds, setDisabledIds] = useState<Set<string>>(new Set()); // unchecked = NOT applied
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "editor">("text");

  const handleLoadExample = (text: string) => {
    setInputText(text);
    setCorrectedFull("");
    setCorrections([]);
    setSegments([]);
    setDisabledIds(new Set());
    setError("");
  };

  const handleClear = () => {
    setInputText("");
    setCorrectedFull("");
    setCorrections([]);
    setSegments([]);
    setDisabledIds(new Set());
    setError("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (correctedFull) {
      setCorrectedFull("");
      setCorrections([]);
      setSegments([]);
      setDisabledIds(new Set());
      setError("");
    }
  };

  const handleCorrect = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError("");
    setCorrectedFull("");
    setCorrections([]);
    setSegments([]);
    setDisabledIds(new Set());

    try {
      const res = await fetch("/api/imla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Sunucu hatası: ${res.status}`);
      }

      const data: { corrected: string; corrections: Array<{ original: string; corrected: string; type: string }> } = await res.json();

      const enriched: Correction[] = (data.corrections || []).map((c, i) => ({
        ...c,
        id: `corr-${i}-${Date.now()}`,
        type: c.type as Correction["type"],
      }));

      setCorrectedFull(data.corrected || inputText);
      setCorrections(enriched);
      setSegments(buildSegments(data.corrected || inputText, enriched));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Compute final output text: apply enabled corrections, revert disabled ones
  const getFinalText = (): string => {
    if (!correctedFull) return "";
    if (!disabledIds.size) return correctedFull;

    // Re-apply disabled corrections back to their originals in the corrected text
    let text = correctedFull;
    for (const corr of corrections) {
      if (disabledIds.has(corr.id)) {
        // Replace first occurrence of corrected word with original
        text = text.replace(corr.corrected, corr.original);
      }
    }
    return text;
  };

  const finalText = getFinalText();

  const toggleCorrection = (id: string) => {
    setDisabledIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = async () => {
    if (!finalText) return;
    try {
      await navigator.clipboard.writeText(finalText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const hasResult = !!correctedFull;

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              İmla Kontrolü / Editör
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                <Zap size={9} /> Gemini AI
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Yazılarınızı Google Gemini yapay zekası ile TDK standartlarına göre analiz edin ve düzeltin.
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-emerald-500/8 border border-emerald-500/20 px-4 py-3 rounded-2xl flex items-start gap-3">
          <Zap className="text-emerald-400 shrink-0 mt-0.5" size={15} />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-emerald-300">Yapay Zeka Destekli İmla Denetimi</span>
            <span className="text-[11px] text-slate-400 leading-relaxed">
              Yazım hataları, soru ekleri, noktalama işaretleri, büyük/küçük harf kullanımı ve özel isimler gerçek zamanlı olarak analiz edilir.
              Düzeltme listesindeki her öneriye tıklayarak kabul edip etmeyeceğinize karar verebilirsiniz.
            </span>
          </div>
        </div>

        {/* Examples */}
        <div className="glass-card flex flex-col gap-3">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Hızlı Örnek Deneyin</span>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => handleLoadExample(ex.text)}
                className="py-1.5 px-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700/50 rounded-xl text-[11px] font-bold text-slate-400 cursor-pointer transition-all"
              >
                {ex.title}
              </button>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* LEFT: Input */}
          <div className="glass-card flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800/40 pb-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <PenTool size={14} className="text-blue-500" />
                Düzeltilecek Metin
              </h3>
              {inputText && (
                <button
                  onClick={handleClear}
                  className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 size={12} /> Temizle
                </button>
              )}
            </div>

            <textarea
              className="w-full h-64 p-4 bg-slate-950/60 border border-slate-800/60 focus:border-blue-500/50 rounded-2xl outline-none text-xs text-slate-200 resize-none leading-relaxed placeholder-slate-500 font-medium transition-colors"
              placeholder="Sosyal medya başlığı, müşteri brief notu veya düzeltmek istediğiniz herhangi bir Türkçe metni buraya yazın..."
              value={inputText}
              onChange={handleInputChange}
            />

            <button
              onClick={handleCorrect}
              disabled={loading || !inputText.trim()}
              className="btn btn-primary w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed border-none text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <><RefreshCw size={14} className="animate-spin" /> Gemini analiz ediyor...</>
              ) : (
                <><Sparkles size={14} /> Metni Düzelt</>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl">
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-300 leading-relaxed">{error}</p>
              </div>
            )}
          </div>

          {/* RIGHT: Result */}
          <div className="glass-card flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800/40 pb-3 flex-wrap gap-2">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mr-auto">
                <CheckCircle size={14} className="text-emerald-500" />
                Düzeltilmiş Sonuç
              </h3>

              {/* Tab switcher */}
              {hasResult && (
                <div className="flex gap-1 bg-slate-950/60 border border-slate-800/40 p-0.5 rounded-lg mr-2">
                  <button
                    onClick={() => setActiveTab("text")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all flex items-center gap-1 ${
                      activeTab === "text" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FileText size={10} /> Düz Metin
                  </button>
                  <button
                    onClick={() => setActiveTab("editor")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all flex items-center gap-1 ${
                      activeTab === "editor" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Edit3 size={10} /> Görsel Editör
                  </button>
                </div>
              )}

              {finalText && (
                <button
                  onClick={handleCopy}
                  className={`text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    copied ? "text-emerald-400" : "text-blue-400 hover:text-blue-300"
                  }`}
                >
                  {copied ? <><Check size={12} /> Kopyalandı!</> : <><Copy size={12} /> Metni Kopyala</>}
                </button>
              )}
            </div>

            {/* Result area */}
            {hasResult && activeTab === "editor" ? (
              <div className="w-full min-h-[16rem] max-h-64 p-4 bg-slate-950/40 border border-slate-800/40 rounded-2xl overflow-y-auto text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-wrap scrollbar-thin">
                {segments.map(seg => {
                  if (!seg.isCorrection || !seg.correction) {
                    return <span key={seg.id}>{seg.text}</span>;
                  }
                  const isActive = !disabledIds.has(seg.id);
                  const colors = TYPE_COLORS[seg.correction.type] || TYPE_COLORS["Yazım Hatası"];
                  return (
                    <span
                      key={seg.id}
                      onClick={() => toggleCorrection(seg.id)}
                      title={isActive ? `Orijinal: "${seg.correction!.original}" — İptal için tıklayın` : `Düzeltilmiş: "${seg.correction!.corrected}" — Onaylamak için tıklayın`}
                      className={`inline-block mx-0.5 px-1.5 py-0.5 rounded-lg border cursor-pointer font-bold transition-all select-none ${
                        isActive
                          ? `${colors} hover:brightness-125`
                          : "bg-slate-800/40 text-slate-500 border-slate-700/40 line-through opacity-60"
                      }`}
                    >
                      {isActive ? seg.correction.corrected : seg.correction.original}
                    </span>
                  );
                })}
              </div>
            ) : (
              <textarea
                readOnly
                className="w-full h-64 p-4 bg-slate-950/40 border border-slate-800/40 rounded-2xl outline-none text-xs text-slate-300 resize-none leading-relaxed placeholder-slate-600 font-medium"
                placeholder={loading ? "Gemini analiz ediyor, lütfen bekleyin..." : "Düzeltilmiş sonuç burada görünecektir..."}
                value={finalText}
              />
            )}

            {/* Corrections report */}
            {hasResult && (
              <div className="bg-slate-950/30 border border-slate-800/40 rounded-2xl p-4 flex flex-col gap-3 max-h-60 overflow-y-auto scrollbar-thin">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertCircle size={10} className="text-amber-500" />
                    Tespit Edilen Düzeltmeler
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {corrections.length - disabledIds.size}/{corrections.length} aktif
                  </span>
                </div>

                {corrections.length === 0 ? (
                  <div className="flex items-center gap-2 py-2">
                    <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                    <p className="text-[11px] text-emerald-300 font-semibold">Harika! Metinde herhangi bir hata bulunamadı.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {corrections.map(corr => {
                      const isActive = !disabledIds.has(corr.id);
                      const badge = TYPE_BADGE[corr.type] || TYPE_BADGE["Yazım Hatası"];
                      return (
                        <div
                          key={corr.id}
                          onClick={() => toggleCorrection(corr.id)}
                          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all select-none ${
                            isActive
                              ? "bg-slate-900/60 border-slate-800/50 hover:bg-slate-800/60"
                              : "bg-slate-950/30 border-slate-900/40 opacity-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 rounded accent-blue-500 cursor-pointer pointer-events-none shrink-0"
                            />
                            <span className={`px-1.5 py-0.5 rounded-md border text-[8px] font-black uppercase shrink-0 ${badge}`}>
                              {corr.type}
                            </span>
                            <span className={`text-[11px] font-semibold truncate ${isActive ? "text-slate-400 line-through" : "text-slate-500"}`}>
                              {corr.original}
                            </span>
                          </div>
                          <div className={`flex items-center gap-1.5 shrink-0 text-[11px] font-bold ${isActive ? "text-emerald-400" : "text-slate-600 line-through"}`}>
                            <ArrowRight size={10} />
                            <span>{corr.corrected}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
