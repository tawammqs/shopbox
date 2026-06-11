import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Palette, ClipboardList, CreditCard,
  Package, Tag, Globe, TrendingUp, MessageCircle,
  Users, Zap, Clock, Star,
} from "lucide-react";
import { resolveDomainSlug } from "@/lib/custom-domain.functions";

const SHOPBOX_HOSTS = ["shopboxapp.com.br", "www.shopboxapp.com.br", "shopbox.lovable.app", "localhost"];
function isShopBoxHost(h: string) {
  if (!h) return true;
  if (h.endsWith(".lovable.app")) return true;
  if (h.endsWith(".lovable.dev")) return true;
  if (h === "localhost" || h.startsWith("127.")) return true;
  return SHOPBOX_HOSTS.includes(h);
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShopBox — Crie sua loja e venda pelo WhatsApp" },
      {
        name: "description",
        content:
          "Plataforma de e-commerce para WhatsApp. Vitrine profissional, cupons, promoções e checkout direto no WhatsApp. A partir de R$47/mês.",
      },
      { property: "og:title", content: "ShopBox — Venda pelo WhatsApp" },
      { property: "og:description", content: "Crie sua loja online e venda pelo WhatsApp em minutos." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700;1,800;1,900&display=swap",
      },
    ],
  }),
  component: LandingPage,
});

