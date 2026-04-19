import { ArcReactor } from "../components/ArcReactor";
import { Typewriter } from "../components/Typewriter";
import { profile } from "../data/profile";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* 3D Scene */}
      <ArcReactor />

      {/* HUD overlays around the reactor */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Targeting corners */}
        <div className="absolute inset-8 sm:inset-14">
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-cyan-400 hud-flicker" />
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-cyan-400 hud-flicker" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-cyan-400 hud-flicker" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-cyan-400 hud-flicker" />
        </div>

        {/* Floating stat readouts */}
        <div className="absolute top-24 left-6 sm:left-16 hidden md:block">
          <div className="hud-mono text-[0.7rem] text-cyan-300/90 space-y-1">
            <div>&gt; CORE.TEMP <span className="text-cyan-200">36.4°C</span></div>
            <div>&gt; OUTPUT... <span className="text-amber-300">3.2 GJ/s</span></div>
            <div>&gt; FLUX..... <span className="text-cyan-200">STABLE</span></div>
            <div>&gt; SHIELD... <span className="text-emerald-300">100%</span></div>
          </div>
        </div>

        <div className="absolute top-24 right-6 sm:right-16 hidden md:block text-right">
          <div className="hud-mono text-[0.7rem] text-cyan-300/90 space-y-1">
            <div>LAT 28.6139°N &lt;</div>
            <div>LNG 77.2090°E &lt;</div>
            <div>SECTOR: DELHI-IN &lt;</div>
            <div className="text-amber-300">UPLINK-A7 &lt;</div>
          </div>
        </div>

        {/* Center identity block */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Soft dark vignette sitting between reactor and text — makes the name pop without hiding reactor edges */}
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[46vmin] pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(ellipse 62% 55% at 50% 50%, rgba(2,6,13,0.78) 0%, rgba(2,6,13,0.55) 35%, rgba(2,6,13,0.2) 65%, transparent 82%)",
            }}
          />
          <div className="relative text-center px-4">
            <div className="hud-chip inline-flex mb-4 hud-flicker">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
              IDENT // {profile.handle}
            </div>
            <h1
              className="hud-font font-black text-4xl sm:text-6xl md:text-7xl text-white leading-[0.95] mb-3"
              style={{
                WebkitTextStroke: "1px rgba(2,6,13,0.55)",
                textShadow:
                  "0 0 1px rgba(2,6,13,0.95), 0 0 6px rgba(2,6,13,0.85), 0 0 14px rgba(0,229,255,0.65), 0 0 32px rgba(0,229,255,0.35), 0 0 56px rgba(0,229,255,0.18)",
              }}
            >
              {profile.name.toUpperCase()}
            </h1>
            <div className="hud-mono text-cyan-100 text-sm sm:text-base mb-6" style={{ textShadow: "0 0 6px rgba(2,6,13,0.9)" }}>
              <Typewriter text={`> ${profile.title.toUpperCase()}`} speed={26} />
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap pointer-events-auto">
              <a href="#experience" className="hud-btn">
                &gt; Scan Dossier
              </a>
              <a
                href="mailto:nishant88tiwari@gmail.com"
                className="hud-btn hud-btn-gold"
              >
                Open Channel
              </a>
            </div>
          </div>
        </div>

        {/* Bottom status strip */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 hud-mono text-[0.68rem] text-cyan-400/80">
            <div className="hud-chip">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 hud-blink" />
              SIG LOCK
            </div>
            <span className="hidden sm:inline">SCAN RANGE // 0.0 – ∞</span>
          </div>
          <div className="hud-mono text-[0.68rem] text-cyan-400/70 hidden md:block">
            SCROLL TO ENGAGE ↓
          </div>
          <div className="flex items-center gap-3 hud-mono text-[0.68rem] text-cyan-400/80">
            <span className="hidden sm:inline">PWR // 96.8%</span>
            <div className="hud-chip">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 hud-blink" />
              LIVE FEED
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
