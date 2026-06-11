import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const inputSchema = z.object({
  kind: z.enum(["description", "seo", "tags"]),
  productName: z.string().min(1).max(200),
  productDescription: z.string().max(4000).optional().default(""),
});

async function callGateway(prompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI Gateway error ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as any;
  return String(data?.choices?.[0]?.message?.content ?? "").trim();
}

export const generateProductContent = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { kind, productName, productDescription } = data;
    const ctx = productDescription
      ? `Nome: "${productName}". Descrição existente: "${productDescription}".`
      : `Nome: "${productName}".`;

    if (kind === "description") {
      const prompt = `Escreva uma descrição de produto atraente e persuasiva em português brasileiro para o produto a seguir. ${ctx}
A descrição deve ter 2-3 parágrafos curtos, destacar os benefícios principais, usar linguagem natural e convincente. Responda APENAS com o texto da descrição, sem título, sem markdown, sem introdução.`;
      const text = await callGateway(prompt);
      return { kind: "description" as const, text };
    }

    if (kind === "seo") {
      const prompt = `Gere um título SEO (máximo 70 caracteres) e uma descrição SEO (máximo 160 caracteres) em português brasileiro para o produto. ${ctx}
Responda APENAS em JSON válido, sem markdown e sem cercas de código: {"title":"...","description":"..."}`;
      const raw = await callGateway(prompt);
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
      const json = JSON.parse(cleaned);
      return {
        kind: "seo" as const,
        title: String(json.title ?? "").slice(0, 70),
        description: String(json.description ?? "").slice(0, 160),
      };
    }

    // tags
    const prompt = `Gere de 5 a 8 tags / palavras-chave curtas, relevantes, em português brasileiro, para o produto. ${ctx}
Responda APENAS em JSON válido, sem markdown e sem cercas de código: {"tags":["tag1","tag2"]}`;
    const raw = await callGateway(prompt);
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const json = JSON.parse(cleaned);
    const tags = Array.isArray(json.tags)
      ? json.tags.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 12)
      : [];
    return { kind: "tags" as const, tags };
  });
