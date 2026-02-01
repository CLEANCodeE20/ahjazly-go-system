const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
const SENTIMENT_MODEL = "RafatMohammed/arabic-sentiment-marbertv2";
// Gradio 4+ usually exposes a synchronous /api/predict endpoint
const HF_SPACE_URL = "https://rafatmohammed-marbertv2-arabic-sentiment.hf.space/api/predict";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export interface SentimentResult {
    label: 'Positive' | 'Neutral' | 'Negative';
    score: number;
}

export const analyzeSentiment = async (text: string): Promise<SentimentResult | null> => {
    if (!text) throw new Error("النص فارغ");

    console.log("🧠 Starting sentiment analysis for:", text.substring(0, 50) + "...");
    let errors: string[] = [];

    // 1. Try Hugging Face Space API
    try {
        console.log("🌐 Calling Space API (Sync):", HF_SPACE_URL);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for Space

        const spaceResponse = await fetch(HF_SPACE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: [text] }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (spaceResponse.ok) {
            const spaceResult = await spaceResponse.json();
            if (spaceResult.data && spaceResult.data[0]) {
                const output = spaceResult.data[0];
                let label: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
                if (output.includes('إيجابي') || output.includes('Positive')) label = 'Positive';
                else if (output.includes('سلبي') || output.includes('Negative')) label = 'Negative';

                const scoreMatch = output.match(/درجة الثقة: ([\d.]+)/);
                const score = scoreMatch ? parseFloat(scoreMatch[1]) : 1.0;

                return { label, score };
            }
        } else {
            errors.push(`Space API Error: ${spaceResponse.status} ${await spaceResponse.text()}`);
        }
    } catch (spaceError: any) {
        errors.push(`Space API Failed: ${spaceError.message}`);
    }

    // 2. Fallback to Inference API
    if (!HF_TOKEN) {
        throw new Error("مفتاح HF_TOKEN غير موجود في ملف .env");
    }

    console.log("🔄 Falling back to Inference API...");
    try {
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${SENTIMENT_MODEL}`,
            {
                headers: {
                    "Authorization": `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({ inputs: text }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Inference API ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        // Handle "Model is loading" case specifically if needed, though usually it returns 503
        if (result.error && result.error.includes("loading")) {
            throw new Error("النموذج قيد التحميل (Model Loading)، يرجى المحاولة بعد قليل.");
        }

        if (Array.isArray(result) && result[0]) {
            const data = Array.isArray(result[0]) ? result[0] : result;

            if (!data || data.length === 0) throw new Error("Inference API returned empty data");

            const topResult = data.reduce((prev: any, current: any) =>
                (prev.score > current.score) ? prev : current
            );

            let label: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
            const modelLabel = topResult.label.toUpperCase();

            if (modelLabel === 'LABEL_2' || modelLabel.includes('POS') || modelLabel.includes('إيجابي')) label = 'Positive';
            else if (modelLabel === 'LABEL_0' || modelLabel.includes('NEG') || modelLabel.includes('سلبي')) label = 'Negative';
            else if (modelLabel === 'LABEL_1' || modelLabel.includes('NEU') || modelLabel.includes('محايد')) label = 'Neutral';

            return { label, score: topResult.score };
        }

        throw new Error(`Unexpected format: ${JSON.stringify(result)}`);

    } catch (infError: any) {
        errors.push(`Inference API Failed: ${infError.message}`);
    }

    // If we reached here, both failed
    throw new Error(`فشل التحليل. الأخطاء: ${errors.join(" | ")}`);
};

export const generateSmartReply = async (comment: string, rating: number): Promise<string | null> => {
    if (!comment) return null;

    if (GROQ_API_KEY) {
        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama3-8b-8192",
                    messages: [
                        {
                            role: "system",
                            content: "أنت مساعد ذكي متخصص في خدمة العملاء لشركة نقل ركاب (أهلاً بالجميع - أحجزلي). ردودك يجب أن تكون احترافية، ودودة، وباللغة العربية. إذا كان التقييم إيجابياً، اشكر العميل. إذا كان سلبياً، اعتذر بلباقة واعد بالتحسين."
                        },
                        {
                            role: "user",
                            content: `اكتب رداً على هذا التقييم (${rating} نجوم): "${comment}"`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            const data = await response.json();
            if (data.choices?.[0]?.message?.content) {
                return data.choices[0].message.content.trim();
            }
        } catch (error) {
            console.error("Error generating Groq reply:", error);
        }
    }

    return null;
};
