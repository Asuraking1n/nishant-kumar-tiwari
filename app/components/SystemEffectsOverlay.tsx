import { useEffect, useRef, useState } from "react";
import { onEffect, type EffectName, type EffectPayload } from "../effects/effectBus";
import { speak, startKlaxon, stopKlaxon } from "../audio/bootAudio";
import { SuitUp } from "./SuitUp";

type ActiveEffect = EffectPayload & { id: number; startedAt: number };

/**
 * Full-screen overlay that plays short-lived visual effects when voice commands
 * trigger them through the effectBus. Each effect mounts as a DOM layer, runs
 * its CSS animation, and self-unmounts after `durationMs`.
 */
export function SystemEffectsOverlay() {
  const [active, setActive] = useState<Record<EffectName, ActiveEffect | null>>({
    surge: null,
    scan: null,
    alert: null,
    stealth: null,
    doomsday: null,
    suitup: null,
  });

  useEffect(() => {
    let nextId = 0;
    return onEffect((e) => {
      const id = ++nextId;
      const startedAt = performance.now();
      setActive((prev) => ({ ...prev, [e.name]: { ...e, id, startedAt } }));
      const duration = e.durationMs ?? 1500;
      window.setTimeout(() => {
        setActive((prev) => {
          const current = prev[e.name];
          if (current?.id === id) return { ...prev, [e.name]: null };
          return prev;
        });
      }, duration + 40);
    });
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[70]" aria-hidden="true">
      {/* SURGE — bright cyan flash, subtle viewport shake via scale */}
      {active.surge && (
        <div
          key={active.surge.id}
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,229,255,0.45) 0%, rgba(0,229,255,0.18) 35%, transparent 70%)",
            animation: `surge-flash ${active.surge.durationMs ?? 1500}ms ease-out forwards`,
          }}
        />
      )}

      {/* SCAN — horizontal line sweeping top→bottom + label */}
      {active.scan && (
        <>
          <div
            key={`scan-line-${active.scan.id}`}
            className="absolute left-0 right-0 h-[3px]"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.85) 30%, rgba(255,255,255,0.95) 50%, rgba(0,229,255,0.85) 70%, transparent 100%)",
              boxShadow:
                "0 0 30px rgba(0,229,255,0.8), 0 0 80px rgba(0,229,255,0.5)",
              animation: `scan-sweep ${active.scan.durationMs ?? 1800}ms cubic-bezier(0.4, 0, 0.6, 1) forwards`,
              top: 0,
            }}
          />
          <div
            key={`scan-glow-${active.scan.id}`}
            className="absolute left-0 right-0 h-28"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,229,255,0.0) 0%, rgba(0,229,255,0.12) 70%, rgba(0,229,255,0) 100%)",
              animation: `scan-sweep-glow ${active.scan.durationMs ?? 1800}ms cubic-bezier(0.4, 0, 0.6, 1) forwards`,
              top: 0,
            }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 top-[30%] hud-panel px-5 py-3"
            style={{
              animation: `diag-label 1800ms ease-in-out forwards`,
            }}
          >
            <div className="hud-corner-tl" />
            <div className="hud-corner-tr" />
            <div className="hud-corner-bl" />
            <div className="hud-corner-br" />
            <div className="hud-mono text-[0.72rem] text-cyan-300/80 tracking-[0.3em] text-center">
              STATUS
            </div>
            <div className="hud-font text-xl text-cyan-100 hud-text-glow tracking-[0.25em]">
              {active.scan.label ?? "DIAGNOSTIC SWEEP"}
            </div>
            <div className="hud-bar mt-3" />
          </div>
        </>
      )}

      {/* ALERT — red border pulse + scanline overlay + WARNING label */}
      {active.alert && (
        <>
          <div
            key={`alert-border-${active.alert.id}`}
            className="absolute inset-0"
            style={{
              boxShadow:
                "inset 0 0 120px rgba(255,40,40,0.45), inset 0 0 40px rgba(255,0,0,0.3)",
              border: "2px solid rgba(255,60,60,0.7)",
              animation: `alert-pulse ${active.alert.durationMs ?? 1800}ms ease-in-out forwards`,
            }}
          />
          <div
            className="absolute inset-0 mix-blend-screen"
            style={{
              background:
                "repeating-linear-gradient(0deg, rgba(255,30,30,0.08) 0, rgba(255,30,30,0.08) 2px, transparent 2px, transparent 6px)",
              animation: `alert-pulse ${active.alert.durationMs ?? 1800}ms ease-in-out forwards`,
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-4"
            style={{
              animation: `alert-label ${active.alert.durationMs ?? 1800}ms ease-in-out forwards`,
              background: "rgba(20,0,0,0.55)",
              border: "1px solid rgba(255,70,70,0.7)",
              boxShadow: "0 0 40px rgba(255,50,50,0.55)",
            }}
          >
            <div className="hud-mono text-[0.7rem] tracking-[0.4em] text-red-300 text-center mb-1">
              ⚠ WARNING ⚠
            </div>
            <div
              className="hud-font text-2xl font-bold text-red-200 tracking-[0.3em] text-center"
              style={{
                textShadow:
                  "0 0 8px rgba(255,60,60,0.9), 0 0 24px rgba(255,0,0,0.6)",
              }}
            >
              {active.alert.label ?? "SECURITY ALERT"}
            </div>
          </div>
        </>
      )}

      {/* STEALTH — dark desaturating overlay */}
      {active.stealth && (
        <div
          key={active.stealth.id}
          className="absolute inset-0 backdrop-grayscale backdrop-brightness-50"
          style={{
            background: "rgba(2,6,13,0.55)",
            animation: `stealth-veil ${active.stealth.durationMs ?? 1400}ms ease-in-out forwards`,
          }}
        />
      )}

      {/* DOOMSDAY — the big production. Full red tint, countdown, scrolling failure feed, klaxon. */}
      {active.doomsday && (
        <Doomsday
          key={active.doomsday.id}
          startedAt={active.doomsday.startedAt}
          durationMs={active.doomsday.durationMs ?? 12000}
        />
      )}

      {/* SUIT-UP — Mark 42 assembly + launch sequence */}
      {active.suitup && (
        <SuitUp
          key={active.suitup.id}
          durationMs={active.suitup.durationMs ?? 6200}
        />
      )}

      <style>{`
        @keyframes surge-flash {
          0%   { opacity: 0; }
          10%  { opacity: 1; }
          30%  { opacity: 0.75; }
          100% { opacity: 0; }
        }
        @keyframes scan-sweep {
          0%   { transform: translateY(0); opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes scan-sweep-glow {
          0%   { transform: translateY(-100px); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes diag-label {
          0%   { opacity: 0; transform: translate(-50%, -10px); }
          15%  { opacity: 1; transform: translate(-50%, 0); }
          85%  { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, 10px); }
        }
        @keyframes alert-pulse {
          0%, 100% { opacity: 0.25; }
          20%      { opacity: 1; }
          40%      { opacity: 0.5; }
          60%      { opacity: 1; }
          80%      { opacity: 0.45; }
        }
        @keyframes alert-label {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          15%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          85%  { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
        }
        @keyframes stealth-veil {
          0%, 100% { opacity: 0; }
          20%, 80% { opacity: 1; }
        }

        /* ---------- DOOMSDAY ---------- */
        @keyframes doomsday-vignette {
          0%   { opacity: 0; }
          6%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes doomsday-strobe {
          0%, 100% { opacity: 0.65; }
          50%      { opacity: 0.18; }
        }
        @keyframes doomsday-border {
          0%, 100% { box-shadow: inset 0 0 80px rgba(255,20,20,0.45), inset 0 0 200px rgba(255,0,0,0.35); }
          50%      { box-shadow: inset 0 0 160px rgba(255,60,60,0.85), inset 0 0 320px rgba(255,0,0,0.6); }
        }
        @keyframes doomsday-banner-flicker {
          0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
          4%       { opacity: 0.25; }
          8%       { opacity: 1; }
          52%      { opacity: 0.35; transform: translateX(-50%) scale(0.99); }
          54%      { opacity: 1; transform: translateX(-50%) scale(1); }
          72%      { opacity: 0.6; }
          74%      { opacity: 1; }
        }
        @keyframes doomsday-digit {
          0%, 100% { transform: scale(1); text-shadow: 0 0 24px rgba(255,40,40,0.95), 0 0 60px rgba(255,0,0,0.7); }
          50%      { transform: scale(1.07); text-shadow: 0 0 36px rgba(255,80,80,1), 0 0 100px rgba(255,0,0,0.85); }
        }
        @keyframes doomsday-ticker {
          0%   { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
        @keyframes doomsday-scanlines {
          0%   { background-position: 0 0; }
          100% { background-position: 0 8px; }
        }
      `}</style>
    </div>
  );
}