const STYLES = `
.psb, .psb *, .psb *::before, .psb *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Public Sans', system-ui, sans-serif; }
.psb {
  --green: #25D366;
  --green-dk: #1ebe57;
  --green-text: #166534;
  --ink: #1a1a1a;
  --ink-soft: #444;
  --muted: #555;
  --muted2: #888;
  --muted3: #aaa;
  --line: #e8e8e0;
  --bg-cream: #fafaf8;
  --bg-mint: #f0fdf4;
  --line-mint: #bbf7d0;
  --bg-rose: #fff5f5;
  --line-rose: #fecaca;
  font-size: 16px;
  line-height: 1.6;
  overflow-x: hidden;
  color: var(--ink);
  background: #fff;
}
.psb a { text-decoration: none; color: inherit; }
.psb button { font-family: inherit; cursor: pointer; }

/* SECTION WRAPPERS */
.psb .sec { padding: 96px 52px; }
.psb .wrap { max-width: 1200px; margin: 0 auto; }

.psb .sec-nav     { background: #fafaf8; border-bottom: 1px solid #e8e8e0; }
.psb .sec-hero    { background: #fafaf8; }
.psb .sec-marquee { background: #ffffff; border-top: 1px solid #e8e8e0; border-bottom: 1px solid #e8e8e0; }
.psb .sec-about   { background: #f0fdf4; border-top: 1px solid #bbf7d0; border-bottom: 1px solid #bbf7d0; }
.psb .sec-vs      { background: #fafaf8; border-bottom: 1px solid #e8e8e0; }
.psb .sec-feats   { background: #ffffff; border-bottom: 1px solid #e8e8e0; }
.psb .sec-steps   { background: #1a1a1a; color: #fff; }
.psb .sec-testi   { background: #ffffff; border-top: 3px solid #25D366; border-bottom: 1px solid #e8e8e0; }
.psb .sec-pricing { background: #fafaf8; border-top: 1px solid #e8e8e0; border-bottom: 1px solid #e8e8e0; }
.psb .sec-faq     { background: #ffffff; border-bottom: 1px solid #e8e8e0; }
.psb .sec-cta     { background: #1a1a1a; color: #fff; }
.psb .sec-footer  { background: #0a0a0a; border-top: 1px solid #1f2937; color: #9ca3af; }

/* NAV */
.psb .navbar { position: sticky; top: 0; z-index: 200; display: flex; align-items: center; justify-content: space-between; padding: 16px 48px; }
.psb .logo { font-weight: 900; font-size: 26px; letter-spacing: -1px; display: inline-flex; }
.psb .logo .lo-a { color: #1a1a1a; }
.psb .logo .lo-b { color: #25D366; }
.psb .nav-links { display: flex; align-items: center; gap: 34px; }
.psb .nav-links a { font-size: 14px; font-weight: 500; color: #555; transition: color .2s; white-space: nowrap; }
.psb .nav-links a:hover { color: #1a1a1a; }
.psb .nav-cta { display: flex; align-items: center; gap: 12px; }
.psb .btn-ghost { font-size: 14px; font-weight: 500; color: #555; padding: 8px 20px; border-radius: 8px; border: 1px solid #e8e8e0; background: #fff; transition: all .2s; }
.psb .btn-ghost:hover { color: #1a1a1a; border-color: #25D366; }
.psb .btn-cta { font-size: 14px; font-weight: 700; color: #fff; padding: 9px 22px; border-radius: 8px; background: #25D366; border: none; transition: all .2s; white-space: nowrap; }
.psb .btn-cta:hover { background: #1ebe57; transform: translateY(-1px); }

/* HERO */
.psb .hero { padding: 64px 24px 96px; text-align: center; }
.psb .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e8e8e0; border-radius: 100px; padding: 6px 18px; font-size: 13px; font-weight: 600; color: #555; margin-bottom: 32px; }
.psb .hero-badge::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: #25D366; }
.psb .hero h1 { font-size: clamp(44px, 6.2vw, 80px); font-weight: 900; letter-spacing: -2px; line-height: 1.08; max-width: 860px; margin: 0 auto; color: #1a1a1a; }
.psb .hero h1 em { font-weight: 900; color: #25D366; font-style: italic; }
.psb .hero-sub { margin: 22px auto 0; font-size: clamp(16px, 1.4vw, 19px); color: #555; max-width: 600px; line-height: 1.7; font-weight: 400; }
.psb .hero-actions { margin-top: 40px; display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
.psb .btn-hero { font-size: 16px; font-weight: 700; color: #fff; padding: 14px 34px; border-radius: 10px; background: #25D366; display: inline-flex; align-items: center; gap: 9px; border: none; transition: all .22s; box-shadow: 0 8px 24px rgba(37,211,102,.28); }
.psb .btn-hero:hover { background: #1ebe57; transform: translateY(-2px); }
.psb .btn-outline { font-size: 16px; font-weight: 600; color: #555; padding: 14px 34px; border-radius: 10px; border: 1px solid #e8e8e0; background: #fff; display: inline-flex; align-items: center; gap: 8px; transition: all .22s; }
.psb .btn-outline:hover { color: #1a1a1a; border-color: #25D366; }
.psb .hero-note { margin-top: 20px; font-size: 13px; color: #888; }
.psb .hero-note strong { color: #555; }

/* HERO DASHBOARD */
.psb .hero-dash { margin: 64px auto 0; width: 100%; max-width: 1020px; background: #fff; border: 1px solid #e8e8e0; border-radius: 22px; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,.08); text-align: left; }
.psb .dash-bar { background: #fafaf8; padding: 13px 20px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #e8e8e0; }
.psb .dr { width: 12px; height: 12px; border-radius: 50%; background: #ff5f57; }
.psb .dy { width: 12px; height: 12px; border-radius: 50%; background: #febc2e; }
.psb .dg { width: 12px; height: 12px; border-radius: 50%; background: #28c840; }
.psb .dash-url { margin-left: 12px; font-size: 12px; color: #aaa; }
.psb .dash-body { padding: 28px; display: grid; grid-template-columns: repeat(4,1fr); gap: 18px; }
.psb .dc { background: #fafaf8; border: 1px solid #e8e8e0; border-radius: 12px; padding: 20px; }
.psb .dc-l { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; color: #888; }
.psb .dc-v { font-size: 28px; font-weight: 900; color: #1a1a1a; margin-top: 6px; letter-spacing: -1px; }
.psb .dc-t { font-size: 12px; color: #25D366; margin-top: 4px; font-weight: 600; }
.psb .dc-table { grid-column: 1/-1; }
.psb .dc-table-scroll { overflow-x: auto; }
.psb .dc-table table { width: 100%; min-width: 480px; border-collapse: collapse; }
.psb .dc-table th { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; padding: 8px 14px; text-align: left; font-weight: 700; white-space: nowrap; }
.psb .dc-table td { font-size: 14px; color: #555; padding: 11px 14px; border-top: 1px solid #e8e8e0; white-space: nowrap; }
.psb .tg { color: #166534; background: #f0fdf4; padding: 2px 10px; border-radius: 100px; font-size: 12px; font-weight: 700; }
.psb .ty { color: #92400e; background: #fef3c7; padding: 2px 10px; border-radius: 100px; font-size: 12px; font-weight: 700; }

/* MARQUEE */
.psb .marquee-wrap { overflow: hidden; padding: 17px 0; }
.psb .marquee-track { display: flex; white-space: nowrap; animation: psbmq 28s linear infinite; }
.psb .marquee-track:hover { animation-play-state: paused; }
.psb .mi { display: inline-flex; align-items: center; gap: 9px; padding: 0 30px; font-size: 13.5px; font-weight: 600; color: #555; flex-shrink: 0; }
.psb .mi::before { content: '✓'; color: #25D366; }
@keyframes psbmq { from { transform: translateX(0) } to { transform: translateX(-50%) } }

/* SECTION HEADERS */
.psb .pill { display: inline-block; border: 1px solid #e8e8e0; background: #fff; color: #555; font-size: 12px; font-weight: 600; padding: 5px 14px; border-radius: 9999px; margin-bottom: 16px; }
.psb .sh2 { font-size: clamp(28px, 3.8vw, 50px); font-weight: 900; letter-spacing: -1.5px; line-height: 1.1; max-width: 700px; margin-bottom: 18px; color: #1a1a1a; }
.psb .sec-steps .sh2, .psb .sec-cta .sh2 { color: #fff; }
.psb .sec-steps .sh2 em, .psb .sec-cta .sh2 em { font-style: italic; color: #25D366; font-weight: 900; }
.psb .ssub { font-size: 17px; line-height: 1.75; font-weight: 400; max-width: 560px; color: #555; }
.psb .sec-steps .ssub { color: #aaa; }

/* WHAT */
.psb .what-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; margin-top: 60px; }
.psb .wf-list { display: flex; flex-direction: column; gap: 16px; }
.psb .wf { display: flex; gap: 16px; align-items: flex-start; padding: 22px; border-radius: 14px; border: 1px solid #bbf7d0; background: #fff; transition: all .22s; }
.psb .wf:hover { border-color: #25D366; box-shadow: 0 6px 28px rgba(37,211,102,.12); }
.psb .wf-ic { width: 44px; height: 44px; flex-shrink: 0; border-radius: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; display: flex; align-items: center; justify-content: center; }
.psb .wf-ic > svg { width: 22px; height: 22px; stroke: #25D366; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.psb .wf-ic.wf-ic-wa > svg { stroke: none; fill: #25D366; }
.psb .wf h4 { font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; line-height: 1.3; }
.psb .wf p  { font-size: 14px; color: #555; line-height: 1.6; }

/* PHONE MOCK */
.psb .phone { background: #fff; border: 1px solid #bbf7d0; border-radius: 26px; padding: 28px; max-width: 330px; margin: 0 auto; box-shadow: 0 12px 64px rgba(0,100,40,.08); }
.psb .ph-head { display: flex; align-items: center; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid #e8e8e0; margin-bottom: 18px; }
.psb .ph-av { width: 40px; height: 40px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px; color: #fff; }
.psb .ph-name { font-size: 15px; font-weight: 700; color: #1a1a1a; }
.psb .ph-on { font-size: 12px; color: #25D366; font-weight: 600; }
.psb .ph-prod { background: #fafaf8; border-radius: 14px; padding: 16px; display: flex; gap: 14px; align-items: center; margin-bottom: 14px; border: 1px solid #e8e8e0; }
.psb .ph-img { width: 56px; height: 56px; border-radius: 10px; background: linear-gradient(135deg,#d4f5dc,#a8e6b4); display: flex; align-items: center; justify-content: center; font-size: 26px; }
.psb .ph-pn { font-size: 14px; font-weight: 700; color: #1a1a1a; }
.psb .ph-pp { font-size: 20px; font-weight: 900; color: #25D366; margin-top: 2px; }
.psb .ph-btn { width: 100%; padding: 13px; background: #25D366; border-radius: 11px; text-align: center; color: #fff; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; }
.psb .ph-stat { margin-top: 18px; text-align: center; }
.psb .ph-sv { font-size: 30px; font-weight: 900; color: #25D366; letter-spacing: -1px; }
.psb .ph-sl { font-size: 12px; color: #888; font-weight: 500; }

/* STATS */
.psb .stats-band { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: #bbf7d0; border: 1px solid #bbf7d0; border-radius: 16px; overflow: hidden; margin-top: 60px; }
.psb .sc { background: #fff; padding: 32px 24px; text-align: center; }
.psb .sc-ic { width: 44px; height: 44px; margin: 0 auto 14px; border-radius: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; display: flex; align-items: center; justify-content: center; }
.psb .sc-ic svg { width: 22px; height: 22px; stroke: #25D366; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.psb .sn { font-size: 38px; font-weight: 900; color: #1a1a1a; letter-spacing: -1.5px; line-height: 1; }
.psb .sl { font-size: 13.5px; color: #555; margin-top: 8px; font-weight: 600; }

/* VS */
.psb .vs-comparison { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0; align-items: stretch; margin-top: 56px; }
.psb .vs-card { border-radius: 22px; padding: 36px; }
.psb .vs-card-bad { background: #fff5f5; border: 1px solid #fecaca; }
.psb .vs-card-good { background: #f0fdf4; border: 1px solid #bbf7d0; }
.psb .vs-card-title { font-size: 16px; font-weight: 800; margin-bottom: 28px; display: flex; align-items: center; gap: 10px; }
.psb .vs-card-bad .vs-card-title { color: #991b1b; }
.psb .vs-card-good .vs-card-title { color: #166534; }
.psb .vs-divider { display: flex; align-items: center; justify-content: center; width: 72px; flex-shrink: 0; }
.psb .vs-badge-pill { background: #fff; border: 1.5px solid #e8e8e0; border-radius: 100px; padding: 8px 14px; font-size: 12px; font-weight: 900; color: #888; letter-spacing: 1px; }
.psb .vs-item { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,.05); font-size: 14px; line-height: 1.5; }
.psb .vs-item:last-child { border-bottom: none; }
.psb .vs-card-bad .vs-item { color: #7c2d2d; }
.psb .vs-card-good .vs-item { color: #1a1a1a; font-weight: 500; }
.psb .ic-bad { width: 28px; height: 28px; flex-shrink: 0; border-radius: 8px; background: #fee2e2; border: 1px solid #fecaca; display: flex; align-items: center; justify-content: center; }
.psb .ic-bad svg { width: 14px; height: 14px; stroke: #dc2626; fill: none; stroke-width: 2.5; stroke-linecap: round; }
.psb .ic-good { width: 28px; height: 28px; flex-shrink: 0; border-radius: 8px; background: #dcfce7; border: 1px solid #bbf7d0; display: flex; align-items: center; justify-content: center; }
.psb .ic-good svg { width: 14px; height: 14px; stroke: #16a34a; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }

/* FEATURES */
.psb .feats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 56px; }
.psb .fc { background: #fafaf8; border: 1px solid #e8e8e0; border-radius: 18px; padding: 30px; position: relative; overflow: hidden; transition: all .25s; }
.psb .fc::after { content: attr(data-n); position: absolute; right: 18px; top: 12px; font-size: 64px; font-weight: 900; color: rgba(37,211,102,.08); line-height: 1; letter-spacing: -3px; }
.psb .fc:hover { border-color: #25D366; transform: translateY(-4px); box-shadow: 0 12px 44px rgba(37,211,102,.12); }
.psb .fc-ic { width: 48px; height: 48px; border-radius: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
.psb .fc-ic svg { width: 24px; height: 24px; stroke: #25D366; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.psb .fc h3 { font-size: 17px; font-weight: 800; color: #1a1a1a; margin-bottom: 10px; }
.psb .fc p  { font-size: 14px; color: #555; line-height: 1.65; }

/* STEPS (dark) */
.psb .steps-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 28px; margin-top: 56px; }
.psb .step { padding: 32px 28px; border-radius: 18px; background: #232323; border: 1px solid #2f2f2f; }
.psb .step-num { width: 44px; height: 44px; border-radius: 50%; background: #25D366; color: #fff; font-weight: 900; font-size: 18px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
.psb .step h3 { font-size: 20px; font-weight: 800; margin-bottom: 10px; color: #fff; }
.psb .step p { font-size: 14px; color: #aaa; line-height: 1.65; }

/* TESTIMONIALS */
.psb .testi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 56px; }
.psb .tc { background: #fafaf8; border: 1px solid #e8e8e0; border-radius: 18px; padding: 28px; display: flex; flex-direction: column; gap: 14px; }
.psb .tc-stars { color: #25D366; font-size: 14px; letter-spacing: 2px; }
.psb .tc-text { font-size: 15px; color: #444; line-height: 1.75; flex: 1; }
.psb .tc-auth { display: flex; gap: 12px; align-items: center; border-top: 1px solid #e8e8e0; padding-top: 14px; }
.psb .tc-av { width: 40px; height: 40px; border-radius: 50%; background: #f0fdf4; border: 1px solid #bbf7d0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #166534; }
.psb .tc-name { font-size: 14px; font-weight: 700; color: #1a1a1a; }
.psb .tc-role { font-size: 12px; color: #888; }

/* PRICING */
.psb .pricing-wrap { max-width: 900px; margin: 0 auto; padding: 0; }
.psb .pricing-head { text-align: left; }
.psb .pricing-h2 { font-family: 'Public Sans', sans-serif; font-weight: 900; font-size: 38px; letter-spacing: -1.5px; line-height: 1.1; color: #1a1a1a; }
.psb .pricing-sub { font-size: 15px; color: #888; margin-top: 12px; margin-bottom: 32px; }
.psb .billing-toggle-bar { display: inline-flex; align-items: center; gap: 14px; background: #fff; border: 1px solid #e8e8e0; border-radius: 9999px; padding: 6px 20px; margin-bottom: 40px; cursor: pointer; user-select: none; }
.psb .billing-lbl { font-size: 14px; font-weight: 500; transition: color .2s; }
.psb .billing-pill { position: relative; width: 44px; height: 24px; background: #25D366; border-radius: 9999px; flex-shrink: 0; }
.psb .billing-knob { position: absolute; top: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: left .2s ease; }
.psb .save-badge { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; transition: opacity .2s; }
.psb .plans-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
.psb .plan-card { background: #fff; border: 1px solid #e8e8e0; border-radius: 14px; padding: 28px 24px; transition: transform .2s, box-shadow .2s; display: flex; flex-direction: column; }
.psb .plan-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.07); }
.psb .plan-card.featured { background: #1a1a1a; border: 2px solid #1a1a1a; transform: scale(1.03); position: relative; }
.psb .plan-card.featured:hover { transform: scale(1.03) translateY(-3px); }
.psb .plan-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #25D366; color: #fff; font-size: 10px; font-weight: 700; padding: 4px 14px; border-radius: 9999px; white-space: nowrap; letter-spacing: 0.05em; }
.psb .plan-label { font-size: 11px; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
.psb .plan-card.featured .plan-label { color: #25D366; }
.psb .plan-price { display: flex; align-items: baseline; gap: 4px; line-height: 1; }
.psb .plan-num { font-weight: 900; font-size: 42px; letter-spacing: -2px; color: #1a1a1a; }
.psb .plan-card.featured .plan-num { color: #fff; }
.psb .plan-suffix { font-size: 13px; font-weight: 400; color: #aaa; }
.psb .plan-card.featured .plan-suffix { color: #555; }
.psb .plan-note { font-size: 12px; min-height: 18px; margin-top: 6px; color: #bbb; }
.psb .plan-card.featured .plan-note { color: #25D366; }
.psb .plan-btn { width: 100%; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 600; margin: 24px 0; text-align: center; display: block; transition: all .2s; }
.psb .plan-btn.ghost { border: 1.5px solid #e8e8e0; background: transparent; color: #555; }
.psb .plan-btn.ghost:hover { border-color: #25D366; color: #1a1a1a; }
.psb .plan-btn.fill { background: #25D366; color: #fff; border: none; }
.psb .plan-btn.fill:hover { background: #1ebe57; }
.psb .plan-feats { display: flex; flex-direction: column; gap: 9px; font-size: 13px; }
.psb .plan-feats li { display: flex; gap: 10px; align-items: flex-start; line-height: 1.45; }
.psb .feat-yes { color: #25D366; font-weight: 700; flex-shrink: 0; }
.psb .plan-card .plan-feats li.inc { color: #444; }
.psb .plan-card.featured .plan-feats li.inc { color: #ccc; }
.psb .feat-no { color: #ddd; font-weight: 700; flex-shrink: 0; }
.psb .plan-card .plan-feats li.exc { color: #bbb; }
.psb .plan-card.featured .feat-no { color: #444; }
.psb .plan-card.featured .plan-feats li.exc { color: #555; }
.psb .plan-divider { border-top: 1px solid #f0f0ea; margin: 8px 0; }
.psb .plan-card.featured .plan-divider { border-color: #2a2a2a; }
.psb .pricing-fine { text-align: center; margin-top: 24px; font-size: 13px; color: #aaa; }
.psb .guarantee-bar { max-width: 560px; margin: 28px auto 0; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 24px; display: flex; align-items: center; gap: 14px; }
.psb .g-icon { font-size: 28px; flex-shrink: 0; }
.psb .g-title { font-size: 14px; font-weight: 700; color: #166534; }
.psb .g-sub { font-size: 12px; color: #555; line-height: 1.5; margin-top: 2px; }

/* FAQ */
.psb .faq-list { margin-top: 56px; border: 1px solid #e8e8e0; border-radius: 18px; overflow: hidden; background: #fff; max-width: 820px; }
.psb .faq-item { border-bottom: 1px solid #e8e8e0; }
.psb .faq-item:last-child { border-bottom: none; }
.psb .faq-q { width: 100%; padding: 22px 28px; font-size: 16px; font-weight: 700; color: #1a1a1a; display: flex; justify-content: space-between; align-items: center; background: transparent; border: none; text-align: left; transition: background .2s; }
.psb .faq-q:hover { background: #fafaf8; }
.psb .faq-arr { color: #25D366; font-size: 24px; transition: transform .3s; line-height: 1; }
.psb .faq-a { padding: 0 28px; max-height: 0; overflow: hidden; font-size: 15px; color: #555; line-height: 1.75; transition: max-height .35s ease, padding .35s ease; }
.psb .faq-item.open .faq-a { max-height: 300px; padding: 0 28px 22px; }
.psb .faq-item.open .faq-arr { transform: rotate(45deg); }

/* CTA FINAL */
.psb .cta-inner { text-align: center; }
.psb .cta-inner h2 { font-size: clamp(36px, 4.5vw, 58px); font-weight: 900; letter-spacing: -2px; margin-bottom: 14px; color: #fff; }
.psb .cta-inner p { font-size: 18px; color: #aaa; margin-bottom: 38px; }
.psb .cta-btn { background: #25D366; color: #fff; border: none; font-size: 17px; font-weight: 700; padding: 16px 42px; border-radius: 10px; display: inline-flex; align-items: center; gap: 9px; transition: all .2s; }
.psb .cta-btn:hover { background: #1ebe57; transform: translateY(-2px); }
.psb .cta-note { margin-top: 18px; font-size: 13px; color: #888; }

/* FOOTER */
.psb .sec-footer { padding: 64px 52px 40px; }
.psb .f-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; max-width: 1200px; margin: 0 auto; }
.psb .f-brand .logo { font-size: 30px; }
.psb .f-brand .logo .lo-a { color: #fff; }
.psb .f-brand p { font-size: 14px; color: #6b7280; margin-top: 12px; max-width: 240px; line-height: 1.65; }
.psb .f-col h4 { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #6b7280; margin-bottom: 16px; }
.psb .f-col a { display: block; font-size: 14px; color: #9ca3af; margin-bottom: 10px; transition: color .2s; }
.psb .f-col a:hover { color: #fff; }
.psb .f-bottom { margin-top: 48px; padding-top: 24px; border-top: 1px solid #1f2937; display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #6b7280; flex-wrap: wrap; gap: 12px; max-width: 1200px; margin-left: auto; margin-right: auto; }

/* RESPONSIVE */
@media (max-width: 1024px) {
  .psb .navbar { padding: 14px 24px; }
  .psb .nav-links { display: none; }
}
@media (max-width: 900px) {
  .psb .sec { padding: 72px 20px; }
  .psb .what-grid, .psb .feats-grid, .psb .steps-grid, .psb .testi-grid, .psb .vs-comparison { grid-template-columns: 1fr; }
  .psb .vs-comparison { gap: 16px; }
  .psb .vs-divider { width: 100%; height: 40px; }
  .psb .stats-band { grid-template-columns: 1fr 1fr; }
  .psb .f-grid { grid-template-columns: 1fr 1fr; }
  .psb .dash-body { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 768px) {
  .psb .sec-pricing { padding: 48px 20px; }
  .psb .pricing-h2 { font-size: 28px; }
  .psb .plans-grid { grid-template-columns: 1fr; }
  .psb .plan-card.featured { transform: scale(1); }
  .psb .plan-card.featured:hover { transform: translateY(-3px); }
  .psb .plan-num { font-size: 36px; }
  .psb .billing-toggle-bar { font-size: 13px; }
}
@media (max-width: 640px) {
  .psb .hero h1 { font-size: 38px; letter-spacing: -1.5px; }
}
`;

