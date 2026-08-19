import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/host-debug")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const h = request.headers;
        const info = {
          host: h.get("host"),
          "x-forwarded-host": h.get("x-forwarded-host"),
          "x-vercel-deployment-url": h.get("x-vercel-deployment-url"),
          "cf-connecting-ip": h.get("cf-connecting-ip") ? "present" : null,
          url: request.url,
        };
        return new Response(JSON.stringify(info, null, 2), {
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
      },
    },
  },
});
