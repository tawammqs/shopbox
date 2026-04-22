import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import logoUrl from "@/assets/shopbox-logo.png";

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
        href: "https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500&display=swap",
      },
    ],
  }),
  component: LandingPage,
});

const STYLES = `
.pdark, .pdark *, .pdark *::before, .pdark *::after { box-sizing: border-box; margin: 0; padding: 0; }
.pdark {
  --green: #00c853;
  --green-mid: #00b248;
  --green-dark: #007a32;
  --green-xdark: #004d20;
  --dk-bg: #07100a;
  --dk-bg2: #0c180e;
  --dk-surface: #121e14;
  --dk-surface2: #182b1a;
  --dk-border: rgba(0,200,83,0.14);
  --dk-text: #eef8f0;
  --dk-text2: #8fb898;
  --dk-text3: #4e7557;
  --cl-bg: #f4faf5;
  --cl-bg2: #eaf4ec;
  --cl-surface: #ffffff;
  --cl-border: rgba(0,150,60,0.14);
  --cl-text: #0a1a0d;
  --cl-text2: #3d6345;
  --cl-text3: #7aaa82;
  --whatsapp: #25d366;
  --ff: 'Public Sans', system-ui, sans-serif;
  font-family: var(--ff);
  font-size: 16px;
  line-height: 1.6;
  overflow-x: hidden;
}
.pdark a { text-decoration: none; color: inherit; }

.pdark .dark  { background: var(--dk-bg);  color: var(--dk-text); position: relative; }
.pdark .dark2 { background: var(--dk-bg2); color: var(--dk-text); position: relative; }
.pdark .clean { background: var(--cl-bg);  color: var(--cl-text); }
.pdark .clean2 { background: var(--cl-surface); color: var(--cl-text); }

/* NAV */
.pdark .pd-nav-bar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 52px; height: 88px;
  background: rgba(7,16,10,0.92);
  backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--dk-border);
}
.pdark .nav-logo { display: flex; align-items: center; }
.pdark .nav-logo img { height: 65px; display: block; filter: brightness(0) invert(1); transition: height .2s; }
@media (max-width: 1024px) {
  .pdark .pd-nav-bar { height: 78px; }
  .pdark .nav-logo img { height: 58px; }
}
@media (max-width: 640px) {
  .pdark .pd-nav-bar { height: 70px; }
  .pdark .nav-logo img { height: 50px; }
}
.pdark .nav-links { display: flex; align-items: center; gap: 34px; }
.pdark .nav-links a { font-size: 14px; font-weight: 500; color: var(--dk-text2); transition: color .2s; cursor: pointer; }
.pdark .nav-links a:hover { color: var(--dk-text); }
.pdark .nav-cta { display: flex; align-items: center; gap: 12px; }
.pdark .btn-ghost { font-size: 14px; font-weight: 500; color: var(--dk-text2); padding: 8px 20px; border-radius: 8px; border: 1px solid var(--dk-border); transition: all .2s; background: transparent; cursor: pointer; }
.pdark .btn-ghost:hover { color: var(--dk-text); border-color: rgba(0,200,83,.4); }
.pdark .btn-cta { font-size: 14px; font-weight: 700; color: #040a05; padding: 9px 22px; border-radius: 8px; background: var(--green); transition: all .2s; border: none; cursor: pointer; display: inline-block; }
.pdark .btn-cta:hover { background: #33d974; transform: translateY(-1px); }

/* HERO */
.pdark .hero {
  min-height: 100vh; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 110px 24px 80px;
}
.pdark .hero-radial {
  position: absolute; top: -160px; left: 50%; transform: translateX(-50%);
  width: 1000px; height: 680px;
  background: radial-gradient(ellipse at 50% 0%, rgba(0,200,83,.13) 0%, transparent 68%);
  pointer-events: none; z-index: 0;
}
.pdark .hero > * { position: relative; z-index: 1; }
.pdark .hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(0,200,83,.1); border: 1px solid rgba(0,200,83,.28);
  border-radius: 100px; padding: 6px 18px;
  font-size: 13px; font-weight: 600; color: var(--green);
  margin-bottom: 32px; animation: pdfadeUp .55s ease both;
}
.pdark .hero-badge::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); animation: pdblink 2s infinite; }
@keyframes pdblink { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
.pdark .hero h1 { font-size: clamp(44px, 6.2vw, 80px); font-weight: 900; letter-spacing: -2.5px; line-height: 1.08; max-width: 860px; animation: pdfadeUp .55s .08s ease both; color: var(--dk-text); }
.pdark .hero h1 em { font-style: normal; color: var(--green); }
.pdark .hero-sub { margin-top: 22px; font-size: clamp(16px, 1.4vw, 19px); color: var(--dk-text2); max-width: 560px; line-height: 1.75; font-weight: 400; animation: pdfadeUp .55s .16s ease both; }
.pdark .hero-actions { margin-top: 40px; display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; animation: pdfadeUp .55s .24s ease both; }
.pdark .btn-hero { font-size: 16px; font-weight: 800; color: #040a05; padding: 14px 34px; border-radius: 10px; background: var(--green); display: inline-flex; align-items: center; gap: 9px; box-shadow: 0 0 36px rgba(0,200,83,.32); transition: all .22s; border: none; cursor: pointer; }
.pdark .btn-hero:hover { background: #33d974; transform: translateY(-2px); box-shadow: 0 0 54px rgba(0,200,83,.42); }
.pdark .btn-outline { font-size: 16px; font-weight: 600; color: var(--dk-text2); padding: 14px 34px; border-radius: 10px; border: 1px solid var(--dk-border); transition: all .22s; display: inline-flex; align-items: center; gap: 8px; background: transparent; cursor: pointer; }
.pdark .btn-outline:hover { color: var(--dk-text); border-color: rgba(0,200,83,.45); }
.pdark .hero-note { margin-top: 20px; font-size: 13px; color: var(--dk-text3); animation: pdfadeUp .55s .32s ease both; }
.pdark .hero-note strong { color: var(--dk-text2); }

/* HERO DASHBOARD */
.pdark .hero-dash { margin-top: 68px; width: 100%; max-width: 1020px; background: var(--dk-surface); border: 1px solid var(--dk-border); border-radius: 22px; overflow: hidden; box-shadow: 0 0 100px rgba(0,200,83,.1), 0 48px 96px rgba(0,0,0,.55); animation: pdfadeUp .8s .4s ease both; }
.pdark .dash-bar { background: var(--dk-bg2); padding: 13px 20px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--dk-border); }
.pdark .dr { width: 12px; height: 12px; border-radius: 50%; background: #ff5f57 }
.pdark .dy { width: 12px; height: 12px; border-radius: 50%; background: #febc2e }
.pdark .dg { width: 12px; height: 12px; border-radius: 50%; background: #28c840 }
.pdark .dash-url { margin-left: 12px; font-size: 12px; color: var(--dk-text3); }
.pdark .dash-body { padding: 28px; display: grid; grid-template-columns: repeat(4,1fr); gap: 18px; }
.pdark .dc { background: var(--dk-bg); border: 1px solid var(--dk-border); border-radius: 12px; padding: 20px; }
.pdark .dc-l { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; color: var(--dk-text3); }
.pdark .dc-v { font-size: 28px; font-weight: 900; color: var(--dk-text); margin-top: 6px; letter-spacing: -1px; }
.pdark .dc-t { font-size: 12px; color: var(--green); margin-top: 4px; font-weight: 600; }
.pdark .dc-table { grid-column: 1/-1; }
.pdark .dc-table table { width: 100%; border-collapse: collapse; }
.pdark .dc-table th { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--dk-text3); padding: 8px 14px; text-align: left; font-weight: 600; }
.pdark .dc-table td { font-size: 14px; color: var(--dk-text2); padding: 11px 14px; border-top: 1px solid var(--dk-border); }
.pdark .tg { color: var(--green); background: rgba(0,200,83,.1); padding: 2px 10px; border-radius: 100px; font-size: 12px; font-weight: 600; }
.pdark .ty { color: #fbb040; background: rgba(251,176,64,.1); padding: 2px 10px; border-radius: 100px; font-size: 12px; font-weight: 600; }
@keyframes pdfadeUp { from { opacity: 0; transform: translateY(22px) } to { opacity: 1; transform: translateY(0) } }

/* MARQUEE */
.pdark .marquee-wrap { overflow: hidden; padding: 17px 0; border-top: 1px solid var(--dk-border); border-bottom: 1px solid var(--dk-border); background: var(--dk-bg2); }
.pdark .marquee-track { display: flex; white-space: nowrap; animation: pdmq 28s linear infinite; }
.pdark .marquee-track:hover { animation-play-state: paused; }
.pdark .mi { display: inline-flex; align-items: center; gap: 9px; padding: 0 30px; font-size: 13.5px; font-weight: 600; color: var(--dk-text3); flex-shrink: 0; }
.pdark .mi::before { content: '✓'; color: var(--green); }
@keyframes pdmq { from { transform: translateX(0) } to { transform: translateX(-50%) } }

/* LAYOUT UTIL */
.pdark .wrap { max-width: 1200px; margin: 0 auto; padding: 96px 52px; }
.pdark .section-tag { display: inline-flex; align-items: center; gap: 10px; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 2.2px; color: var(--green); margin-bottom: 18px; }
.pdark .section-tag::before { content: ''; width: 18px; height: 1.5px; background: currentColor; }
.pdark .section-tag.cl { color: var(--green-dark); }
.pdark .sh2 { font-size: clamp(30px, 3.8vw, 50px); font-weight: 900; letter-spacing: -1.5px; line-height: 1.1; max-width: 680px; margin-bottom: 18px; }
.pdark .ssub { font-size: 17px; line-height: 1.75; font-weight: 400; max-width: 540px; }

/* WHAT */
.pdark .what-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; margin-top: 60px; }
.pdark .wf-list { display: flex; flex-direction: column; gap: 16px; }
.pdark .wf { display: flex; gap: 16px; align-items: flex-start; padding: 20px 22px; border-radius: 14px; border: 1px solid var(--cl-border); background: var(--cl-surface); transition: all .22s; box-shadow: 0 1px 4px rgba(0,0,0,.04); }
.pdark .wf:hover { border-color: rgba(0,150,60,.35); box-shadow: 0 4px 24px rgba(0,150,60,.08); }
.pdark .wf-ic { width: 42px; height: 42px; flex-shrink: 0; border-radius: 10px; background: rgba(0,200,83,.1); display: flex; align-items: center; justify-content: center; font-size: 20px; }
.pdark .wf h4 { font-size: 15px; font-weight: 700; color: var(--cl-text); margin-bottom: 4px; }
.pdark .wf p  { font-size: 14px; color: var(--cl-text2); line-height: 1.6; }

/* PHONE MOCK */
.pdark .phone { background: #fff; border: 1px solid var(--cl-border); border-radius: 26px; padding: 28px; max-width: 330px; margin: 0 auto; box-shadow: 0 12px 64px rgba(0,100,40,.1); }
.pdark .ph-head { display: flex; align-items: center; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid var(--cl-border); margin-bottom: 18px; }
.pdark .ph-av { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, var(--green), var(--green-dark)); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px; color: #fff; }
.pdark .ph-name { font-size: 15px; font-weight: 700; color: var(--cl-text); }
.pdark .ph-on { font-size: 12px; color: var(--green); font-weight: 600; }
.pdark .ph-prod { background: var(--cl-bg); border-radius: 14px; padding: 16px; display: flex; gap: 14px; align-items: center; margin-bottom: 14px; border: 1px solid var(--cl-border); }
.pdark .ph-img { width: 56px; height: 56px; border-radius: 10px; background: linear-gradient(135deg,#d4f5dc,#a8e6b4); display: flex; align-items: center; justify-content: center; font-size: 26px; }
.pdark .ph-pn { font-size: 14px; font-weight: 700; color: var(--cl-text); }
.pdark .ph-pp { font-size: 20px; font-weight: 900; color: var(--green); margin-top: 2px; }
.pdark .ph-btn { width: 100%; padding: 13px; background: var(--green); border-radius: 11px; text-align: center; color: #fff; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
.pdark .ph-stat { margin-top: 18px; text-align: center; }
.pdark .ph-sv { font-size: 30px; font-weight: 900; color: var(--green); letter-spacing: -1px; }
.pdark .ph-sl { font-size: 12px; color: var(--cl-text3); font-weight: 500; }

/* STATS */
.pdark .stats-band { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: var(--cl-border); border: 1px solid var(--cl-border); border-radius: 16px; overflow: hidden; margin-top: 60px; }
.pdark .sc { background: #fff; padding: 32px 24px; text-align: center; transition: background .2s; }
.pdark .sc:hover { background: var(--cl-bg2); }
.pdark .sn { font-size: 42px; font-weight: 900; color: var(--cl-text); letter-spacing: -2px; }
.pdark .sn em { font-style: normal; color: var(--green); }
.pdark .sl { font-size: 13.5px; color: var(--cl-text2); margin-top: 6px; font-weight: 500; }

/* VS */
.pdark .vs-comparison { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0; align-items: stretch; margin-top: 56px; }
.pdark .vs-card { border-radius: 22px; padding: 36px; }
.pdark .vs-card-bad { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); }
.pdark .vs-card-good { background: rgba(0,200,83,0.05); border: 2px solid rgba(0,200,83,0.45); box-shadow: 0 0 60px rgba(0,200,83,0.1); }
.pdark .vs-card-title { font-size: 16px; font-weight: 800; margin-bottom: 28px; color: var(--dk-text); display: flex; align-items: center; gap: 10px; }
.pdark .vs-card-bad .vs-card-title { color: var(--dk-text2); }
.pdark .vs-card-good .vs-card-title { color: var(--green); }
.pdark .vs-divider { display: flex; align-items: center; justify-content: center; width: 72px; flex-shrink: 0; }
.pdark .vs-badge-pill { background: var(--dk-bg); border: 1.5px solid var(--dk-border); border-radius: 100px; padding: 8px 14px; font-size: 12px; font-weight: 900; color: var(--dk-text3); letter-spacing: 1px; }
.pdark .vs-item { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; line-height: 1.5; }
.pdark .vs-item:last-child { border-bottom: none; }
.pdark .vs-card-bad .vs-item { color: var(--dk-text3); }
.pdark .vs-card-good .vs-item { color: var(--dk-text); font-weight: 500; }
.pdark .ic-bad { width: 28px; height: 28px; flex-shrink: 0; border-radius: 8px; background: rgba(224,85,85,0.12); border: 1px solid rgba(224,85,85,0.2); display: flex; align-items: center; justify-content: center; }
.pdark .ic-bad svg { width: 14px; height: 14px; stroke: #e05555; fill: none; stroke-width: 2.5; stroke-linecap: round; }
.pdark .ic-good { width: 28px; height: 28px; flex-shrink: 0; border-radius: 8px; background: rgba(0,200,83,0.15); border: 1px solid rgba(0,200,83,0.3); display: flex; align-items: center; justify-content: center; }
.pdark .ic-good svg { width: 14px; height: 14px; stroke: var(--green); fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }

/* FEATURES */
.pdark .feats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 56px; }
.pdark .fc { background: #fff; border: 1px solid var(--cl-border); border-radius: 18px; padding: 30px; position: relative; overflow: hidden; transition: all .25s; box-shadow: 0 1px 4px rgba(0,0,0,.04); }
.pdark .fc::after { content: attr(data-n); position: absolute; right: 18px; top: 12px; font-size: 64px; font-weight: 900; color: rgba(0,150,60,.05); line-height: 1; pointer-events: none; letter-spacing: -3px; }
.pdark .fc:hover { border-color: rgba(0,150,60,.35); transform: translateY(-4px); box-shadow: 0 10px 40px rgba(0,150,60,.1); }
.pdark .fc-ic { font-size: 28px; margin-bottom: 16px; }
.pdark .fc h3 { font-size: 17px; font-weight: 800; color: var(--cl-text); margin-bottom: 8px; }
.pdark .fc p  { font-size: 14px; color: var(--cl-text2); line-height: 1.65; }

/* STEPS */
.pdark .steps-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 28px; margin-top: 56px; }
.pdark .step { position: relative; padding: 32px 28px; border-radius: 18px; background: var(--dk-surface); border: 1px solid var(--dk-border); }
.pdark .step::after { content: '→'; position: absolute; right: -18px; top: 50%; transform: translateY(-50%); font-size: 20px; color: var(--dk-text3); }
.pdark .step:last-child::after { display: none; }
.pdark .step-n { font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; color: var(--green); margin-bottom: 14px; }
.pdark .step h3 { font-size: 20px; font-weight: 800; margin-bottom: 10px; color: var(--dk-text); }
.pdark .step p { font-size: 14px; color: var(--dk-text2); line-height: 1.65; }

/* TESTIMONIALS */
.pdark .testi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 56px; }
.pdark .tc { background: var(--dk-surface); border: 1px solid var(--dk-border); border-radius: 18px; padding: 28px; display: flex; flex-direction: column; gap: 14px; transition: border-color .2s; }
.pdark .tc:hover { border-color: rgba(0,200,83,.32); }
.pdark .tc-stars { color: var(--green); font-size: 14px; letter-spacing: 2px; }
.pdark .tc-text { font-size: 15px; color: var(--dk-text2); line-height: 1.75; flex: 1; font-weight: 400; }
.pdark .tc-auth { display: flex; gap: 12px; align-items: center; border-top: 1px solid var(--dk-border); padding-top: 14px; }
.pdark .tc-av { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--green-dark), var(--dk-bg)); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: var(--green); }
.pdark .tc-name { font-size: 14px; font-weight: 700; color: var(--dk-text); }
.pdark .tc-role { font-size: 12px; color: var(--dk-text3); }

/* PRICING */
.pdark .billing-toggle { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 40px; }
.pdark .billing-label { font-size: 14px; font-weight: 600; color: var(--cl-text3); transition: color .2s; }
.pdark .billing-label.active { color: var(--cl-text); }
.pdark .billing-switch { position: relative; display: inline-flex; height: 28px; width: 50px; align-items: center; border-radius: 999px; background: #d1ddd3; cursor: pointer; border: none; transition: background .2s; padding: 0; flex-shrink: 0; }
.pdark .billing-switch.on { background: var(--green); }
.pdark .billing-switch:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }
.pdark .billing-thumb { display: inline-block; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.2); transform: translateX(4px); transition: transform .2s; }
.pdark .billing-switch.on .billing-thumb { transform: translateX(26px); }
.pdark .billing-badge { display: inline-flex; align-items: center; background: rgba(0,200,83,.12); color: var(--green-dark); font-size: 11px; font-weight: 700; padding: 5px 11px; border-radius: 999px; }

.pdark .pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 36px; }
.pdark .pc { background: #fff; border: 1px solid var(--cl-border); border-radius: 22px; padding: 34px; position: relative; transition: all .22s; box-shadow: 0 1px 4px rgba(0,0,0,.04); display: flex; flex-direction: column; }
.pdark .pc.pop { border-color: var(--green); background: linear-gradient(160deg, rgba(0,200,83,.06) 0%, #fff 60%); box-shadow: 0 8px 40px rgba(0,200,83,.14); }
.pdark .pop-lb { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: var(--green); color: #040a05; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 18px; border-radius: 100px; }
.pdark .pc-plan { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: var(--cl-text3); margin-bottom: 12px; }
.pdark .pc-val { font-size: 46px; font-weight: 900; color: var(--cl-text); letter-spacing: -2px; line-height: 1; display: flex; align-items: baseline; gap: 4px; }
.pdark .pc-val sup { font-size: 22px; color: var(--cl-text2); font-weight: 600; vertical-align: super; }
.pdark .pc-val sub { font-size: 14px; color: var(--cl-text3); font-weight: 500; vertical-align: baseline; }
.pdark .pc-per { font-size: 13px; color: var(--cl-text3); margin: 6px 0 6px; min-height: 20px; }
.pdark .pc-savings { overflow: hidden; max-height: 0; opacity: 0; transition: max-height .25s ease, opacity .2s ease, margin .2s ease; font-size: 12px; font-weight: 600; color: var(--green-dark); }
.pdark .pc-savings.show { max-height: 32px; opacity: 1; margin-top: 4px; margin-bottom: 6px; }
.pdark .pc-desc { font-size: 13px; color: var(--cl-text2); margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid var(--cl-border); margin-top: 14px; }
.pdark .pc-list { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; flex: 1; }
.pdark .pc-list li { display: flex; gap: 10px; font-size: 14px; color: var(--cl-text2); align-items: flex-start; }
.pdark .pc-check { width: 20px; height: 20px; flex-shrink: 0; border-radius: 6px; background: rgba(0,200,83,0.15); border: 1px solid rgba(0,200,83,0.3); display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }
.pdark .pc-check svg { width: 11px; height: 11px; stroke: var(--green); fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.pdark .bp { width: 100%; padding: 14px; border-radius: 10px; text-align: center; display: block; font-size: 14px; font-weight: 800; transition: all .2s; cursor: pointer; }
.pdark .bp.out { border: 1.5px solid var(--cl-border); color: var(--cl-text2); background: transparent; }
.pdark .bp.out:hover { border-color: rgba(0,150,60,.5); color: var(--cl-text); }
.pdark .bp.fill { background: var(--green); color: #040a05; border: none; }
.pdark .bp.fill:hover { background: #33d974; }
.pdark .p-note { text-align: center; font-size: 13px; color: var(--cl-text3); margin-top: 22px; font-weight: 500; }
.pdark .p-note strong { color: var(--green-dark); }

/* FAQ */
.pdark .faq-list { margin-top: 56px; border: 1px solid var(--cl-border); border-radius: 18px; overflow: hidden; background: #fff; }
.pdark .faq-item { border-bottom: 1px solid var(--cl-border); }
.pdark .faq-item:last-child { border-bottom: none; }
.pdark .faq-q { width: 100%; padding: 22px 28px; font-size: 16px; font-weight: 700; color: var(--cl-text); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background .2s; user-select: none; background: transparent; border: none; text-align: left; }
.pdark .faq-q:hover { background: var(--cl-bg); }
.pdark .faq-arr { color: var(--green); font-size: 24px; transition: transform .3s; flex-shrink: 0; line-height: 1; font-weight: 400; }
.pdark .faq-a { padding: 0 28px; max-height: 0; overflow: hidden; font-size: 15px; color: var(--cl-text2); line-height: 1.75; transition: max-height .35s ease, padding .35s ease; }
.pdark .faq-item.open .faq-a { max-height: 260px; padding: 0 28px 22px; }
.pdark .faq-item.open .faq-arr { transform: rotate(45deg); }

/* CTA FINAL */
.pdark .cta-sec { text-align: center; padding: 100px 52px; position: relative; }
.pdark .cta-sec::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 800px; height: 500px; background: radial-gradient(ellipse, rgba(0,200,83,.11) 0%, transparent 68%); pointer-events: none; z-index: 0; }
.pdark .cta-sec > * { position: relative; z-index: 1; }
.pdark .cta-sec h2 { font-size: clamp(36px, 4.5vw, 58px); font-weight: 900; letter-spacing: -2px; margin-bottom: 14px; color: var(--dk-text); }
.pdark .cta-sec p { font-size: 18px; color: var(--dk-text2); margin-bottom: 38px; font-weight: 400; }
.pdark .cta-note { margin-top: 18px; font-size: 13px; color: var(--dk-text3); }
.pdark .cta-note strong { color: var(--dk-text2); }

/* FOOTER */
.pdark .pd-foot { background: var(--dk-bg); border-top: 1px solid var(--dk-border); padding: 64px 52px 40px; }
.pdark .f-inner { max-width: 1200px; margin: 0 auto; }
.pdark .f-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
.pdark .f-brand img { height: 48px; filter: brightness(0) invert(1); }
.pdark .f-brand p { font-size: 14px; color: var(--dk-text3); margin-top: 12px; max-width: 240px; line-height: 1.65; }
.pdark .f-col h4 { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: var(--dk-text3); margin-bottom: 16px; }
.pdark .f-col a { display: block; font-size: 14px; color: var(--dk-text3); margin-bottom: 10px; transition: color .2s; cursor: pointer; }
.pdark .f-col a:hover { color: var(--dk-text); }
.pdark .f-bottom { margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--dk-border); display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--dk-text3); flex-wrap: wrap; gap: 12px; }

/* WA float */
.pdark .wa { position: fixed; bottom: 28px; right: 28px; z-index: 300; width: 56px; height: 56px; border-radius: 50%; background: var(--whatsapp); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 28px rgba(37,211,102,.45); cursor: pointer; transition: transform .2s; }
.pdark .wa:hover { transform: scale(1.1); }
.pdark .wa svg { width: 28px; height: 28px; fill: white; }

/* RESPONSIVE */
@media (max-width: 900px) {
  .pdark .pd-nav-bar { padding: 0 20px; }
  .pdark .nav-links { display: none; }
  .pdark .wrap, .pdark .pd-foot { padding-left: 20px; padding-right: 20px; }
  .pdark .wrap { padding-top: 72px; padding-bottom: 72px; }
  .pdark .what-grid, .pdark .feats-grid, .pdark .steps-grid, .pdark .testi-grid, .pdark .pricing-grid { grid-template-columns: 1fr; }
  .pdark .stats-band { grid-template-columns: 1fr 1fr; }
  .pdark .step::after { display: none; }
  .pdark .vs-comparison { grid-template-columns: 1fr; gap: 16px; }
  .pdark .vs-divider { width: 100%; height: 40px; }
  .pdark .f-grid { grid-template-columns: 1fr 1fr; }
  .pdark .dash-body { grid-template-columns: 1fr 1fr; }
  .pdark .hero h1 { font-size: 40px; letter-spacing: -1.5px; }
  .pdark .cta-sec { padding: 72px 20px; }
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
  { n: "01", ic: "📦", t: "Produtos ilimitados", d: "Cadastre quantos produtos quiser com fotos, variações de cor e tamanho, e controle de estoque completo." },
  { n: "02", ic: "💬", t: "Checkout pelo WhatsApp", d: "O cliente clica em 'comprar' e vai direto para o WhatsApp. Alta conversão, zero fricção, sem redirecionamentos." },
  { n: "03", ic: "🏷️", t: "Cupons e promoções", d: "Crie cupons de desconto, promoções relâmpago e frete grátis para vender mais em datas especiais." },
  { n: "04", ic: "💳", t: "Pagamentos integrados", d: "Aceite Pix, cartão de crédito e boleto. Integração com os principais gateways do Brasil já incluída." },
  { n: "05", ic: "🌐", t: "Domínio personalizado", d: "Use seu próprio domínio (.com.br) e transmita mais credibilidade e profissionalismo." },
  { n: "06", ic: "📈", t: "Analytics em tempo real", d: "Veja quais produtos vendem mais, de onde vêm seus clientes e quanto você fatura." },
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

function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const isYearly = billing === "yearly";

  return (
    <div className="pdark">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* NAV */}
      <nav className="pd-nav-bar">
        <Link to="/" className="nav-logo">
          <img src={logoUrl} alt="ShopBox" />
        </Link>
        <div className="nav-links">
          <a href="#sobre">Funcionalidades</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#precos">Preços</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="nav-cta">
          <Link to="/login" className="btn-ghost">Entrar</Link>
          <Link to="/cadastro" className="btn-cta">Testar grátis</Link>
        </div>
      </nav>

      {/* HERO · DARK */}
      <div className="dark">
        <div className="hero-radial" />
        <div className="hero">
          <div className="hero-badge">+12.000 lojas ativas no WhatsApp</div>
          <h1>
            A plataforma de <em>e-commerce</em>
            <br />
            feita para o WhatsApp
          </h1>
          <p className="hero-sub">
            Monte sua loja em minutos, compartilhe o link e comece a receber pedidos hoje. Sem marketplace, sem comissão, sem complicação.
          </p>
          <div className="hero-actions">
            <Link to="/cadastro" className="btn-hero">
              <WhatsAppIcon />
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

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <div key={i} className="mi">{t}</div>
          ))}
        </div>
      </div>

      {/* O QUE É · CLEAN */}
      <div className="clean" id="sobre" style={{ borderTop: "1px solid var(--cl-border)" }}>
        <div className="wrap">
          <div className="section-tag cl">O que é a ShopBox</div>
          <h2 className="sh2">Mais vendas,<br />menos complicação</h2>
          <p className="ssub" style={{ color: "var(--cl-text2)" }}>
            A ShopBox foi criada para quem vende pelo WhatsApp e quer uma loja profissional — sem marketplace, sem taxa por venda, sem setup técnico.
          </p>
          <div className="what-grid">
            <div className="wf-list">
              <div className="wf"><div className="wf-ic">💬</div><div><h4>Checkout nativo pelo WhatsApp</h4><p>Seus clientes finalizam a compra direto no WhatsApp. Sem redirecionar para sites externos — conversão até 3x maior.</p></div></div>
              <div className="wf"><div className="wf-ic">🎨</div><div><h4>Temas profissionais prontos</h4><p>Dezenas de temas para deixar sua loja com a cara da sua marca em minutos, sem designer ou desenvolvedor.</p></div></div>
              <div className="wf"><div className="wf-ic">📊</div><div><h4>Gestão completa de pedidos</h4><p>Acompanhe estoque, pedidos e pagamentos em um painel simples e intuitivo — tudo em um só lugar.</p></div></div>
              <div className="wf"><div className="wf-ic">💳</div><div><h4>Pagamentos integrados</h4><p>Aceite Pix, cartão de crédito e boleto. Integrações com os principais gateways do Brasil já incluídas.</p></div></div>
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
                  <WhatsAppIcon size={15} color="white" />
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
            <div className="sc"><div className="sn"><em>12k</em>+</div><div className="sl">lojistas ativos</div></div>
            <div className="sc"><div className="sn"><em>3x</em></div><div className="sl">mais conversão vs site comum</div></div>
            <div className="sc"><div className="sn"><em>30</em>min</div><div className="sl">para montar sua loja</div></div>
            <div className="sc"><div className="sn"><em>4.9</em>★</div><div className="sl">nota média dos lojistas</div></div>
          </div>
        </div>
      </div>

      {/* VS · DARK */}
      <div className="dark2" style={{ borderTop: "1px solid var(--dk-border)" }}>
        <div className="wrap">
          <div className="section-tag">Por que a ShopBox</div>
          <h2 className="sh2">Diga adeus às plataformas que cobram por cada venda</h2>
          <p className="ssub" style={{ color: "var(--dk-text2)" }}>
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
                <WhatsAppIcon size={22} />
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
            <Link to="/cadastro" className="btn-hero" style={{ display: "inline-flex" }}>Começar agora →</Link>
          </div>
        </div>
      </div>

      {/* FUNCIONALIDADES · CLEAN */}
      <div className="clean" id="sobre-feats" style={{ borderTop: "1px solid var(--cl-border)" }}>
        <div className="wrap">
          <div className="section-tag cl">Funcionalidades</div>
          <h2 className="sh2">Tudo que sua loja precisa<br />para vender mais</h2>
          <p className="ssub" style={{ color: "var(--cl-text2)" }}>
            Cada recurso foi desenvolvido do zero para quem vende pelo WhatsApp.
          </p>
          <div className="feats-grid">
            {FEATURES.map((f) => (
              <div key={f.n} className="fc" data-n={f.n}>
                <div className="fc-ic">{f.ic}</div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COMO FUNCIONA · DARK */}
      <div className="dark" id="como-funciona" style={{ borderTop: "1px solid var(--dk-border)" }}>
        <div className="wrap">
          <div className="section-tag">Como funciona</div>
          <h2 className="sh2">Comece a vender<br />em 3 passos</h2>
          <p className="ssub" style={{ color: "var(--dk-text2)" }}>
            Sem complexidade, sem burocracia. Sua loja no ar em menos de 30 minutos.
          </p>
          <div className="steps-grid">
            <div className="step"><div className="step-n">— passo 01</div><h3>Crie sua conta</h3><p>Cadastre-se em menos de 2 minutos. Sem cartão de crédito, sem burocracia. 7 dias grátis para testar tudo sem limites.</p></div>
            <div className="step"><div className="step-n">— passo 02</div><h3>Monte sua loja</h3><p>Adicione seus produtos, escolha um tema profissional e configure os meios de pagamento que preferir. Tudo sem código.</p></div>
            <div className="step"><div className="step-n">— passo 03</div><h3>Compartilhe e venda</h3><p>Envie o link da sua loja pelo WhatsApp e comece a receber pedidos. Seus clientes compram sem sair do app.</p></div>
          </div>
        </div>
      </div>

      {/* DEPOIMENTOS · DARK */}
      <div className="dark2" style={{ borderTop: "1px solid var(--dk-border)" }}>
        <div className="wrap">
          <div className="section-tag">Depoimentos</div>
          <h2 className="sh2">O que dizem sobre<br />a ShopBox</h2>
          <p className="ssub" style={{ color: "var(--dk-text2)" }}>
            Mais de 12.000 lojistas já transformaram seu negócio com a ShopBox.
          </p>
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

      {/* PREÇOS · CLEAN */}
      <div className="clean" id="precos" style={{ borderTop: "1px solid var(--cl-border)" }}>
        <div className="wrap">
          <div style={{ textAlign: "center" }}>
            <div className="section-tag cl" style={{ justifyContent: "center" }}>Planos</div>
            <h2 className="sh2" style={{ margin: "0 auto" }}>Sem surpresas,<br />sem letras miúdas</h2>
            <p className="ssub" style={{ color: "var(--cl-text2)", margin: "14px auto 0" }}>
              7 dias grátis em todos os planos. Sem cartão de crédito.
            </p>
          </div>
          <div className="billing-toggle">
            <span className={`billing-label ${!isYearly ? "active" : ""}`}>Mensal</span>
            <button
              type="button"
              role="switch"
              aria-checked={isYearly}
              aria-label="Alternar entre cobrança mensal e anual"
              onClick={() => setBilling(isYearly ? "monthly" : "yearly")}
              className={`billing-switch ${isYearly ? "on" : ""}`}
            >
              <span className="billing-thumb" />
            </button>
            <span className={`billing-label ${isYearly ? "active" : ""}`}>Anual</span>
            <span className="billing-badge">2 meses grátis</span>
          </div>
          <div className="pricing-grid">
            <PricingCard
              label="Inicial"
              price="47"
              yearlyMonthly="38"
              yearlyTotal="456"
              savings="108"
              isYearly={isYearly}
              desc="Para quem está começando a vender online."
              feats={["Até 50 produtos", "Checkout pelo WhatsApp", "1 usuário", "Relatórios básicos", "Suporte por email"]}
              cta="out"
            />
            <PricingCard
              label="Profissional"
              price="97"
              yearlyMonthly="78"
              yearlyTotal="936"
              savings="228"
              isYearly={isYearly}
              desc="Para lojas em crescimento que querem vender mais."
              feats={["Produtos ilimitados", "Checkout + catálogo automático", "3 usuários", "Cupons e promoções", "Domínio personalizado", "Suporte prioritário"]}
              cta="fill"
              pop
            />
            <PricingCard
              label="Premium"
              price="197"
              yearlyMonthly="158"
              yearlyTotal="1.896"
              savings="468"
              isYearly={isYearly}
              desc="Para negócios que precisam de escala e controle total."
              feats={["Tudo do Profissional", "Usuários ilimitados", "API de integração", "Relatórios avançados", "Gerente de conta dedicado", "SLA garantido"]}
              cta="out"
            />
          </div>
          <p className="p-note">
            <strong>7 dias grátis</strong> em todos os planos · sem cartão de crédito · cancele quando quiser
          </p>
        </div>
      </div>

      {/* FAQ · CLEAN2 */}
      <div className="clean2" id="faq" style={{ borderTop: "1px solid var(--cl-border)" }}>
        <div className="wrap">
          <div className="section-tag" style={{ color: "var(--green-dark)" }}>FAQ</div>
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
          <div style={{ textAlign: "center", marginTop: 48, padding: 40, background: "var(--cl-bg)", border: "1px solid var(--cl-border)", borderRadius: 18 }}>
            <p style={{ color: "var(--cl-text2)", marginBottom: 18, fontSize: 16 }}>Ainda tem dúvidas? Fale diretamente com a gente</p>
            <a href={WA_LINK} target="_blank" rel="noreferrer" className="btn-hero" style={{ background: "var(--whatsapp)", boxShadow: "0 0 36px rgba(37,211,102,.3)", color: "#fff" }}>
              <WhatsAppIcon color="#fff" />
              Enviar mensagem
            </a>
          </div>
        </div>
      </div>

      {/* CTA FINAL · DARK */}
      <div className="dark" style={{ borderTop: "1px solid var(--dk-border)" }}>
        <div className="cta-sec">
          <h2>Pronto para criar sua loja?</h2>
          <p>Mais de 12.000 lojistas já vendem pelo WhatsApp com a ShopBox</p>
          <Link to="/cadastro" className="btn-hero" style={{ display: "inline-flex", fontSize: 17, padding: "16px 42px" }}>
            Testar grátis por 7 dias
          </Link>
          <p className="cta-note">
            Nota <strong>4.9</strong> · +12 mil lojistas · 7 dias grátis · sem cartão de crédito
          </p>
        </div>
      </div>

      {/* FOOTER · DARK */}
      <footer className="pd-foot">
        <div className="f-inner">
          <div className="f-grid">
            <div className="f-brand">
              <img src={logoUrl} alt="ShopBox" />
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
        </div>
      </footer>

      {/* WA float */}
      <a href={WA_LINK} target="_blank" rel="noreferrer" className="wa" title="Falar pelo WhatsApp">
        <WhatsAppIcon size={28} color="white" />
      </a>
    </div>
  );
}

function PricingCard({
  label, price, desc, feats, cta, pop,
  isYearly = false, yearlyMonthly, yearlyTotal, savings,
}: {
  label: string;
  price: string;
  desc: string;
  feats: string[];
  cta: "fill" | "out";
  pop?: boolean;
  isYearly?: boolean;
  yearlyMonthly?: string;
  yearlyTotal?: string;
  savings?: string;
}) {
  const displayPrice = isYearly && yearlyMonthly ? yearlyMonthly : price;
  return (
    <div className={`pc ${pop ? "pop" : ""}`}>
      {pop && <div className="pop-lb">Mais Popular</div>}
      <div className="pc-plan">{label}</div>
      <div className="pc-val">
        <sup>R$</sup>{displayPrice}<sub>/mês</sub>
      </div>
      <div className="pc-per">{isYearly ? "cobrança anual" : "cobrança mensal"}</div>
      <div className={`pc-savings ${isYearly && yearlyTotal ? "show" : ""}`} aria-hidden={!isYearly}>
        R${yearlyTotal}/ano · economize R${savings}
      </div>
      <p className="pc-desc">{desc}</p>
      <ul className="pc-list">
        {feats.map((f) => (
          <li key={f}>
            <span className="pc-check">
              <svg viewBox="0 0 14 14"><polyline points="2,7 5.5,11 12,3" /></svg>
            </span>
            {f}
          </li>
        ))}
      </ul>
      <Link to="/cadastro" className={`bp ${cta}`}>Testar grátis por 7 dias</Link>
    </div>
  );
}