const TICKER_ITEMS = [
  "Produtos Ilimitados",
  "Checkout pelo WhatsApp",
  "Zero Comissão por Venda",
  "Domínio Personalizado",
  "Cupons e Promoções",
  "Gestão de Estoque",
  "Relatórios em Tempo Real",
  "Temas Profissionais",
  "Suporte Humanizado",
  "Pagamentos Integrados",
];

const FEATURES = [
  { n: "01", Ic: Package, t: "Produtos ilimitados", d: "Cadastre quantos produtos quiser com fotos, variações de cor e tamanho, e controle de estoque completo." },
  { n: "02", Ic: MessageCircle, t: "Checkout pelo WhatsApp", d: "O cliente clica em 'comprar' e vai direto para o WhatsApp. Alta conversão, zero fricção, sem redirecionamentos." },
  { n: "03", Ic: Tag, t: "Cupons e promoções", d: "Crie cupons de desconto, promoções relâmpago e frete grátis para vender mais em datas especiais." },
  { n: "04", Ic: CreditCard, t: "Pagamentos integrados", d: "Aceite Pix, cartão de crédito e boleto. Integração com os principais gateways do Brasil já incluída." },
  { n: "05", Ic: Globe, t: "Domínio personalizado", d: "Use seu próprio domínio (.com.br) e transmita mais credibilidade e profissionalismo." },
  { n: "06", Ic: TrendingUp, t: "Analytics em tempo real", d: "Veja quais produtos vendem mais, de onde vêm seus clientes e quanto você fatura." },
];

