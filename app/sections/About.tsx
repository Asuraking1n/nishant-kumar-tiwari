import { SectionFrame } from "../components/HudOverlay";
import { profile, education } from "../data/profile";

export function About() {
  return (
    <SectionFrame id="about" label="// SUBJECT DOSSIER" title="Identity Scan">
      <div className="grid md:grid-cols-[1.4fr_1fr] gap-6">
        <div className="hud-panel p-6 sm:p-8 reveal">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />
          <div className="hud-mono text-[0.7rem] text-cyan-400/70 tracking-widest mb-3">
            BIOMETRIC PROFILE // CLASSIFIED
          </div>
          <p className="text-cyan-100/90 text-base sm:text-lg leading-relaxed">
            {profile.summary}
          </p>
          <div className="hud-divider my-6" />
          <div className="grid sm:grid-cols-2 gap-4 hud-mono text-sm">
            <InfoRow k="CALLSIGN" v={profile.handle} />
            <InfoRow k="LOCATION" v={profile.location} />
            <InfoRow k="DESIGNATION" v="SDE I — Frontend" />
            <InfoRow k="EDUCATION" v={`${education.degree.split("—")[1].trim()} · ${education.year}`} />
            <InfoRow k="INSTITUTION" v={education.institution} />
            <InfoRow k="CLEARANCE" v="ALPHA // STARK-GRID" gold />
          </div>
        </div>

        {/* Diagnostic panel */}
        <div className="hud-panel p-6 reveal">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />
          <div className="hud-mono text-[0.7rem] text-cyan-400/70 tracking-widest mb-4">
            VITAL DIAGNOSTICS
          </div>
          <Stat label="FRONTEND" value={96} />
          <Stat label="ARCHITECTURE" value={88} />
          <Stat label="REALTIME SYS" value={91} />
          <Stat label="TYPESCRIPT" value={94} />
          <Stat label="PERFORMANCE" value={89} />
          <div className="hud-divider my-5" />
          <div className="hud-mono text-xs text-cyan-300/80 space-y-1">
            <div>&gt; YRS.OPERATION <span className="text-amber-300">3.8</span></div>
            <div>&gt; SHIPS ..... <span className="text-cyan-200">4 MAJOR</span></div>
            <div>&gt; MENTORSHIP <span className="text-cyan-200">10+ HUMANS</span></div>
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}

function InfoRow({ k, v, gold }: { k: string; v: string; gold?: boolean }) {
  return (
    <div>
      <div className="text-cyan-400/60 text-[0.65rem] tracking-widest">{k}</div>
      <div className={gold ? "text-amber-300" : "text-cyan-100"}>{v}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between hud-mono text-[0.7rem] mb-1">
        <span className="text-cyan-300/80 tracking-widest">{label}</span>
        <span className="text-cyan-200">{value.toString().padStart(3, "0")}%</span>
      </div>
      <div className="relative h-[6px] bg-cyan-950/60 border border-cyan-400/30 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-200"
          style={{
            width: `${value}%`,
            boxShadow: "0 0 10px rgba(0,229,255,0.6)",
          }}
        />
        <div
          className="absolute inset-y-0 w-6 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          style={{
            animation: "hud-sweep 2.2s linear infinite",
            mixBlendMode: "screen",
          }}
        />
      </div>
    </div>
  );
}
