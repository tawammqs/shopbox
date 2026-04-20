import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/preview-dark")({
  head: () => ({
    meta: [
      { title: "Preview Dark — ShopBox" },
      { name: "description", content: "Preview do design escuro premium ShopBox" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/geist-font@1.3.1/dist/geist.css",
      },
    ],
  }),
  component: PreviewDark,
});

const STYLES = `
.pdark *,.pdark *::before,.pdark *::after{box-sizing:border-box;margin:0;padding:0}
.pdark{
  --g:#25D366;--g2:#1ebe57;--g3:#128C7E;
  --gl:rgba(37,211,102,0.12);--gl2:rgba(37,211,102,0.06);
  --dark:#0a0f0a;--dark2:#111811;--dark3:#161e16;--card:#141a14;
  --border:rgba(37,211,102,0.15);--border2:rgba(255,255,255,0.07);
  --text:#f0f7f0;--muted:#7a9a7a;--muted2:#5a7a5a;
  --sans:'Geist',system-ui,sans-serif;--mono:'Geist Mono',monospace;
  font-family:var(--sans);color:var(--text);background:var(--dark);font-size:16px;line-height:1.6;overflow-x:hidden;min-height:100vh;
}

/* HEADER */
.pdark .pd-header{position:sticky;top:0;z-index:100;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 5%;background:rgba(10,15,10,0.85);backdrop-filter:blur(16px);border-bottom:1px solid var(--border2)}
.pdark .pd-logo{display:flex;align-items:center;gap:8px;font-size:18px;font-weight:700;color:#fff;text-decoration:none}
.pdark .pd-logo-dot{width:8px;height:8px;border-radius:50%;background:var(--g)}
.pdark nav.pd-nav{display:flex;gap:2rem;align-items:center}
.pdark .pd-nav a{color:var(--muted);text-decoration:none;font-size:14px;font-weight:500;transition:color .2s}
.pdark .pd-nav a:hover{color:var(--text)}
.pdark .hdr-right{display:flex;align-items:center;gap:12px}
.pdark .btn-ghost{color:var(--muted);font-size:14px;font-weight:500;text-decoration:none;transition:color .2s}
.pdark .btn-ghost:hover{color:var(--text)}
.pdark .btn-g{background:var(--g);color:#fff;border:none;padding:9px 20px;border-radius:999px;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block;transition:background .2s}
.pdark .btn-g:hover{background:var(--g2)}
.pdark .btn-outline{background:transparent;color:var(--g);border:1px solid var(--g);padding:9px 20px;border-radius:999px;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block;transition:all .2s}
.pdark .btn-outline:hover{background:var(--gl)}

/* HERO */
.pdark .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 5% 80px;position:relative;overflow:hidden}
.pdark .hero-glow{position:absolute;top:0;left:50%;transform:translateX(-50%);width:800px;height:500px;background:radial-gradient(ellipse at 50% 0%, rgba(37,211,102,0.18) 0%, transparent 70%);pointer-events:none}
.pdark .hero-grid{position:absolute;inset:0;background-image:linear-gradient(var(--border2) 1px,transparent 1px),linear-gradient(90deg,var(--border2) 1px,transparent 1px);background-size:60px 60px;-webkit-mask-image:radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%);mask-image:radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%);opacity:.4}
.pdark .hero-badge{position:relative;display:inline-flex;align-items:center;gap:8px;background:var(--gl);border:1px solid var(--border);color:var(--g);font-size:12px;font-weight:500;padding:5px 14px;border-radius:999px;margin-bottom:28px;font-family:var(--mono)}
.pdark .hero-badge::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--g);animation:pdpulse 2s infinite}
@keyframes pdpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}
.pdark .hero h1{position:relative;font-size:clamp(44px,6vw,80px);font-weight:900;line-height:1.0;letter-spacing:-3px;color:#fff;margin-bottom:24px;max-width:900px}
.pdark .hero h1 em{font-style:normal;color:var(--g)}
.pdark .hero-sub{position:relative;font-size:18px;color:var(--muted);line-height:1.65;margin-bottom:40px;max-width:540px;font-weight:400}
.pdark .hero-ctas{position:relative;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:48px}
.pdark .btn-hero-lg{padding:15px 32px;font-size:16px;border-radius:999px;font-weight:700}
.pdark .hero-social-proof{position:relative;display:flex;align-items:center;gap:12px;justify-content:center}
.pdark .avatars{display:flex}
.pdark .avatar{width:32px;height:32px;border-radius:50%;border:2px solid var(--dark);background:var(--card);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--g);margin-left:-8px;font-family:var(--mono)}
.pdark .avatar:first-child{margin-left:0}
.pdark .proof-text{font-size:13px;color:var(--muted);font-family:var(--mono)}
.pdark .proof-text strong{color:var(--g)}

/* phone mockup */
.pdark .hero-mockup{margin-top:64px;position:relative;display:flex;justify-content:center;align-items:flex-start;gap:24px}
.pdark .phone{width:240px;border-radius:32px;border:1.5px solid var(--border);background:#0d150d;overflow:hidden;flex-shrink:0}
.pdark .phone-bar{background:var(--g);padding:10px 14px;display:flex;align-items:center;gap:8px}
.pdark .phone-bar-av{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.25)}
.pdark .phone-bar-txt p{font-size:12px;font-weight:600;color:#fff;margin:0}
.pdark .phone-bar-txt span{font-size:10px;color:rgba(255,255,255,.75);font-family:var(--mono)}
.pdark .phone-chat{padding:10px;display:flex;flex-direction:column;gap:7px;background:#0c1a0c;min-height:260px}
.pdark .bubble{padding:7px 11px;border-radius:10px;font-size:11.5px;line-height:1.45;max-width:82%}
.pdark .b-in{background:#1a2e1a;border-radius:2px 10px 10px 10px;align-self:flex-start;color:var(--text)}
.pdark .b-out{background:#054a1f;border-radius:10px 2px 10px 10px;align-self:flex-end;color:#d4f7e0}
.pdark .b-card{background:#1a2e1a;border-radius:10px;overflow:hidden;width:88%;align-self:flex-start}
.pdark .b-card-img{background:linear-gradient(135deg,#0d2a0d,#1a4a1a);height:72px;display:flex;align-items:center;justify-content:center;font-size:28px}
.pdark .b-card-body{padding:7px 10px}
.pdark .b-card-body p{font-size:11px;font-weight:600;color:var(--text);margin:0}
.pdark .b-card-body span{font-size:11px;color:var(--g);font-weight:700;font-family:var(--mono)}
.pdark .b-card-btn{background:var(--g);color:#fff;font-size:11px;font-weight:600;padding:6px;text-align:center;cursor:pointer}
.pdark .float-card{position:absolute;right:-20px;top:40px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;white-space:nowrap}
.pdark .float-dot{width:8px;height:8px;border-radius:50%;background:var(--g);flex-shrink:0;animation:pdpulse 2s infinite}
.pdark .float-card p{font-size:12px;font-weight:500;color:var(--text);margin:0}
.pdark .float-card span{font-size:11px;color:var(--muted);font-family:var(--mono)}
.pdark .float-metric{position:absolute;left:-24px;bottom:40px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 16px}
.pdark .float-metric-num{font-size:22px;font-weight:700;color:var(--g);font-family:var(--mono);line-height:1}
.pdark .float-metric-lbl{font-size:11px;color:var(--muted);margin-top:2px}

/* TICKER */
.pdark .ticker-wrap{background:var(--gl2);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:14px 0;overflow:hidden}
.pdark .ticker{display:flex;gap:0;animation:pdticker 30s linear infinite;width:max-content}
@keyframes pdticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.pdark .ticker-item{display:flex;align-items:center;gap:10px;padding:0 32px;font-size:13px;font-weight:500;font-family:var(--mono);color:var(--muted);white-space:nowrap}
.pdark .ticker-dot{width:4px;height:4px;border-radius:50%;background:var(--g)}

/* SECTIONS */
.pdark .section{padding:100px 5%;max-width:1200px;margin:0 auto}
.pdark .section-full{padding:100px 5%}
.pdark .stag{font-size:11px;font-weight:500;color:var(--g);text-transform:uppercase;letter-spacing:2px;font-family:var(--mono);margin-bottom:14px}
.pdark .stitle{font-size:clamp(30px,3.5vw,48px);font-weight:900;letter-spacing:-2px;color:#fff;line-height:1.05;margin-bottom:16px}
.pdark .ssub{font-size:16px;color:var(--muted);line-height:1.7;max-width:560px}

/* SPLIT */
.pdark .split{display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:center}
.pdark .split-features{display:flex;flex-direction:column;gap:20px;margin-top:36px}
.pdark .sf{display:flex;gap:14px;align-items:flex-start}
.pdark .sf-icon{width:36px;height:36px;border-radius:8px;background:var(--gl);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pdark .sf-icon svg{width:18px;height:18px;stroke:var(--g);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.pdark .sf-txt h4{font-size:15px;font-weight:600;color:#fff;margin-bottom:4px}
.pdark .sf-txt p{font-size:13px;color:var(--muted);line-height:1.6}

/* dashboard mockup */
.pdark .dash-mockup{background:var(--dark3);border:1px solid var(--border2);border-radius:16px;overflow:hidden}
.pdark .dash-bar{background:var(--dark2);padding:10px 16px;display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--border2)}
.pdark .db{width:10px;height:10px;border-radius:50%}
.pdark .dash-content{padding:20px}
.pdark .dash-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px}
.pdark .dash-stat{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px}
.pdark .dash-stat-n{font-size:20px;font-weight:700;color:var(--g);font-family:var(--mono);line-height:1}
.pdark .dash-stat-l{font-size:11px;color:var(--muted);margin-top:4px}
.pdark .dash-table{background:var(--card);border:1px solid var(--border2);border-radius:10px;overflow:hidden}
.pdark .dt-head{display:grid;grid-template-columns:1fr 1fr 80px;padding:10px 14px;border-bottom:1px solid var(--border2)}
.pdark .dt-head span{font-size:11px;font-weight:500;color:var(--muted2);font-family:var(--mono);text-transform:uppercase;letter-spacing:.5px}
.pdark .dt-row{display:grid;grid-template-columns:1fr 1fr 80px;padding:10px 14px;border-bottom:1px solid var(--border2);align-items:center}
.pdark .dt-row:last-child{border-bottom:none}
.pdark .dt-row span{font-size:12px;color:var(--text)}
.pdark .dt-badge{font-size:10px;font-weight:500;padding:3px 8px;border-radius:999px;font-family:var(--mono)}
.pdark .dt-pago{background:rgba(37,211,102,.15);color:var(--g)}
.pdark .dt-pend{background:rgba(255,200,50,.1);color:#f5c842}

/* HELLO */
.pdark .hello-bg{background:var(--dark2)}
.pdark .hello-inner{max-width:1200px;margin:0 auto;padding:100px 5%}
.pdark .hello-grid{display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:center}
.pdark .hello-scroll{border:1px solid var(--border);border-radius:16px;overflow:hidden;background:var(--card)}
.pdark .hs-head{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center}
.pdark .hs-dot{width:8px;height:8px;border-radius:50%;background:var(--g)}
.pdark .hs-head span{font-size:12px;font-family:var(--mono);color:var(--muted)}
.pdark .hs-item{display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid var(--border2);transition:background .2s}
.pdark .hs-item:last-child{border-bottom:none}
.pdark .hs-item:hover{background:var(--gl2)}
.pdark .hs-check{width:20px;height:20px;border-radius:50%;background:var(--gl);border:1px solid var(--g);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pdark .hs-check svg{width:10px;height:10px;stroke:var(--g);fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.pdark .hs-item span{font-size:14px;color:var(--text);font-weight:500}
.pdark .hello-text{display:flex;flex-direction:column;gap:12px}
.pdark .hello-text .stag{margin-bottom:0}

/* FEATURES GRID */
.pdark .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border2);border:1px solid var(--border2);border-radius:16px;overflow:hidden}
.pdark .feat-card{background:var(--dark);padding:32px 28px;transition:background .3s}
.pdark .feat-card:hover{background:var(--dark3)}
.pdark .feat-num{font-size:11px;font-weight:500;color:var(--muted2);font-family:var(--mono);margin-bottom:20px}
.pdark .feat-icon{width:44px;height:44px;border-radius:10px;background:var(--gl);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;margin-bottom:16px}
.pdark .feat-icon svg{width:22px;height:22px;stroke:var(--g);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.pdark .feat-card h3{font-size:16px;font-weight:600;color:#fff;margin-bottom:8px}
.pdark .feat-card p{font-size:13px;color:var(--muted);line-height:1.65}

/* STEPS */
.pdark .steps-bg{background:var(--dark2)}
.pdark .steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:56px}
.pdark .step-card{background:var(--card);border:1px solid var(--border2);border-radius:16px;padding:32px 28px;position:relative;overflow:hidden}
.pdark .step-card::before{content:attr(data-n);position:absolute;top:-10px;right:16px;font-size:80px;font-weight:900;color:rgba(37,211,102,.05);font-family:var(--mono);line-height:1}
.pdark .step-n{font-size:11px;font-weight:500;color:var(--g);font-family:var(--mono);margin-bottom:16px;letter-spacing:1px}
.pdark .step-card h3{font-size:18px;font-weight:700;color:#fff;margin-bottom:10px}
.pdark .step-card p{font-size:14px;color:var(--muted);line-height:1.65}

/* TESTIMONIALS */
.pdark .testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:56px}
.pdark .testi-card{background:var(--card);border:1px solid var(--border2);border-radius:16px;padding:28px 24px;display:flex;flex-direction:column;gap:0}
.pdark .testi-stars{display:flex;gap:3px;margin-bottom:16px}
.pdark .star{color:var(--g);font-size:14px}
.pdark .testi-text{font-size:14px;color:var(--text);line-height:1.75;margin-bottom:24px;flex:1}
.pdark .testi-author{display:flex;align-items:center;gap:10px;border-top:1px solid var(--border2);padding-top:16px}
.pdark .testi-av{width:36px;height:36px;border-radius:50%;background:var(--gl);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--g);font-family:var(--mono);flex-shrink:0}
.pdark .testi-name{font-size:13px;font-weight:600;color:#fff}
.pdark .testi-role{font-size:11px;color:var(--muted);font-family:var(--mono)}

/* metrics strip */
.pdark .metrics-strip{background:var(--dark2);border-top:1px solid var(--border2);border-bottom:1px solid var(--border2)}
.pdark .metrics-inner{max-width:1200px;margin:0 auto;padding:48px 5%;display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem}
.pdark .metric{text-align:center;padding:0 1rem;border-right:1px solid var(--border2)}
.pdark .metric:last-child{border-right:none}
.pdark .metric-num{font-size:40px;font-weight:900;color:var(--g);font-family:var(--mono);letter-spacing:-2px;line-height:1}
.pdark .metric-lbl{font-size:13px;color:var(--muted);margin-top:6px}

/* PRICING */
.pdark .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:56px}
.pdark .p-card{background:var(--card);border:1px solid var(--border2);border-radius:20px;padding:32px 28px;display:flex;flex-direction:column;position:relative;transition:border-color .2s}
.pdark .p-card:hover{border-color:var(--muted2)}
.pdark .p-card.pop{border-color:var(--g)}
.pdark .pop-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--g);color:#fff;font-size:11px;font-weight:500;padding:4px 16px;border-radius:999px;white-space:nowrap;font-family:var(--mono);letter-spacing:.5px}
.pdark .p-label{font-size:11px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;font-family:var(--mono)}
.pdark .p-price{font-size:44px;font-weight:900;color:#fff;letter-spacing:-2px;line-height:1;margin-bottom:6px}
.pdark .p-price sup{font-size:18px;font-weight:500;vertical-align:super;font-family:var(--mono)}
.pdark .p-price sub{font-size:14px;font-weight:400;color:var(--muted);letter-spacing:0;font-family:var(--mono)}
.pdark .p-desc{font-size:13px;color:var(--muted);margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid var(--border2)}
.pdark .p-feats{list-style:none;display:flex;flex-direction:column;gap:11px;margin-bottom:28px;flex:1}
.pdark .p-feats li{font-size:13px;color:var(--text);display:flex;align-items:center;gap:9px}
.pdark .p-check{width:16px;height:16px;border-radius:50%;background:var(--gl);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pdark .p-check svg{width:9px;height:9px;stroke:var(--g);fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.pdark .p-note{text-align:center;font-size:12px;color:var(--muted2);margin-top:24px;font-family:var(--mono)}

/* FAQ */
.pdark .faq-bg{background:var(--dark2)}
.pdark .faq-inner{max-width:720px;margin:0 auto;margin-top:56px}
.pdark .faq-item{border-bottom:1px solid var(--border2)}
.pdark .faq-q{width:100%;padding:20px 0;background:transparent;text-align:left;border:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-size:15px;font-weight:600;color:#fff;gap:16px;transition:color .2s}
.pdark .faq-q:hover,.pdark .faq-q.open{color:var(--g)}
.pdark .faq-icon svg{stroke:var(--muted);transition:transform .3s,stroke .2s;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
.pdark .faq-q.open .faq-icon svg{transform:rotate(45deg);stroke:var(--g)}
.pdark .faq-a{max-height:0;overflow:hidden;transition:max-height .35s ease,padding .3s ease;font-size:14px;color:var(--muted);line-height:1.75}
.pdark .faq-a.open{max-height:300px;padding-bottom:20px}

/* CTA FINAL */
.pdark .cta-final{background:var(--g);padding:100px 5%;text-align:center;position:relative;overflow:hidden}
.pdark .cta-final::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% -20%, rgba(255,255,255,.15) 0%, transparent 60%);pointer-events:none}
.pdark .cta-final h2{position:relative;font-size:clamp(36px,5vw,60px);font-weight:900;color:#fff;letter-spacing:-2px;margin-bottom:14px;line-height:1.05}
.pdark .cta-final p{position:relative;font-size:16px;color:rgba(255,255,255,.85);margin-bottom:36px;font-family:var(--mono)}
.pdark .btn-white{position:relative;background:#fff;color:var(--g);border:none;padding:15px 36px;border-radius:999px;font-size:16px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block;transition:all .2s}
.pdark .btn-white:hover{background:rgba(255,255,255,.92);transform:translateY(-1px)}

/* FOOTER */
.pdark .pd-footer{background:#050a05;padding:64px 5% 32px}
.pdark .foot-inner{max-width:1200px;margin:0 auto}
.pdark .foot-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:3rem;margin-bottom:48px}
.pdark .foot-brand p{font-size:13px;color:var(--muted2);line-height:1.75;margin-top:14px;max-width:280px}
.pdark .foot-col h4{font-size:11px;font-weight:500;color:var(--muted);margin-bottom:16px;text-transform:uppercase;letter-spacing:1.5px;font-family:var(--mono)}
.pdark .foot-col a{display:block;font-size:13px;color:var(--muted2);text-decoration:none;margin-bottom:10px;transition:color .2s}
.pdark .foot-col a:hover{color:var(--g)}
.pdark .foot-bottom{border-top:1px solid var(--border2);padding-top:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.pdark .foot-bottom p{font-size:12px;color:var(--muted2);font-family:var(--mono)}
.pdark .foot-socials{display:flex;gap:10px}
.pdark .soc{width:34px;height:34px;border-radius:8px;background:var(--dark3);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;transition:all .2s;cursor:pointer}
.pdark .soc:hover{background:var(--gl);border-color:var(--border)}
.pdark .soc svg{width:15px;height:15px;fill:var(--muted2);transition:fill .2s}
.pdark .soc:hover svg{fill:var(--g)}

/* preview banner */
.pdark .pd-preview-banner{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:200;background:var(--card);border:1px solid var(--border);border-radius:999px;padding:8px 18px;font-size:12px;font-family:var(--mono);color:var(--g);display:flex;gap:14px;align-items:center;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.pdark .pd-preview-banner a{color:var(--text);text-decoration:underline;text-decoration-color:var(--border)}

@media(max-width:900px){
  .pdark nav.pd-nav,.pdark .hdr-right .btn-outline{display:none}
  .pdark .hero h1{letter-spacing:-2px}
  .pdark .split,.pdark .hello-grid,.pdark .feat-grid{grid-template-columns:1fr}
  .pdark .hero-mockup{display:none}
  .pdark .pricing-grid,.pdark .testi-grid,.pdark .steps-grid,.pdark .foot-grid{grid-template-columns:1fr}
  .pdark .metrics-inner{grid-template-columns:repeat(2,1fr)}
  .pdark .metric{border-right:none;border-bottom:1px solid var(--border2);padding-bottom:24px}
}
`;