const TESTIMONIALS = [
  { av: "AC", name: "Ana Costa", role: "Loja de roupas · SP", text: "Em 3 semanas já tinha recuperado o investimento. Minha loja ficou profissional e meus clientes adoraram comprar direto pelo WhatsApp." },
  { av: "MR", name: "Marcos Ribeiro", role: "Pet shop · MG", text: "Nunca imaginei que criar uma loja seria tão fácil. Em 30 minutos estava tudo no ar. Hoje faço 3x mais vendas do que antes." },
  { av: "JS", name: "Juliana Santos", role: "Cosméticos · RJ", text: "O suporte é incrível. Respondem em minutos pelo próprio WhatsApp. A plataforma é intuitiva e minha taxa de conversão disparou." },
];

const FAQS = [
  { q: "Preciso de cartão de crédito para testar?", a: "Não! Os 7 dias de teste são completamente gratuitos. Você só cadastra um meio de pagamento se decidir continuar após o período de teste." },
  { q: "Posso cancelar quando quiser?", a: "Sim, sem fidelidade. Você pode cancelar a qualquer momento diretamente pelo painel, sem burocracia e sem multas." },
  { q: "Como funciona o checkout pelo WhatsApp?", a: "Quando o cliente clica em 'comprar' na sua loja, ele é direcionado para uma conversa no WhatsApp onde finaliza o pedido. É direto, rápido e tem altíssima taxa de conversão." },
  { q: "Quais formas de pagamento posso aceitar?", a: "Você pode aceitar Pix, boleto bancário e cartão de crédito e débito. As integrações com os principais gateways do Brasil já estão incluídas em todos os planos." },
  { q: "Preciso de CNPJ para abrir minha loja?", a: "Não! Você pode começar com CPF. Quando formalizar como MEI ou empresa, basta atualizar os dados no painel sem precisar recriar a loja." },
  { q: "A ShopBox cobra comissão por venda?", a: "Não cobramos nenhuma comissão sobre suas vendas. Você paga apenas a mensalidade do plano e fica com 100% do que vender." },
  { q: "A ShopBox funciona em qualquer nicho?", a: "Sim! A plataforma atende lojistas de moda, acessórios, cosméticos, pet shop, alimentos, artesanato e muito mais." },
];