/* ----------------------- DOOMSDAY SEQUENCE ----------------------- */

const FAILURE_FEED = [
  "ARC REACTOR :: CONTAINMENT FAILING",
  "SHIELD MATRIX :: OFFLINE",
  "UPLINK :: SEVERED",
  "COOLANT FLOW :: CRITICAL",
  "REPULSOR ARRAY :: UNSTABLE",
  "HUD OVERLAY :: DEGRADED",
  "PRIMARY BUS :: 24% INTEGRITY",
  "SECURITY GRID :: BREACHED",
  "EMERGENCY PROTOCOLS :: OVERRIDDEN",
  "AI SUBROUTINES :: PANIC",
  "STARK MAINFRAME :: COMPROMISED",
  "WARNING :: REACTOR TEMP 4200K",
  "ERROR :: QUANTUM TETHER LOST",
  "IRON LEGION :: UNRESPONSIVE",
  "FRIDAY :: NOT RESPONDING",
  "PALLADIUM CORE :: EXPOSED",
  "GAMMA SHIELD :: BREACHED",
  "WORKSHOP DOORS :: SEALED",
  "SATELLITE LINK :: LOST",
  "ORBITAL DEFENSE :: MALFUNCTION",
];

function Doomsday({
  startedAt,
  durationMs,
}: {
  startedAt: number;
  durationMs: number;
}) {
  // 10s countdown, remaining 2s is the safety-override outro
  const COUNTDOWN_SECS = 10;
  const [remaining, setRemaining] = useState(COUNTDOWN_SECS);
  const [resolved, setResolved] = useState(false);
  const lastSpokenRef = useRef<number>(COUNTDOWN_SECS + 1);

  useEffect(() => {
    // Boot the sequence
    document.documentElement.classList.add("doomsday-active");
    startKlaxon();
    speak("Doomsday protocol initiated. Ten seconds to detonation. God speed, sir.");

    const tick = setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const r = Math.max(0, COUNTDOWN_SECS - Math.floor(elapsed / 1000));
      setRemaining(r);

      // Speak the final count-in beats (5, 3, 2, 1)
      if (r !== lastSpokenRef.current) {
        lastSpokenRef.current = r;
        if (r === 5) speak("Five seconds.");
        else if (r === 3) speak("Three.");
        else if (r === 2) speak("Two.");
        else if (r === 1) speak("One.");
      }

      if (r === 0) {
        clearInterval(tick);
        stopKlaxon();
        setTimeout(() => {
          setResolved(true);
          speak("Safety override engaged. Crisis averted, sir. Returning to nominal operations.");
        }, 450);
      }
    }, 100);

    return () => {
      clearInterval(tick);
      stopKlaxon();
      document.documentElement.classList.remove("doomsday-active");
    };
  }, [startedAt]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ animation: `doomsday-vignette ${durationMs}ms ease-in-out forwards` }}
    >
      {/* Backdrop: desaturate + red-shift everything behind */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter:
            "hue-rotate(-110deg) saturate(1.6) brightness(0.55) contrast(1.1)",
          WebkitBackdropFilter:
            "hue-rotate(-110deg) saturate(1.6) brightness(0.55) contrast(1.1)",
          background:
            "radial-gradient(ellipse at center, rgba(120,0,0,0.35) 0%, rgba(30,0,0,0.7) 55%, rgba(8,0,0,0.92) 100%)",
        }}
      />

      {/* Red scanlines scrolling */}
      <div
        className="absolute inset-0 mix-blend-screen opacity-50"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(255,30,30,0.22) 0, rgba(255,30,30,0.22) 2px, transparent 2px, transparent 5px)",
          animation: "doomsday-scanlines 0.12s linear infinite, doomsday-strobe 0.6s ease-in-out infinite",
        }}
      />

      {/* Red inset border pulse */}
      <div
        className="absolute inset-0"
        style={{
          border: "3px solid rgba(255,30,30,0.9)",
          animation: "doomsday-border 0.7s ease-in-out infinite",
        }}
      />

      {/* Banner */}
      {!resolved ? (
        <div
          className="absolute left-1/2 top-[12%] px-6 py-3"
          style={{
            transform: "translateX(-50%)",
            background: "rgba(20,0,0,0.65)",
            border: "2px solid rgba(255,40,40,0.85)",
            boxShadow: "0 0 60px rgba(255,30,30,0.7)",
            animation: "doomsday-banner-flicker 0.9s infinite",
          }}
        >
          <div className="hud-mono text-[0.7rem] tracking-[0.5em] text-red-300 text-center">
            ⚠ CRITICAL ⚠ CRITICAL ⚠
          </div>
          <div
            className="hud-font text-3xl sm:text-5xl font-black text-red-200 tracking-[0.25em] text-center mt-1"
            style={{
              textShadow:
                "0 0 10px rgba(255,60,60,1), 0 0 30px rgba(255,0,0,0.75), 0 0 60px rgba(255,0,0,0.5)",
            }}
          >
            DOOMSDAY PROTOCOL ACTIVE
          </div>
        </div>
      ) : (
        <div
          className="absolute left-1/2 top-[18%] px-6 py-3"
          style={{
            transform: "translateX(-50%)",
            background: "rgba(0,20,10,0.7)",
            border: "2px solid rgba(80,255,140,0.85)",
            boxShadow: "0 0 40px rgba(60,255,120,0.6)",
          }}
        >
          <div className="hud-mono text-[0.7rem] tracking-[0.4em] text-emerald-300 text-center">
            ✓ SAFETY OVERRIDE ENGAGED
          </div>
          <div
            className="hud-font text-2xl sm:text-3xl font-bold text-emerald-200 tracking-[0.25em] text-center mt-1"
            style={{ textShadow: "0 0 10px rgba(80,255,140,0.9)" }}
          >
            CRISIS AVERTED
          </div>
        </div>
      )}

      {/* Countdown digit */}
      {!resolved && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontWeight: 900,
            fontSize: "32vmin",
            lineHeight: 1,
            color: "#ff2d2d",
            animation: "doomsday-digit 0.95s ease-in-out infinite",
          }}
        >
          {remaining.toString().padStart(2, "0")}
        </div>
      )}

      {/* Detonation windup label beneath countdown */}
      {!resolved && (
        <div
          className="absolute left-1/2 top-[78%] -translate-x-1/2 hud-mono text-[0.78rem] tracking-[0.4em] text-red-300/90 text-center"
          style={{ textShadow: "0 0 8px rgba(255,20,20,0.9)" }}
        >
          TIME TO DETONATION
        </div>
      )}

      {/* Scrolling failure feed on the left */}
      <div
        className="absolute left-4 sm:left-8 top-0 bottom-0 w-[min(320px,34vw)] overflow-hidden pointer-events-none"
        style={{
          maskImage:
            "linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%)",
        }}
      >
        <div
          className="hud-mono text-[0.7rem] leading-6 text-red-300"
          style={{
            animation: "doomsday-ticker 6s linear infinite",
            textShadow: "0 0 6px rgba(255,30,30,0.8)",
          }}
        >
          {[...FAILURE_FEED, ...FAILURE_FEED].map((line, i) => (
            <div key={i} className="py-0.5">
              &gt; {line}
            </div>
          ))}
        </div>
      </div>

      {/* Right-side: big red warning chip */}
      <div
        className="absolute right-4 sm:right-8 top-[35%] hud-mono text-[0.7rem] tracking-[0.35em] text-red-300 text-right"
        style={{ textShadow: "0 0 6px rgba(255,30,30,0.9)" }}
      >
        <div>GRID .......... <span className="text-red-200">COMPROMISED</span></div>
        <div>UPLINK ........ <span className="text-red-200">SEVERED</span></div>
        <div>REACTOR ....... <span className="text-red-200">UNSTABLE</span></div>
        <div>SHIELD ........ <span className="text-red-200">OFFLINE</span></div>
        <div>CONTROL ....... <span className="text-red-200">LOST</span></div>
      </div>
    </div>
  );
}
