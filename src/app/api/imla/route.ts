import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `Sen bir Türkçe dil bilgisi ve imla uzmanısın. Sana verilen metni TDK (Türk Dil Kurumu) kurallarına göre analiz edip düzeltmen gerekiyor.

YAPMAN GEREKENLER:
1. Yazım hataları: Yanlış yazılmış kelimeleri düzelt (örn: herkez→herkes, yalnış→yanlış, orjinal→orijinal, malesef→maalesef, süpriz→sürpriz, şarz→şarj, birşey→bir şey, herşey→her şey, tabiki→tabii ki, tabi ki→tabii ki)
2. Soru ekleri: Soru eki olan "mı/mi/mu/mü" kelimeden ayrı yazılmalıdır (örn: duydunuzmu→duydunuz mu, buradamı→burada mı, eklenecekmi→eklenecek mi, bittimi→bitti mi)
3. Soru işareti: Soru cümlelerinin sonuna "?" gelmelidir. Soru eki içeren her cümle soru işaretiyle bitmelidir.
4. Noktalama: Noktalama işaretlerinden önce boşluk olmaz, sonra olur (örn: "kelime ?" → "kelime?", "merhaba,dünya" → "merhaba, dünya")
5. Büyük harf: Cümle başları büyük harfle başlamalıdır. Soru işareti veya nokta/ünlem sonrası gelen cümle büyük harfle başlar.
6. Özel isimler: Özel isimler büyük harfle başlar ve eklerden önce kesme işareti kullanılır (örn: türkiyenin→Türkiye'nin, istanbulun→İstanbul'un, kalfmedianın→KalfMedia'nın)

YAPMAYMAN GEREKENLER:
- Metnin anlamını değiştirme
- Cümle yapısını yeniden kurma
- Yeni kelime veya içerik ekleme
- Pekiştirme sıfatlarını bozma (örn: "güzel mi güzel" olduğu gibi kalmalı)
- Virgül veya noktalı virgül ile ayrılmış alt cümlelerdeki soru eklerine soru işareti koyma (örn: "Geldi mi, gideriz" → soru işareti yok)

YANIT FORMATI (kesinlikle bu JSON formatında yanıt ver, başka hiçbir şey yazma):
{
  "corrected": "Düzeltilmiş metnin tamamı",
  "corrections": [
    {
      "original": "hatalı kelime veya ifade",
      "corrected": "düzeltilmiş hali",
      "type": "Yazım Hatası" | "Soru Eki" | "Noktalama" | "Büyük/Küçük Harf" | "Özel İsim"
    }
  ]
}

"corrections" dizisinde yalnızca gerçekten değiştirilen kısımlar yer almalı. Değişmeyen kısımları dahil etme.`;

// Model fallback sırası — yalnızca bu API key için mevcut modeller
const MODEL_PRIORITY = [
  "gemini-2.0-flash-lite",   // En hafif + en yüksek ücretsiz kota
  "gemini-2.5-flash",        // İkinci seçenek
  "gemini-2.0-flash",        // Son çare
];

async function tryGenerateWithFallback(
  apiKey: string,
  prompt: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: Error | null = null;

  for (const modelName of MODEL_PRIORITY) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isQuota =
        lastError.message.includes("429") ||
        lastError.message.toLowerCase().includes("quota") ||
        lastError.message.toLowerCase().includes("too many");

      if (isQuota) {
        // Quota aşıldı — bir sonraki modeli dene
        console.warn(`[imla] ${modelName} kota aşıldı, sonraki modele geçiliyor...`);
        continue;
      }

      // Başka bir hata ise direkt fırlat
      throw lastError;
    }
  }

  throw new Error(
    "Gemini API kotası tükenmiştir. Lütfen birkaç dakika bekleyip tekrar deneyin ya da aistudio.google.com adresinden fatura bilgilerinizi güncelleyin."
  );
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY tanımlı değil. Lütfen .env.local dosyasını kontrol edin." },
        { status: 500 }
      );
    }

    const { text } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Metin boş olamaz." }, { status: 400 });
    }

    const userPrompt = `Aşağıdaki Türkçe metni analiz et ve düzelt:\n\n"${text}"`;
    const rawText = await tryGenerateWithFallback(apiKey, userPrompt);

    // Parse JSON
    let parsed: {
      corrected: string;
      corrections: Array<{ original: string; corrected: string; type: string }>;
    };

    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Fallback: model açıklama eklemiş olabilir, JSON bloğunu çıkar
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json(
          { error: "Model geçersiz yanıt döndürdü. Lütfen tekrar deneyin." },
          { status: 500 }
        );
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("İmla API hatası:", err);
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";

    // Kullanıcıya anlamlı Türkçe hata mesajları
    const isQuota =
      message.includes("429") ||
      message.toLowerCase().includes("quota") ||
      message.toLowerCase().includes("too many") ||
      message.toLowerCase().includes("kota");

    if (isQuota) {
      return NextResponse.json(
        {
          error:
            "⚠️ Gemini API ücretsiz kota limitine ulaşıldı. Lütfen 1-2 dakika bekleyip tekrar deneyin. Sürekli kullanım için aistudio.google.com adresinden ücretli plana geçebilirsiniz.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `API hatası: ${message}` },
      { status: 500 }
    );
  }
}