const WA_LINK = "https://wa.me/5518981586111?text=Ol%C3%A1,%20vim%20do%20site%20da%20Shopbox%20e%20quero%20vender%20mais%20pelo%20WhatsApp.";

function WhatsAppIcon({ size = 17, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.122 1.524 5.855L.057 23.143l5.432-1.424A11.948 11.948 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.666-.523-5.184-1.434l-.372-.22-3.225.846.861-3.14-.242-.385A9.951 9.951 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  );
}

function Logo({ className = "logo" }: { className?: string }) {
  return (
    <span className={className}>
      <span className="lo-a">Shop</span><span className="lo-b">Box</span>
    </span>
  );
}

const PLANS = [
  {
    label: "INICIAL",
    monthly: 47,
    annual: 38,
    annualNote: "R$451/ano — economize R$113",
    included: [
      "Até 200 produtos",
      "Checkout pelo WhatsApp",
      "Variações de cor e tamanho",
      "Controle de estoque",
      "3 fotos por produto",
      "1 banner (desktop + mobile)",
      "2 temas gratuitos",
      "CRM básico (100 clientes)",
      "Suporte via Central de Ajuda",
    ],
    excluded: ["Cupons e promoções", "Fotos ilimitadas", "Domínio personalizado"],
    featured: false,
  },
  {
    label: "PROFISSIONAL",
    monthly: 97,
    annual: 78,
    annualNote: "R$934/ano — economize R$230",
    included: [
      "Tudo do Plano Inicial",
      "Produtos ilimitados",
      "Fotos ilimitadas por produto",
      "Banners ilimitados",
      "Integra Google Analytics e Pixel do Facebook",
      "Vídeos no produto (YouTube, Reels, Vimeo)",
      "Cupons e promoções completas",
      "Combos (Leve 2 Pague 1, 2 por R$X)",
      "Pop-up de cupom de boas-vindas",
      "CRM ilimitado + exportar CSV",
      "Bulk actions de produtos",
      "Marketplace de temas premium",
      "Suporte via WhatsApp",
    ],
    excluded: ["Domínio personalizado", "Relatórios avançados"],
    featured: true,
  },
  {
    label: "PREMIUM",
    monthly: 197,
    annual: 158,
    annualNote: "R$1.891/ano — economize R$453",
    included: [
      "Tudo do Plano Profissional",
      "Múltiplas categorias por produto",
      "Edição de pedidos",
      "Notificador de pedidos",
      "Domínio personalizado (.com.br)",
      "Cor de destaque da loja personalizada",
      "Analytics avançado (produtos mais vistos)",
      "SEO por produto (meta title, description)",
      "Frete por CEP configurável",
      "Relatórios avançados",
      "3 temas gratuitos incluídos",
      "Suporte prioritário via WhatsApp",
    ],
    excluded: [],
    featured: false,
  },
];

