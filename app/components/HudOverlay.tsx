import { useEffect, useState } from "react";

/** Status ticker shown in HUD top-bar */
function Clock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    <span className="hud-mono text-cyan-300 text-xs tracking-widest">
      {pad(t.getHours())}:{pad(t.getMinutes())}:{pad(t.getSeconds())} UTC{t.getTimezoneOffset() >= 0 ? "-" : "+"}
      {Math.abs(t.getTimezoneOffset() / 60)}
    </span>
  );
}

export function HudTopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-8 py-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-cyan-300 relative flex items-center justify-center hud-flicker">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-cyan-300 hud-text-glow" />
            <div className="absolute inset-[-6px] border border-cyan-400/40 rounded-full hud-spin-slow" />
          </div>
          <span className="hud-font text-cyan-200 text-xs sm:text-sm hud-text-glow whitespace-nowrap">
            J.A.R.V.I.S.
          </span>
          <span className="hud-mono text-cyan-400/70 text-[0.7rem] hidden md:inline whitespace-nowrap">
            v4.7.1 // STARK OS
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-0">
          <span className="hud-mono text-cyan-400/70 text-[0.7rem] hidden lg:inline whitespace-nowrap">
            GRID: NKT-DEL-01
          </span>
          <Clock />
          <span className="hud-chip hud-blink hidden sm:inline-flex">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ONLINE
          </span>
        </div>
      </div>
      <div className="hud-divider mx-3 sm:mx-8" />
    </div>
  );
}

export function HudSideRails() {
  return (
    <>
      <div className="fixed left-0 top-20 bottom-20 w-6 z-30 pointer-events-none hidden md:flex flex-col justify-between items-center">
        <div className="hud-mono text-cyan-400/60 text-[0.6rem] rotate-180 [writing-mode:vertical-rl] tracking-[0.4em]">
          STARK INDUSTRIES // SEC-LVL ALPHA
        </div>
        <div className="w-[2px] flex-1 my-3 bg-gradient-to-b from-cyan-400/70 via-cyan-400/20 to-transparent" />
      </div>
      <div className="fixed right-0 top-20 bottom-20 w-6 z-30 pointer-events-none hidden md:flex flex-col justify-between items-center">
        <div className="w-[2px] flex-1 mb-3 bg-gradient-to-b from-transparent via-cyan-400/20 to-cyan-400/70" />
        <div className="hud-mono text-cyan-400/60 text-[0.6rem] [writing-mode:vertical-rl] tracking-[0.4em]">
          SYS.OPS // UPLINK-STABLE
        </div>
      </div>
    </>
  );
}

export function Crosshair() {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex items-center justify-center">
      <div className="relative w-[72vmin] h-[72vmin] opacity-60">
        <div className="absolute inset-0 rounded-full border border-cyan-400/20 hud-spin-slow" />
        <div className="absolute inset-6 rounded-full border border-cyan-400/15 hud-spin-slow-rev" />
        <div className="absolute inset-14 rounded-full border border-dashed border-cyan-400/10" />
        {/* Crosshair ticks */}
        {[0, 90, 180, 270].map((deg) => (
          <div
            key={deg}
            className="absolute top-1/2 left-1/2 w-4 h-[2px] bg-cyan-300/70"
            style={{ transform: `rotate(${deg}deg) translate(calc(36vmin - 8px), -1px)` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SectionFrame({
  id,
  label,
  title,
  children,
  accent = "cyan",
}: {
  id: string;
  label: string;
  title: string;
  children: React.ReactNode;
  accent?: "cyan" | "gold";
}) {
  return (
    <section id={id} className="relative py-20 sm:py-28 px-4 sm:px-8 z-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-3 reveal">
          <div
            className={`h-[2px] w-12 ${
              accent === "gold" ? "bg-amber-400" : "bg-cyan-300"
            } hud-text-glow`}
          />
          <span
            className={`hud-font text-[0.7rem] tracking-[0.4em] ${
              accent === "gold" ? "text-amber-300" : "text-cyan-300"
            }`}
          >
            {label}
          </span>
        </div>
        <h2
          className={`hud-font text-3xl sm:text-5xl font-bold mb-8 reveal ${
            accent === "gold" ? "hud-text-gold" : "text-cyan-100 hud-text-glow"
          }`}
        >
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
