import { useEffect, useState } from "react";
import { beep, engageSweep, speak, unlock, welcomeSwell } from "../audio/bootAudio";

const LINES = [
  "INITIALIZING J.A.R.V.I.S. CORE......................OK",
  "LINKING STARK INDUSTRIES SATELLITE GRID.............OK",
  "CALIBRATING REPULSOR TELEMETRY......................OK",
  "LOADING PERSONA :: NISHANT.KUMAR.TIWARI.............OK",
  "ARC REACTOR OUTPUT :: 3.2 GJ / SEC..................STABLE",
  "RUNNING DIAGNOSTIC ON FRONTEND SUBSYSTEMS...........PASS",
  "AUTHENTICATION :: BIOMETRIC SIGNATURE VERIFIED......CLEAR",
  "HUD OVERLAY :: ENGAGED",
  "WELCOME HOME, SIR.",
];

type Phase = "gate" | "running";

export function BootSequence({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("gate");
  const [visible, setVisible] = useState<string[]>([]);
  const [closing, setClosing] = useState(false);
  const [audioOn, setAudioOn] = useState(false);

  const startBoot = (withAudio: boolean) => {
    if (withAudio) {
      unlock();
      // Warm up the speech synth voice list so getVoices() is populated when we need it
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.getVoices();
      }
      engageSweep();
      setAudioOn(true);
    }
    setPhase("running");
  };

  useEffect(() => {
    if (phase !== "running") return;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < LINES.length; i++) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 170 + Math.random() * 180));
        setVisible((v) => [...v, LINES[i]]);
        if (audioOn) {
          const line = LINES[i];
          if (line.startsWith("WELCOME")) {
            welcomeSwell();
            setTimeout(() => speak("Welcome home, sir."), 420);
          } else {
            beep({ pitch: 0.85 + (i % 3) * 0.12 });
          }
        }
      }
      // Hold the "Welcome home, sir." line a little longer so the voice lands
      await new Promise((r) => setTimeout(r, audioOn ? 1800 : 650));
      if (cancelled) return;
      setClosing(true);
      await new Promise((r) => setTimeout(r, 700));
      if (!cancelled) onDone();
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, audioOn, onDone]);

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-[#02060d] transition-opacity duration-700 ${
        closing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Expanding ring behind boot */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[60vmin] h-[60vmin] rounded-full border border-cyan-400/30 hud-spin-slow" />
        <div className="absolute w-[75vmin] h-[75vmin] rounded-full border border-cyan-400/20 hud-spin-slow-rev" />
        <div className="absolute w-[90vmin] h-[90vmin] rounded-full border border-cyan-400/10 hud-spin-slow" />
        <div className="absolute w-[35vmin] h-[35vmin] rounded-full bg-cyan-400/5 blur-2xl" />
      </div>

      <div className="relative z-10 w-[min(680px,90vw)] hud-panel p-6 sm:p-8">
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        <div className="flex items-center justify-between mb-4">
          <div className="hud-font text-cyan-300 hud-text-glow text-lg">
            J.A.R.V.I.S. // BOOT
          </div>
          <div className="hud-chip hud-blink">
            <span className="w-2 h-2 rounded-full bg-cyan-300 inline-block" />
            LINK
          </div>
        </div>
        <div className="hud-divider mb-4" />

        {phase === "gate" ? (
          <div className="min-h-[220px] flex flex-col items-center justify-center text-center gap-5 py-6">
            <div className="hud-mono text-[0.75rem] text-cyan-300/80 tracking-widest">
              AUDIO SUBSYSTEM STANDBY
            </div>
            <div className="hud-font text-2xl sm:text-3xl text-cyan-100 hud-text-glow leading-tight max-w-md">
              TAP TO INITIALIZE
              <br />
              <span className="hud-text-gold">J.A.R.V.I.S.</span>
            </div>
            <p className="hud-mono text-[0.72rem] text-cyan-400/70 max-w-sm">
              Audio autoplay is blocked until you acknowledge. Tap below to engage
              voice and telemetry.
            </p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <button
                type="button"
                className="hud-btn hud-btn-gold"
                onClick={() => startBoot(true)}
                aria-label="Start JARVIS boot with audio"
              >
                &gt; Engage With Audio
              </button>
              <button
                type="button"
                className="hud-btn"
                onClick={() => startBoot(false)}
                aria-label="Start JARVIS boot silent"
              >
                Silent Mode
              </button>
            </div>
          </div>
        ) : (
          <div className="hud-mono text-[0.78rem] sm:text-sm leading-relaxed text-cyan-200/90 min-h-[220px]">
            {visible.map((line, i) => (
              <div
                key={i}
                className={
                  line.endsWith("OK") ||
                  line.endsWith("PASS") ||
                  line.endsWith("CLEAR") ||
                  line.endsWith("STABLE")
                    ? "text-cyan-200"
                    : line.endsWith("ENGAGED")
                    ? "text-amber-300"
                    : line.startsWith("WELCOME")
                    ? "hud-text-gold text-lg mt-2"
                    : "text-cyan-200"
                }
              >
                &gt; {line}
              </div>
            ))}
            <span className="caret" style={{ height: "1em" }} />
          </div>
        )}

        <div className="hud-bar mt-5" />
      </div>
    </div>
  );
}