const TICKER_ITEMS = [
  "Produtos ilimitados", "Checkout pelo WhatsApp", "Cupons e promoções", "Gestão de estoque",
  "Domínio personalizado", "Relatórios em tempo real", "Temas profissionais", "Suporte humanizado",
];

const HELLO_ITEMS = [
  "checkout nativo pelo WhatsApp", "zero comissão por venda", "catálogo automático integrado",
  "temas profissionais inclusos", "gestão de estoque em tempo real", "domínio personalizado incluso",
  "suporte humanizado via WhatsApp", "relatórios e analytics integrados",
];

const FEATURES = [
  { n: "01", t: "Produtos ilimitados", d: "Cadastre quantos produtos quiser com fotos, variações de cor/tamanho e controle de estoque.", icon: <><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></> },
  { n: "02", t: "Checkout pelo WhatsApp", d: "O cliente clica em 'comprar' e vai direto para o WhatsApp. Alta conversão, zero fricção.", icon: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/> },
  { n: "03", t: "Cupons e promoções", d: "Crie cupons de desconto, promoções relâmpago e frete grátis para vender mais.", icon: <path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/> },
  { n: "04", t: "Pagamentos integrados", d: "Aceite Pix, cartão de crédito e boleto. Integração com os principais gateways do Brasil.", icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> },
  { n: "05", t: "Domínio personalizado", d: "Use seu próprio domínio (.com.br) e passe mais credibilidade para seus clientes.", icon: <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></> },
  { n: "06", t: "Analytics em tempo real", d: "Veja quais produtos vendem mais, de onde vêm seus clientes e quanto você fatura.", icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
];

const TESTIMONIALS = [
  { av: "AN", name: "Ana Costa", role: "loja de roupas · SP", text: "Em 3 semanas já tinha recuperado o investimento. Minha loja ficou profissional e meus clientes adoraram a facilidade de comprar direto pelo WhatsApp." },
  { av: "MR", name: "Marcos Ribeiro", role: "pet shop · MG", text: "Nunca imaginei que criar uma loja seria tão fácil. Em 30 minutos estava tudo no ar. Hoje faço 3x mais vendas do que antes de usar a ShopBox." },
  { av: "JS", name: "Juliana Santos", role: "cosméticos · RJ", text: "O suporte é incrível. Respondem em minutos pelo próprio WhatsApp. A plataforma é intuitiva e o checkout aumentou muito minha taxa de conversão." },
];

const FAQS = [
  { q: "Preciso de cartão de crédito para testar?", a: "Não! Os 7 dias de teste são completamente gratuitos. Você só cadastra um meio de pagamento se decidir continuar após o período de teste." },
  { q: "Posso cancelar quando quiser?", a: "Sim, sem fidelidade. Você pode cancelar a qualquer momento diretamente pelo painel, sem burocracia e sem multas." },
  { q: "Como funciona o checkout pelo WhatsApp?", a: "Quando o cliente clica em 'comprar' na sua loja, ele é direcionado para uma conversa no WhatsApp onde finaliza o pedido. É direto, rápido e tem altíssima taxa de conversão." },
  { q: "Quais formas de pagamento posso aceitar?", a: "Você pode aceitar Pix, boleto bancário e cartão de crédito/débito. As integrações com os principais gateways do Brasil já estão incluídas." },
  { q: "Preciso de CNPJ para abrir minha loja?", a: "Não! Você pode começar com CPF. Quando formalizar como MEI ou empresa, basta atualizar os dados no painel sem precisar recriar a loja." },
  { q: "A ShopBox cobra comissão por venda?", a: "Não cobramos nenhuma comissão sobre suas vendas. Você paga apenas a mensalidade do plano e fica com 100% do que vender." },
];

function PreviewDark() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="pdark">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* HEADER */}
      <header className="pd-header">
        <Link to="/preview-dark" className="pd-logo">
          <span className="pd-logo-dot" />shopbox
        </Link>
        <nav className="pd-nav">
          <a href="#sobre">Funcionalidades</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#precos">Preços</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="hdr-right">
          <Link to="/login" className="btn-ghost">Entrar</Link>
          <Link to="/funcionalidades" className="btn-outline">Funcionalidades</Link>
          <Link to="/cadastro" className="btn-g">Testar grátis</Link>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-grid" />
        <div className="hero-badge">+12.000 lojas ativas no WhatsApp</div>
        <h1>A plataforma de<br /><em>e-commerce</em> feita<br />para o WhatsApp</h1>
        <p className="hero-sub">Monte sua loja em minutos, compartilhe o link no WhatsApp e comece a receber pedidos hoje mesmo.</p>
        <div className="hero-ctas">
          <Link to="/cadastro" className="btn-g btn-hero-lg">Testar grátis por 7 dias</Link>
          <Link to="/funcionalidades" className="btn-outline btn-hero-lg">Ver funcionalidades</Link>
        </div>
        <div className="hero-social-proof">
          <div className="avatars">
            {["AN","MR","JS","PL","+"].map((a,i) => <div key={i} className="avatar">{a}</div>)}
          </div>
          <p className="proof-text">Nota <strong>4.9</strong> por mais de <strong>12 mil</strong> lojistas</p>
        </div>

        <div className="hero-mockup">
          <div style={{ position: "relative" }}>
            <div className="phone">
              <div className="phone-bar">
                <div className="phone-bar-av" />
                <div className="phone-bar-txt"><p>Loja da Ana</p><span>online agora</span></div>
              </div>
              <div className="phone-chat">
                <div className="bubble b-in">Oi! Ainda tem o vestido rosa?</div>
                <div className="bubble b-out">Sim! Olha que lindo 😍</div>
                <div className="b-card">
                  <div className="b-card-img">👗</div>
                  <div className="b-card-body">
                    <p>Vestido Floral Rosa</p>
                    <span>R$ 189,90</span>
                  </div>
                  <div className="b-card-btn">Comprar agora</div>
                </div>
                <div className="bubble b-in" style={{ fontSize: 11 }}>Amei! Como pago?</div>
                <div className="bubble b-out" style={{ fontSize: 11 }}>Pix ou cartão ✅ Link de pagamento aqui</div>
              </div>
            </div>
            <div className="float-card">
              <span className="float-dot" />
              <div>
                <p>Compra finalizada!</p>
                <span>há 2 min · R$ 189,90</span>
              </div>
            </div>
            <div className="float-metric">
              <div className="float-metric-num">R$47k</div>
              <div className="float-metric-lbl">faturamento esse mês</div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={i} className="ticker-item"><span className="ticker-dot" />{t}</span>
          ))}
        </div>
      </div>

      {/* SPLIT / ABOUT */}
      <div id="sobre">
        <div className="section" style={{ paddingBottom: 0 }}>
          <div className="split">
            <div>
              <div className="stag">O que é a ShopBox</div>
              <h2 className="stitle">Mais vendas,<br />menos complicação</h2>
              <p className="ssub">A ShopBox foi criada para quem vende pelo WhatsApp e quer uma loja profissional sem depender de marketplaces ou pagar comissão por venda.</p>
              <div className="split-features">
                <div className="sf">
                  <div className="sf-icon"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
                  <div className="sf-txt">
                    <h4>Checkout nativo pelo WhatsApp</h4>
                    <p>Seus clientes finalizam a compra direto no WhatsApp. Sem redirecionar para sites externos.</p>
                  </div>
                </div>
                <div className="sf">
                  <div className="sf-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg></div>
                  <div className="sf-txt">
                    <h4>Temas profissionais prontos</h4>
                    <p>Escolha entre dezenas de temas e deixe sua loja com a cara da sua marca em minutos.</p>
                  </div>
                </div>
                <div className="sf">
                  <div className="sf-icon"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
                  <div className="sf-txt">
                    <h4>Gestão completa de pedidos</h4>
                    <p>Acompanhe estoque, pedidos e pagamentos em um painel simples e intuitivo.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="dash-mockup">
              <div className="dash-bar">
                <div className="db" style={{ background: "#ff5f57" }} />
                <div className="db" style={{ background: "#febc2e" }} />
                <div className="db" style={{ background: "#28c840" }} />
                <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)", marginLeft: 8 }}>shopbox — painel</span>
              </div>
              <div className="dash-content">
                <div className="dash-row">
                  <div className="dash-stat"><div className="dash-stat-n">R$47k</div><div className="dash-stat-l">Faturamento</div></div>
                  <div className="dash-stat"><div className="dash-stat-n">847</div><div className="dash-stat-l">Pedidos</div></div>
                  <div className="dash-stat"><div className="dash-stat-n">94%</div><div className="dash-stat-l">Conversão</div></div>
                </div>
                <div className="dash-table">
                  <div className="dt-head"><span>Produto</span><span>Cliente</span><span>Status</span></div>
                  <div className="dt-row"><span>Vestido Rosa</span><span>Ana C.</span><span className="dt-badge dt-pago">Pago</span></div>
                  <div className="dt-row"><span>Tênis Runner</span><span>João M.</span><span className="dt-badge dt-pago">Pago</span></div>
                  <div className="dt-row"><span>Bolsa Couro</span><span>Maria L.</span><span className="dt-badge dt-pend">Pendente</span></div>
                  <div className="dt-row"><span>Camisa Polo</span><span>Pedro S.</span><span className="dt-badge dt-pago">Pago</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS */}
      <div className="metrics-strip">
        <div className="metrics-inner">
          {[["12k+","lojistas ativos"],["3x","mais conversão vs site comum"],["30min","para montar sua loja"],["4.9","nota média dos usuários"]].map(([n,l]) => (
            <div key={l} className="metric">
              <div className="metric-num">{n}</div>
              <div className="metric-lbl">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HELLO */}
      <div className="hello-bg">
        <div className="hello-inner">
          <div className="hello-grid">
            <div className="hello-text">
              <div className="stag">Por que a ShopBox</div>
              <h2 className="stitle">Diga olá para<br />uma loja que<br />realmente vende</h2>
              <p className="ssub" style={{ marginTop: 8 }}>Diferente de plataformas genéricas, a ShopBox foi construída do zero para o WhatsApp. Cada detalhe foi pensado para converter visitantes em clientes.</p>
              <Link to="/cadastro" className="btn-g" style={{ marginTop: 28, display: "inline-block", alignSelf: "flex-start" }}>Começar agora</Link>
            </div>
            <div className="hello-scroll">
              <div className="hs-head"><span className="hs-dot" /><span>vantagens da ShopBox</span></div>
              {HELLO_ITEMS.map((item) => (
                <div key={item} className="hs-item">
                  <div className="hs-check"><svg viewBox="0 0 12 12"><path d="M2 6l3 3 5-5"/></svg></div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES GRID */}
      <div id="funcionalidades">
        <div className="section">
          <div className="stag">Funcionalidades</div>
          <h2 className="stitle">Tudo que sua loja precisa</h2>
          <div className="feat-grid" style={{ marginTop: 48 }}>
            {FEATURES.map((f) => (
              <div key={f.n} className="feat-card">
                <div className="feat-num">{f.n}</div>
                <div className="feat-icon"><svg viewBox="0 0 24 24">{f.icon}</svg></div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STEPS */}
      <div id="como-funciona" className="steps-bg section-full">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center" }}>
            <div className="stag" style={{ textAlign: "center" }}>Como funciona</div>
            <h2 className="stitle">Comece a vender em 3 passos</h2>
          </div>
          <div className="steps-grid">
            {[
              { n: "01", t: "Crie sua conta", d: "Cadastre-se em menos de 2 minutos. Sem cartão de crédito, sem burocracia. 7 dias grátis para testar tudo." },
              { n: "02", t: "Monte sua loja", d: "Adicione seus produtos, escolha um tema profissional e configure os meios de pagamento que preferir." },
              { n: "03", t: "Compartilhe e venda", d: "Envie o link da sua loja pelo WhatsApp e comece a receber pedidos. Simples assim." },
            ].map((s) => (
              <div key={s.n} className="step-card" data-n={s.n}>
                <div className="step-n">— passo {s.n}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div className="section">
        <div style={{ textAlign: "center" }}>
          <div className="stag" style={{ textAlign: "center" }}>Depoimentos</div>
          <h2 className="stitle">O que dizem sobre a ShopBox</h2>
        </div>
        <div className="testi-grid">
          {TESTIMONIALS.map((t) => (
            <div key={t.av} className="testi-card">
              <div className="testi-stars">{Array.from({length:5}).map((_,i) => <span key={i} className="star">★</span>)}</div>
              <p className="testi-text">"{t.text}"</p>
              <div className="testi-author">
                <div className="testi-av">{t.av}</div>
                <div><div className="testi-name">{t.name}</div><div className="testi-role">{t.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div id="precos" className="steps-bg section-full">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center" }}>
            <div className="stag" style={{ textAlign: "center" }}>Planos</div>
            <h2 className="stitle">Sem surpresas, sem letras miúdas</h2>
            <p className="ssub" style={{ margin: "0 auto", textAlign: "center" }}>7 dias grátis em todos os planos. Sem cartão de crédito.</p>
          </div>
          <div className="pricing-grid">
            <PricingCard label="Inicial" price="47" desc="Para quem está começando a vender online." feats={["Até 50 produtos","Checkout pelo WhatsApp","1 usuário","Relatórios básicos","Suporte por email"]} cta="outline" />
            <PricingCard label="Profissional" price="97" desc="Para lojas em crescimento que querem vender mais." feats={["Produtos ilimitados","Checkout + catálogo automático","3 usuários","Cupons e promoções","Domínio personalizado","Suporte prioritário"]} cta="g" pop />
            <PricingCard label="Premium" price="197" desc="Para negócios que precisam de escala e controle total." feats={["Tudo do Profissional","Usuários ilimitados","API de integração","Relatórios avançados","Gerente de conta dedicado","SLA garantido"]} cta="outline" />
          </div>
          <p className="p-note">7 dias grátis em todos os planos · sem cartão de crédito · cancele quando quiser</p>
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" className="faq-bg section-full">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center" }}>
            <div className="stag" style={{ textAlign: "center" }}>FAQ</div>
            <h2 className="stitle">Perguntas frequentes</h2>
          </div>
          <div className="faq-inner">
            {FAQS.map((f, i) => (
              <div key={i} className="faq-item">
                <button className={`faq-q ${openFaq === i ? "open" : ""}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {f.q}
                  <span className="faq-icon"><svg viewBox="0 0 24 24" width={18} height={18}><path d="M12 5v14M5 12h14"/></svg></span>
                </button>
                <div className={`faq-a ${openFaq === i ? "open" : ""}`}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA FINAL */}
      <div className="cta-final">
        <h2>Pronto para criar<br />sua loja?</h2>
        <p>Mais de 12.000 lojistas já vendem pelo WhatsApp com a ShopBox</p>
        <Link to="/cadastro" className="btn-white">Testar grátis por 7 dias</Link>
      </div>

      {/* FOOTER */}
      <footer className="pd-footer">
        <div className="foot-inner">
          <div className="foot-grid">
            <div className="foot-brand">
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 16, fontWeight: 700, color: "#fff" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--g)", display: "inline-block" }} />shopbox
              </div>
              <p>A plataforma de e-commerce feita para quem vende pelo WhatsApp. Simples, rápido e sem comissão.</p>
            </div>
            <div className="foot-col">
              <h4>Produto</h4>
              <a href="#funcionalidades">Funcionalidades</a>
              <a href="#">Temas</a>
              <a href="#">Integrações</a>
              <a href="#precos">Preços</a>
            </div>
            <div className="foot-col">
              <h4>Empresa</h4>
              <a href="#">Sobre nós</a>
              <a href="#">Blog</a>
              <a href="#">Parceiros</a>
              <a href="#">Contato</a>
            </div>
            <div className="foot-col">
              <h4>Suporte</h4>
              <a href="#">Central de ajuda</a>
              <a href="#">WhatsApp</a>
              <a href="#">Termos de uso</a>
              <a href="#">Privacidade</a>
            </div>
          </div>
          <div className="foot-bottom">
            <p>© 2025 ShopBox. Todos os direitos reservados.</p>
            <div className="foot-socials">
              <div className="soc"><svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></div>
              <div className="soc"><svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><circle cx="17.5" cy="6.5" r="1.5"/></svg></div>
              <div className="soc"><svg viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg></div>
            </div>
          </div>
        </div>
      </footer>

      {/* preview banner */}
      <div className="pd-preview-banner">
        <span>● PREVIEW DARK</span>
        <Link to="/">← voltar para landing atual</Link>
      </div>
    </div>
  );
}

function PricingCard({ label, price, desc, feats, cta, pop }: { label: string; price: string; desc: string; feats: string[]; cta: "g" | "outline"; pop?: boolean }) {
  return (
    <div className={`p-card ${pop ? "pop" : ""}`}>
      {pop && <div className="pop-badge">Mais Popular</div>}
      <div className="p-label">{label}</div>
      <div className="p-price"><sup>R$</sup>{price}<sub>/mês</sub></div>
      <p className="p-desc">{desc}</p>
      <ul className="p-feats">
        {feats.map((f) => (
          <li key={f}><span className="p-check"><svg viewBox="0 0 12 12"><path d="M2 6l3 3 5-5"/></svg></span>{f}</li>
        ))}
      </ul>
      <Link to="/cadastro" className={cta === "g" ? "btn-g" : "btn-outline"} style={{ textAlign: "center", display: "block", width: "100%", padding: "12px", borderRadius: 999 }}>
        Testar grátis por 7 dias
      </Link>
    </div>
  );
}
