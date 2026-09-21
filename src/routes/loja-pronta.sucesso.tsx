import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/loja-pronta/sucesso")({
  head: () => ({
    meta: [
      { title: "Pedido confirmado — Loja Pronta ShopBox" },
      { name: "description", content: "Recebemos seu pagamento. Nossa equipe entrará em contato em até 24h pelo WhatsApp." },
      { property: "og:title", content: "Pedido confirmado — Loja Pronta ShopBox" },
      { property: "og:description", content: "Nossa equipe entrará em contato em até 24h pelo WhatsApp para criar sua loja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LojaProntaSucessoPage,
});

function LojaProntaSucessoPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, background: "#fff" }}>
      <div style={{ maxWidth: 480 }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
        <h1 style={{ fontSize: 32, fontWeight: 650, marginBottom: 16, color: "#1a1a1a" }}>
          Pedido confirmado!
        </h1>
        <p style={{ fontSize: 16, color: "#555", lineHeight: 1.7, marginBottom: 32 }}>
          Recebemos seu pagamento. Nossa equipe entrará em contato em até 24h pelo WhatsApp para dar início à criação da sua loja.
        </p>
        <a
          href="https://wa.me/5518981586111?text=Ol%C3%A1!%20Acabei%20de%20contratar%20a%20Loja%20Pronta%20da%20ShopBox%20e%20quero%20iniciar%20o%20processo."
          target="_blank"
          rel="noreferrer"
          style={{
            backgroundColor: "#25d366", color: "#fff",
            padding: "16px 32px", borderRadius: 12,
            fontWeight: 600, fontSize: 16,
            textDecoration: "none", display: "inline-block",
          }}
        >
          Falar com a equipe no WhatsApp →
        </a>
      </div>
    </div>
  );
}