function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    const onScroll = () => {};
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="psb">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* NAV */}
      <div className="sec-nav">
        <nav className="navbar">
          <Link to="/" aria-label="ShopBox"><Logo /></Link>
          <div className="nav-links">
            <a href="#sobre">Funcionalidades</a>
            <a href="#como-funciona">Como funciona</a>
            <Link to="/temas">Temas</Link>
            <a href="#precos">Preços</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="nav-cta">
            <Link to="/login" className="btn-ghost">Entrar</Link>
            <Link to="/cadastro" className="btn-cta">Testar grátis</Link>
          </div>
        </nav>
      </div>

      {/* HERO */}
      <div className="sec-hero">
        <div className="hero wrap">
          <div className="hero-badge">+12.000 lojas ativas no WhatsApp</div>
          <h1>
            A plataforma de <em>Vendas pelo WhatsApp.</em>
            <br />
            feita para vender de verdade
          </h1>
          <p className="hero-sub">
            Monte sua loja em minutos, compartilhe o link e comece a receber pedidos hoje. Sem marketplace, sem comissão, sem complicação.
          </p>
          <div className="hero-actions">
            <Link to="/cadastro" className="btn-hero">
              <WhatsAppIcon color="#fff" />
              Testar grátis por 7 dias
            </Link>
            <a href="#como-funciona" className="btn-outline">Como funciona →</a>
          </div>
          <p className="hero-note">
            Nota <strong>4.9</strong> por mais de <strong>12 mil lojistas</strong> · sem cartão de crédito
          </p>

          <div className="hero-dash">
            <div className="dash-bar">
              <div className="dr" /><div className="dy" /><div className="dg" />
              <span className="dash-url">minhaloja.shopboxapp.com.br</span>
            </div>
            <div className="dash-body">
              <div className="dc"><div className="dc-l">Faturamento</div><div className="dc-v">R$47k</div><div className="dc-t">↑ +23% esse mês</div></div>
              <div className="dc"><div className="dc-l">Pedidos</div><div className="dc-v">847</div><div className="dc-t">↑ +18% esse mês</div></div>
              <div className="dc"><div className="dc-l">Conversão</div><div className="dc-v">94%</div><div className="dc-t">↑ 3x mais que site</div></div>
              <div className="dc"><div className="dc-l">Clientes</div><div className="dc-v">1.2k</div><div className="dc-t">↑ +41 novos hoje</div></div>
              <div className="dc dc-table">
                <div className="dc-table-scroll">
                  <table>
                    <thead><tr><th>Produto</th><th>Cliente</th><th>Valor</th><th>Status</th></tr></thead>
                    <tbody>
                      <tr><td>Vestido Floral Rosa</td><td>Ana C.</td><td>R$ 189,90</td><td><span className="tg">Pago</span></td></tr>
                      <tr><td>Tênis Runner Pro</td><td>João M.</td><td>R$ 320,00</td><td><span className="tg">Pago</span></td></tr>
                      <tr><td>Bolsa em Couro</td><td>Maria L.</td><td>R$ 450,00</td><td><span className="ty">Pendente</span></td></tr>
                      <tr><td>Camisa Polo Classic</td><td>Pedro S.</td><td>R$ 89,90</td><td><span className="tg">Pago</span></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MARQUEE */}
      <div className="sec-marquee">
        <div className="marquee-wrap">
          <div className="marquee-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
              <div key={i} className="mi">{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* VITRINE / O QUE É (mint) */}
      <div className="sec-about" id="sobre">
        <div className="wrap sec">
          <div className="pill">O que é a ShopBox</div>
          <h2 className="sh2">Mais vendas,<br />menos complicação</h2>
          <p className="ssub">
            A ShopBox foi criada para quem vende pelo WhatsApp e quer uma loja profissional — sem marketplace, sem taxa por venda, sem setup técnico.
          </p>
          <div className="what-grid">
            <div className="wf-list">
              <div className="wf"><div className="wf-ic wf-ic-wa"><WhatsAppIcon size={22} color="#25D366" /></div><div><h4>Checkout nativo pelo WhatsApp</h4><p>Seus clientes finalizam a compra direto no WhatsApp. Sem redirecionar para sites externos — conversão até 3x maior.</p></div></div>
              <div className="wf"><div className="wf-ic"><Palette /></div><div><h4>Temas profissionais prontos</h4><p>Dezenas de temas para deixar sua loja com a cara da sua marca em minutos, sem designer ou desenvolvedor.</p></div></div>
              <div className="wf"><div className="wf-ic"><ClipboardList /></div><div><h4>Gestão completa de pedidos</h4><p>Acompanhe estoque, pedidos e pagamentos em um painel simples e intuitivo — tudo em um só lugar.</p></div></div>
              <div className="wf"><div className="wf-ic"><CreditCard /></div><div><h4>Pagamentos integrados</h4><p>Aceite Pix, cartão de crédito e boleto. Integrações com os principais gateways do Brasil já incluídas.</p></div></div>
            </div>
            <div>
              <div className="phone">
                <div className="ph-head">
                  <div className="ph-av">L</div>
                  <div>
                    <div className="ph-name">Loja da Ana</div>
                    <div className="ph-on">● online agora</div>
                  </div>
                </div>
                <div className="ph-prod">
                  <div className="ph-img">👗</div>
                  <div>
                    <div className="ph-pn">Vestido Floral Rosa</div>
                    <div className="ph-pp">R$ 189,90</div>
                  </div>
                </div>
                <div className="ph-btn">
                  <WhatsAppIcon size={15} color="#fff" />
                  Comprar pelo WhatsApp
                </div>
                <div className="ph-stat">
                  <div className="ph-sv">R$47k</div>
                  <div className="ph-sl">faturamento esse mês</div>
                </div>
              </div>
            </div>
          </div>
          <div className="stats-band">
            <div className="sc"><div className="sc-ic"><Users /></div><div className="sn">12k+</div><div className="sl">lojistas ativos</div></div>
            <div className="sc"><div className="sc-ic"><Zap /></div><div className="sn">3x</div><div className="sl">mais conversão vs site comum</div></div>
            <div className="sc"><div className="sc-ic"><Clock /></div><div className="sn">30min</div><div className="sl">para montar sua loja</div></div>
            <div className="sc"><div className="sc-ic"><Star /></div><div className="sn">4.9★</div><div className="sl">nota média dos lojistas</div></div>
          </div>
        </div>
      </div>

      {/* VS (cream) */}
      <div className="sec-vs">
        <div className="wrap sec">
          <div className="pill">Por que a ShopBox</div>
          <h2 className="sh2">Diga adeus às plataformas que cobram por cada venda</h2>
          <p className="ssub">
            Chatbots de IA, marketplaces genéricos e plataformas complexas — todos cobram comissão ou tiram o controle das suas vendas. A ShopBox não.
          </p>
          <div className="vs-comparison">
            <div className="vs-card vs-card-bad">
              <div className="vs-card-title">Outras plataformas</div>
              {[
                "Cobra comissão por venda",
                "Redireciona para sites externos",
                "Setup técnico complexo e demorado",
                "Suporte lento, genérico e impessoal",
                "Chatbot de IA com custo extra por interação",
                "Analytics bloqueado em planos premium",
                "Layouts engessados sem identidade",
              ].map((item) => (
                <div key={item} className="vs-item">
                  <span className="ic-bad">
                    <svg viewBox="0 0 14 14"><line x1="3" y1="3" x2="11" y2="11" /><line x1="11" y1="3" x2="3" y2="11" /></svg>
                  </span>
                  {item}
                </div>
              ))}
            </div>
            <div className="vs-divider"><div className="vs-badge-pill">VS</div></div>
            <div className="vs-card vs-card-good">
              <div className="vs-card-title">
                <WhatsAppIcon size={22} color="#166534" />
                ShopBox
              </div>
              {[
                "Zero comissão — 100% da venda é seu",
                "Checkout nativo dentro do WhatsApp",
                "Loja no ar em menos de 30 minutos",
                "Suporte humanizado via WhatsApp",
                "Catálogo automático integrado ao chat",
                "Analytics em tempo real em todos os planos",
                "Temas profissionais com sua identidade",
              ].map((item) => (
                <div key={item} className="vs-item">
                  <span className="ic-good">
                    <svg viewBox="0 0 14 14"><polyline points="2,7 5.5,11 12,3" /></svg>
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link to="/cadastro" className="btn-hero">Começar agora →</Link>
          </div>
        </div>
      </div>

      {/* FUNCIONALIDADES (white) */}
      <div className="sec-feats" id="sobre-feats">
        <div className="wrap sec">
          <div className="pill">Funcionalidades</div>
          <h2 className="sh2">Tudo que sua loja precisa<br />para vender mais</h2>
          <p className="ssub">Cada recurso foi desenvolvido do zero para quem vende pelo WhatsApp.</p>
          <div className="feats-grid">
            {FEATURES.map((f) => (
              <div key={f.n} className="fc" data-n={f.n}>
                <div className="fc-ic"><f.Ic /></div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COMO FUNCIONA (dark) */}
      <div className="sec-steps" id="como-funciona">
        <div className="wrap sec">
          <div className="pill" style={{ background: "#232323", border: "1px solid #2f2f2f", color: "#aaa" }}>Como funciona</div>
          <h2 className="sh2">Comece a vender em <em>3 passos.</em></h2>
          <p className="ssub">Sem complexidade, sem burocracia. Sua loja no ar em menos de 30 minutos.</p>
          <div className="steps-grid">
            <div className="step"><div className="step-num">1</div><h3>Crie sua conta</h3><p>Cadastre-se em menos de 2 minutos. Sem cartão de crédito, sem burocracia. 7 dias grátis para testar tudo sem limites.</p></div>
            <div className="step"><div className="step-num">2</div><h3>Monte sua loja</h3><p>Adicione seus produtos, escolha um tema profissional e configure os meios de pagamento que preferir. Tudo sem código.</p></div>
            <div className="step"><div className="step-num">3</div><h3>Compartilhe e venda</h3><p>Envie o link da sua loja pelo WhatsApp e comece a receber pedidos. Seus clientes compram sem sair do app.</p></div>
          </div>
        </div>
      </div>

      {/* DEPOIMENTOS (white) */}
      <div className="sec-testi">
        <div className="wrap sec">
          <div className="pill">Depoimentos</div>
          <h2 className="sh2">O que dizem sobre<br />a ShopBox</h2>
          <p className="ssub">Mais de 12.000 lojistas já transformaram seu negócio com a ShopBox.</p>
          <div className="testi-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.av} className="tc">
                <div className="tc-stars">★★★★★</div>
                <p className="tc-text">{t.text}</p>
                <div className="tc-auth">
                  <div className="tc-av">{t.av}</div>
                  <div>
                    <div className="tc-name">{t.name}</div>
                    <div className="tc-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING (cream) */}
      <div className="sec-pricing" id="precos" style={{ padding: "72px 40px" }}>
        <div className="pricing-wrap">
          <div className="pricing-head">
            <span className="pill">Planos</span>
            <h2 className="pricing-h2">Sem surpresas,<br />sem letras miúdas.</h2>
            <p className="pricing-sub">Escolha o plano certo para sua loja. Mude quando quiser.</p>

            <button
              type="button"
              className="billing-toggle-bar"
              onClick={() => setIsAnnual((v) => !v)}
              aria-label="Alternar entre cobrança mensal e anual"
            >
              <span className="billing-lbl" style={{ color: isAnnual ? "#aaa" : "#1a1a1a" }}>Mensal</span>
              <span className="billing-pill">
                <span className="billing-knob" style={{ left: isAnnual ? "23px" : "3px" }} />
              </span>
              <span className="billing-lbl" style={{ color: isAnnual ? "#1a1a1a" : "#aaa" }}>Anual</span>
              <span className="save-badge" style={{ opacity: isAnnual ? 1 : 0.4 }}>Economize 20%</span>
            </button>
          </div>

          <div className="plans-grid">
            {PLANS.map((p) => (
              <div key={p.label} className={`plan-card${p.featured ? " featured" : ""}`}>
                {p.featured && <span className="plan-badge">MAIS POPULAR</span>}
                <div className="plan-label">{p.label}</div>
                <div className="plan-price">
                  <span className="plan-num">R${isAnnual ? p.annual : p.monthly}</span>
                  <span className="plan-suffix">/mês</span>
                </div>
                <div className="plan-note">{isAnnual ? p.annualNote : ""}</div>

                <Link to="/cadastro" className={`plan-btn ${p.featured ? "fill" : "ghost"}`}>
                  Testar grátis por 7 dias
                </Link>

                <ul className="plan-feats">
                  {p.included.map((f) => (
                    <li key={f} className="inc">
                      <span className="feat-yes">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                  {p.excluded.length > 0 && <li className="plan-divider" />}
                  {p.excluded.map((f) => (
                    <li key={f} className="exc">
                      <span className="feat-no">✗</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="pricing-fine">
            7 dias grátis em todos os planos · sem cartão · cancele quando quiser
          </p>

          <div className="guarantee-bar">
            <div className="g-icon">🛡️</div>
            <div>
              <div className="g-title">Garantia de 7 dias sem risco</div>
              <div className="g-sub">Não ficou satisfeito? Devolvemos 100% do valor pago. Sem perguntas, sem burocracia.</div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ (white) */}
      <div className="sec-faq" id="faq">
        <div className="wrap sec">
          <div className="pill">FAQ</div>
          <h2 className="sh2">Perguntas frequentes</h2>
          <div className="faq-list">
            {FAQS.map((f, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? "open" : ""}`}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {f.q}
                  <span className="faq-arr">+</span>
                </button>
                <div className="faq-a">{f.a}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 48, padding: 40, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 18 }}>
            <p style={{ color: "#555", marginBottom: 18, fontSize: 16 }}>Ainda tem dúvidas? Fale diretamente com a gente</p>
            <a href={WA_LINK} target="_blank" rel="noreferrer" className="btn-hero">
              <WhatsAppIcon color="#fff" />
              Enviar mensagem
            </a>
          </div>
        </div>
      </div>

      {/* CTA FINAL (dark) */}
      <div className="sec-cta">
        <div className="wrap sec cta-inner">
          <h2>Pronto para criar sua loja?</h2>
          <p>Mais de 12.000 lojistas já vendem pelo WhatsApp com a ShopBox</p>
          <Link to="/cadastro" className="cta-btn">
            Testar grátis por 7 dias
          </Link>
          <p className="cta-note">
            Nota <strong style={{ color: "#ccc" }}>4.9</strong> · +12 mil lojistas · 7 dias grátis · sem cartão de crédito
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="sec-footer">
        <div className="f-grid">
          <div className="f-brand">
            <Logo />
            <p>A plataforma de e-commerce feita para quem vende pelo WhatsApp. Simples, rápido e sem comissão.</p>
          </div>
          <div className="f-col">
            <h4>Produto</h4>
            <a href="#sobre-feats">Funcionalidades</a>
            <a href="#">Temas</a>
            <a href="#">Integrações</a>
            <a href="#precos">Preços</a>
          </div>
          <div className="f-col">
            <h4>Empresa</h4>
            <a href="#">Sobre nós</a>
            <a href="#">Blog</a>
            <a href="#">Parceiros</a>
            <a href="#">Contato</a>
          </div>
          <div className="f-col">
            <h4>Suporte</h4>
            <a href="#">Central de ajuda</a>
            <a href={WA_LINK} target="_blank" rel="noreferrer">WhatsApp</a>
            <Link to="/termos">Termos de uso</Link>
            <Link to="/privacidade">Privacidade</Link>
          </div>
        </div>
        <div className="f-bottom">
          <span>© 2026 ShopBox. Todos os direitos reservados.</span>
          <span>Feito com ❤️ para lojistas brasileiros</span>
        </div>
      </footer>
    </div>
  );
}
