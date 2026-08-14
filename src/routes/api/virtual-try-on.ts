import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const Route = createFileRoute("/api/virtual-try-on")({
  server: {
    handlers: {
      OPTIONS: async () => new Response("ok", { headers: cors }),
      POST: async ({ request }) => {
        const json = (body: unknown, status = 200) =>
          new Response(JSON.stringify(body), {
            status,
            headers: { ...cors, "Content-Type": "application/json" },
          });

        try {
          const { person_image_base64, person_image_mime, shoe_image_url, product_name } =
            (await request.json()) as {
              person_image_base64?: string;
              person_image_mime?: string;
              shoe_image_url?: string;
              product_name?: string;
            };

          if (!person_image_base64 || !shoe_image_url) {
            return json({ error: "Imagem da pessoa e do tênis são obrigatórias." }, 400);
          }

          const key = process.env["LOVABLE_API_KEY"];
          if (!key) return json({ error: "Serviço de IA indisponível." }, 500);

          const personUrl = `data:${person_image_mime || "image/jpeg"};base64,${person_image_base64}`;

          const prompt = `Você é um especialista em moda e edição de imagens. Aplique o tênis da segunda imagem nos pés da pessoa da primeira imagem de forma completamente realista. Mantenha:
- A proporção correta do tênis em relação ao pé
- A iluminação e sombras naturais da foto original
- O ângulo e posição natural do pé
- A qualidade e resolução da foto original
O resultado deve parecer uma foto real, não uma montagem. Produto: ${product_name || "tênis"}.`;

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-pro-image",
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: personUrl } },
                    { type: "image_url", image_url: { url: shoe_image_url } },
                  ],
                },
              ],
              modalities: ["image", "text"],
            }),
          });

          if (!upstream.ok) {
            const text = await upstream.text().catch(() => "");
            console.error("virtual-try-on gateway error", upstream.status, text);
            if (upstream.status === 429) {
              return json({ error: "Muitas solicitações agora. Tente novamente em instantes." }, 429);
            }
            return json({ error: "Não foi possível gerar a imagem. Tente com outra foto." }, 502);
          }

          const data: any = await upstream.json();
          const b64 =
            data?.data?.[0]?.b64_json ??
            data?.choices?.[0]?.message?.images?.[0]?.image_url?.url ??
            null;

          if (!b64) {
            console.error("virtual-try-on: sem imagem na resposta", JSON.stringify(data).slice(0, 800));
            return json({ error: "Não foi possível gerar a imagem. Tente com outra foto." }, 500);
          }

          const result_image = String(b64).startsWith("data:") ? String(b64) : `data:image/png;base64,${b64}`;
          return json({ success: true, result_image });
        } catch (error) {
          console.error("Erro no provador virtual:", error);
          return json({ error: "Erro interno. Tente novamente." }, 500);
        }
      },
    },
  },
});
