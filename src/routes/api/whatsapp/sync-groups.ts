import { createFileRoute } from "@tanstack/react-router";

// Placeholder endpoint: the real WhatsApp Web session sync ships with the
// QR-code integration. Until then it reports "not connected" so the UI can
// show a friendly message instead of failing silently.
export const Route = createFileRoute("/api/whatsapp/sync-groups")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          { ok: false, error: "whatsapp_not_connected", groups: [] },
          { status: 503 },
        ),
    },
  },
});
