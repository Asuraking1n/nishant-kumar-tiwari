import { useEffect, useState } from "react";

type Phase = "scan" | "assemble" | "lock" | "launch" | "gone";

/**
 * Mark 42 suit-up sequence, rendered as an animated SVG silhouette:
 *   1. Scan sweep + blueprint wireframe.
 *   2. Armor pieces (SVG <g> groups) fly in from off-screen edges and lock in.
 *   3. Arc reactor ignites, suit "powers up".
 *   4. Thrusters fire, whole suit launches out the top of the viewport.
 */
export function SuitUp({ durationMs = 6200 }: { durationMs?: number }) {
  const [phase, setPhase] = useState<Phase>("scan");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("assemble"), 700));
    timers.push(setTimeout(() => setPhase("lock"), 2800));
    timers.push(setTimeout(() => setPhase("launch"), 4200));
    timers.push(setTimeout(() => setPhase("gone"), Math.max(durationMs - 200, 5800)));
    return () => timers.forEach(clearTimeout);
  }, [durationMs]);

  const assembled = phase !== "scan";
  const locked = phase === "lock" || phase === "launch" || phase === "gone";
  const launching = phase === "launch" || phase === "gone";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Warm radial backdrop — workshop feel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(70,18,8,0.55) 0%, rgba(14,4,2,0.85) 65%, rgba(2,6,13,0.95) 100%)",
          backdropFilter: "saturate(1.1) contrast(1.05)",
          WebkitBackdropFilter: "saturate(1.1) contrast(1.05)",
          animation: "suit-backdrop 6200ms ease-in-out forwards",
        }}
      />

      {/* Blueprint schematic grid */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,180,80,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,180,80,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse at center, black 50%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 50%, transparent 85%)",
        }}
      />

      {/* Scan line runs once during "scan" phase */}
      {phase === "scan" && (
        <div
          className="absolute left-0 right-0 h-[3px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,180,80,0.85) 30%, rgba(255,255,255,0.95) 50%, rgba(255,180,80,0.85) 70%, transparent 100%)",
            boxShadow: "0 0 30px rgba(255,180,80,0.85), 0 0 80px rgba(255,120,40,0.5)",
            top: 0,
            animation: "suit-scan 1400ms cubic-bezier(0.4, 0, 0.6, 1) forwards",
          }}
        />
      )}

      {/* Stage: whole suit container. Transforms upward on launch. */}
      <div
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          width: "42vmin",
          height: "72vmin",
          transform: launching
            ? "translate(-50%, -260vh) rotate(1.5deg)"
            : "translate(-50%, -50%)",
          transition: "transform 1400ms cubic-bezier(0.55, 0, 0.35, 1)",
          willChange: "transform",
        }}
      >
        {/* Subtle shake during "lock" */}
        <div
          className="absolute inset-0"
          style={{
            animation: locked && !launching ? "suit-shake 90ms linear infinite" : undefined,
          }}
        >
          <SuitSvg assembled={assembled} locked={locked} />

          {/* Palm repulsor glows during lock+launch */}
          {locked && (
            <>
              <RepulsorGlow style={{ left: "4%", top: "54%" }} />
              <RepulsorGlow style={{ right: "4%", top: "54%" }} />
            </>
          )}

          {/* Thruster flames beneath boots (during launch) */}
          {launching && (
            <>
              <FlameTrail left="22%" />
              <FlameTrail left="62%" />
            </>
          )}
        </div>
      </div>

      {/* Status labels */}
      {phase === "scan" && (
        <StatusLabel text="SCANNING BIOMETRICS" sub="MARK 42 BOOT PROTOCOL" />
      )}
      {phase === "assemble" && (
        <StatusLabel text="ASSEMBLING ARMOR" sub="MARK FORTY-TWO" progress />
      )}
      {phase === "lock" && (
        <StatusLabel text="ARC REACTOR ONLINE" sub="REPULSORS PRIMED" gold />
      )}
      {phase === "launch" && (
        <StatusLabel text="LAUNCH // GOD SPEED" sub="ALTITUDE INCREASING" gold launchEcho />
      )}

      {/* Launch flash */}
      {phase === "launch" && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 70%, rgba(255,200,100,0.55) 0%, rgba(255,140,40,0.22) 30%, transparent 60%)",
            animation: "suit-launch-flash 1200ms ease-out forwards",
          }}
        />
      )}

      <style>{suitStyles}</style>
    </div>
  );
}

/* -------------------- SVG SUIT -------------------- */

function SuitSvg({ assembled, locked }: { assembled: boolean; locked: boolean }) {
  // Each part has its own fly-in direction and delay. Using CSS animations via inline style.
  const part = (delay: number, from: "top" | "bottom" | "left" | "right"): React.CSSProperties => ({
    opacity: 0,
    transformOrigin: "center",
    animation: assembled
      ? `suit-fly-${from} 750ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`
      : undefined,
  });

  return (
    <svg
      viewBox="0 0 100 170"
      className="absolute inset-0 w-full h-full"
      style={{ overflow: "visible", filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.6))" }}
    >
      <defs>
        <linearGradient id="suitRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8442a" />
          <stop offset="45%" stopColor="#c02718" />
          <stop offset="100%" stopColor="#6f1208" />
        </linearGradient>
        <linearGradient id="suitRedDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a61d10" />
          <stop offset="100%" stopColor="#4a0d05" />
        </linearGradient>
        <linearGradient id="suitGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd070" />
          <stop offset="50%" stopColor="#d99e2a" />
          <stop offset="100%" stopColor="#8a5f12" />
        </linearGradient>
        <linearGradient id="suitGoldLight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe6a8" />
          <stop offset="100%" stopColor="#d49a2a" />
        </linearGradient>
        <radialGradient id="reactorCore" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="28%" stopColor="#e8f7ff" />
          <stop offset="55%" stopColor="#7fd9ff" />
          <stop offset="85%" stopColor="#00aaff" />
          <stop offset="100%" stopColor="#004a7a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="reactorGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#bde9ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#00aaff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ---------- HELMET ---------- */}
      <g style={part(80, "top")}>
        {/* outer red shell */}
        <path
          d="M 32 2 Q 50 -2 68 2 L 72 9 L 73 22 Q 73 32 66 36 L 62 40 L 58 43 L 54 45 L 50 46 L 46 45 L 42 43 L 38 40 L 34 36 Q 27 32 27 22 L 28 9 Z"
          fill="url(#suitRed)"
          stroke="#3a0805"
          strokeWidth="0.4"
        />
        {/* gold faceplate */}
        <path
          d="M 37 4 L 63 4 L 66 12 L 66 23 L 62 32 L 56 40 L 50 43 L 44 40 L 38 32 L 34 23 L 34 12 Z"
          fill="url(#suitGold)"
          stroke="#5e3c0a"
          strokeWidth="0.3"
        />
        {/* cheek shading */}
        <path d="M 34 23 L 38 32 L 42 37 L 40 38 L 36 34 L 32 28 Z" fill="url(#suitRedDark)" opacity="0.5" />
        <path d="M 66 23 L 62 32 L 58 37 L 60 38 L 64 34 L 68 28 Z" fill="url(#suitRedDark)" opacity="0.5" />
        {/* brow seam */}
        <path d="M 34 12 L 66 12" stroke="#5e3c0a" strokeWidth="0.5" fill="none" />
        {/* eye slits */}
        <path
          d="M 38 17 L 47 17 L 48 19 L 45 20 L 38 20 L 36 19 Z"
          fill="#fff2a8"
          filter={locked ? undefined : undefined}
        />
        <path
          d="M 62 17 L 53 17 L 52 19 L 55 20 L 62 20 L 64 19 Z"
          fill="#fff2a8"
        />
        {/* eye glow halo */}
        <rect
          x="35"
          y="15.5"
          width="30"
          height="6"
          rx="3"
          fill="#fff4c0"
          opacity={locked ? 0.5 : 0.25}
          style={{ transition: "opacity 400ms ease", mixBlendMode: "screen" }}
        />
        {/* vertical face seam */}
        <line x1="50" y1="24" x2="50" y2="43" stroke="#5e3c0a" strokeWidth="0.3" />
        {/* chin plating */}
        <path d="M 44 40 L 50 46 L 56 40 L 54 41 L 50 44 L 46 41 Z" fill="#8a1608" />
      </g>

      {/* ---------- NECK / COLLAR ---------- */}
      <g style={part(240, "top")}>
        <path
          d="M 42 42 L 58 42 L 62 48 L 58 50 L 42 50 L 38 48 Z"
          fill="url(#suitRedDark)"
          stroke="#3a0805"
          strokeWidth="0.3"
        />
      </g>

      {/* ---------- LEFT SHOULDER ---------- */}
      <g style={part(380, "left")}>
        <path
          d="M 6 44 Q 4 50 8 62 L 24 56 L 26 44 Z"
          fill="url(#suitRed)"
          stroke="#3a0805"
          strokeWidth="0.4"
        />
        {/* pauldron highlight */}
        <path d="M 8 46 L 22 46 L 24 54 L 10 58 Z" fill="url(#suitGoldLight)" opacity="0.25" />
      </g>

      {/* ---------- RIGHT SHOULDER ---------- */}
      <g style={part(420, "right")}>
        <path
          d="M 94 44 Q 96 50 92 62 L 76 56 L 74 44 Z"
          fill="url(#suitRed)"
          stroke="#3a0805"
          strokeWidth="0.4"
        />
        <path d="M 92 46 L 78 46 L 76 54 L 90 58 Z" fill="url(#suitGoldLight)" opacity="0.25" />
      </g>

      {/* ---------- CHEST PLATE ---------- */}
      <g style={part(560, "bottom")}>
        {/* main chest silhouette */}
        <path
          d="M 24 44 L 76 44 L 80 58 L 82 74 L 78 88 L 22 88 L 18 74 L 20 58 Z"
          fill="url(#suitRed)"
          stroke="#3a0805"
          strokeWidth="0.4"
        />
        {/* gold V upper-chest */}
        <path
          d="M 28 44 L 72 44 L 68 54 L 62 62 L 50 70 L 38 62 L 32 54 Z"
          fill="url(#suitGold)"
          stroke="#5e3c0a"
          strokeWidth="0.3"
        />
        {/* abdominal plating */}
        <path
          d="M 28 78 L 72 78 L 74 86 L 26 86 Z"
          fill="url(#suitGold)"
          opacity="0.6"
          stroke="#5e3c0a"
          strokeWidth="0.3"
        />
        {/* side panels highlight */}
        <path d="M 18 74 L 22 88 L 26 86 L 22 74 Z" fill="url(#suitRedDark)" opacity="0.7" />
        <path d="M 82 74 L 78 88 L 74 86 L 78 74 Z" fill="url(#suitRedDark)" opacity="0.7" />
        {/* vertical chest seam */}
        <line x1="50" y1="44" x2="50" y2="88" stroke="#3a0805" strokeWidth="0.3" />
        {/* horizontal ab seam */}
        <line x1="28" y1="78" x2="72" y2="78" stroke="#5e3c0a" strokeWidth="0.3" />

        {/* ---- ARC REACTOR ---- */}
        <g transform="translate(50 66)">
          {/* recessed housing */}
          <circle cx="0" cy="0" r="6.5" fill="#1a0604" />
          <circle cx="0" cy="0" r="6" fill="none" stroke="#5e3c0a" strokeWidth="0.3" />
          {/* outer ring illumination */}
          <circle
            cx="0"
            cy="0"
            r="5.5"
            fill="url(#reactorGlow)"
            opacity={locked ? 1 : 0.3}
            style={{ transition: "opacity 500ms ease" }}
          />
          {/* segmented outer ring (12 slats) */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const x1 = Math.cos(a) * 4.4;
            const y1 = Math.sin(a) * 4.4;
            const x2 = Math.cos(a) * 5.4;
            const y2 = Math.sin(a) * 5.4;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={locked ? "#e8f7ff" : "#5e3c0a"}
                strokeWidth="0.4"
                opacity={locked ? 0.95 : 0.5}
                style={{ transition: "stroke 400ms ease, opacity 400ms ease" }}
              />
            );
          })}
          {/* triangular coil */}
          <polygon
            points="0,-3.5 3,2 -3,2"
            fill="none"
            stroke={locked ? "#ffffff" : "#7fd9ff"}
            strokeWidth="0.5"
            opacity={locked ? 0.95 : 0.6}
            style={{ transition: "stroke 400ms ease, opacity 400ms ease" }}
          />
          {/* core */}
          <circle
            cx="0"
            cy="0"
            r="3.2"
            fill="url(#reactorCore)"
            opacity={locked ? 1 : 0.4}
            style={{
              transition: "opacity 500ms ease",
              transformOrigin: "center",
              animation: locked ? "suit-reactor-pulse 900ms ease-in-out infinite" : undefined,
            }}
          />
          {/* outer bloom halo */}
          {locked && (
            <circle
              cx="0"
              cy="0"
              r="10"
              fill="url(#reactorGlow)"
              opacity="0.55"
              style={{
                filter: "blur(1px)",
                animation: "suit-reactor-bloom 900ms ease-in-out infinite",
              }}
            />
          )}
        </g>
      </g>

      {/* ---------- LEFT UPPER ARM ---------- */}
      <g style={part(640, "left")}>
        <path
          d="M 8 50 L 22 54 L 20 74 L 8 72 Z"
          fill="url(#suitRed)"
          stroke="#3a0805"
          strokeWidth="0.4"
        />
        <path d="M 10 54 L 16 55 L 15 71 L 10 70 Z" fill="url(#suitGoldLight)" opacity="0.2" />
      </g>
      {/* ---------- RIGHT UPPER ARM ---------- */}
      <g style={part(660, "right")}>
        <path
          d="M 92 50 L 78 54 L 80 74 L 92 72 Z"
          fill="url(#suitRed)"
          stroke="#3a0805"
          strokeWidth="0.4"
        />
        <path d="M 90 54 L 84 55 L 85 71 L 90 70 Z" fill="url(#suitGoldLight)" opacity="0.2" />
      </g>

      {/* ---------- LEFT FOREARM / GAUNTLET ---------- */}
      <g style={part(780, "left")}>
        <path
          d="M 8 72 L 22 72 L 22 76 L 20 94 L 10 94 L 8 76 Z"
          fill="url(#suitGold)"
          stroke="#5e3c0a"
          strokeWidth="0.4"
        />
        {/* knuckle band */}
        <rect x="9" y="76" width="12" height="2" fill="#5e3c0a" opacity="0.6" />
        <rect x="9" y="88" width="12" height="1.5" fill="#5e3c0a" opacity="0.6" />
      </g>
      {/* ---------- RIGHT FOREARM / GAUNTLET ---------- */}
      <g style={part(800, "right")}>
        <path
          d="M 92 72 L 78 72 L 78 76 L 80 94 L 90 94 L 92 76 Z"
          fill="url(#suitGold)"
          stroke="#5e3c0a"
          strokeWidth="0.4"
        />
        <rect x="79" y="76" width="12" height="2" fill="#5e3c0a" opacity="0.6" />
        <rect x="79" y="88" width="12" height="1.5" fill="#5e3c0a" opacity="0.6" />
      </g>

      {/* ---------- HIPS ---------- */}
      <g style={part(900, "bottom")}>
        <path
          d="M 22 88 L 78 88 L 76 100 L 24 100 Z"
          fill="url(#suitRedDark)"
          stroke="#3a0805"
          strokeWidth="0.4"
        />
        <line x1="50" y1="88" x2="50" y2="100" stroke="#3a0805" strokeWidth="0.3" />
        {/* belt trim */}
        <rect x="24" y="97" width="52" height="1.2" fill="url(#suitGold)" opacity="0.5" />
      </g>

      {/* ---------- LEFT THIGH ---------- */}
      <g style={part(1040, "bottom")}>
        <path
          d="M 26 100 L 48 100 L 45 128 L 28 128 Z"
          fill="url(#suitRed)"
          stroke="#3a0805"
          strokeWidth="0.4"
        />
        <path d="M 29 102 L 34 102 L 32 126 L 28 126 Z" fill="url(#suitGoldLight)" opacity="0.15" />
      </g>
      {/* ---------- RIGHT THIGH ---------- */}
      <g style={part(1080, "bottom")}>
        <path
          d="M 74 100 L 52 100 L 55 128 L 72 128 Z"
          fill="url(#suitRed)"
          stroke="#3a0805"
          strokeWidth="0.4"
        />
        <path d="M 71 102 L 66 102 L 68 126 L 72 126 Z" fill="url(#suitGoldLight)" opacity="0.15" />
      </g>

      {/* ---------- LEFT SHIN (gold greaves) ---------- */}
      <g style={part(1200, "bottom")}>
        <path
          d="M 28 128 L 45 128 L 42 156 L 30 156 Z"
          fill="url(#suitGold)"
          stroke="#5e3c0a"
          strokeWidth="0.4"
        />
        {/* knee cap */}
        <path d="M 30 128 L 43 128 L 42 133 L 31 133 Z" fill="url(#suitRedDark)" opacity="0.7" />
      </g>
      {/* ---------- RIGHT SHIN ---------- */}
      <g style={part(1240, "bottom")}>
        <path
          d="M 72 128 L 55 128 L 58 156 L 70 156 Z"
          fill="url(#suitGold)"
          stroke="#5e3c0a"
          strokeWidth="0.4"
        />
        <path d="M 70 128 L 57 128 L 58 133 L 69 133 Z" fill="url(#suitRedDark)" opacity="0.7" />
      </g>

      {/* ---------- LEFT BOOT ---------- */}
      <g style={part(1360, "bottom")}>
        <path
          d="M 28 156 L 42 156 L 44 164 L 42 170 L 28 170 L 26 164 Z"
          fill="url(#suitRed)"
          stroke="#3a0805"
          strokeWidth="0.4"
        />
        <path d="M 30 164 L 42 164 L 43 168 L 29 168 Z" fill="url(#suitGold)" opacity="0.55" />
        {/* thrust nozzle */}
        <circle cx="35" cy="170" r="2.5" fill="#1a0604" stroke="#5e3c0a" strokeWidth="0.3" />
      </g>
      {/* ---------- RIGHT BOOT ---------- */}
      <g style={part(1400, "bottom")}>
        <path
          d="M 72 156 L 58 156 L 56 164 L 58 170 L 72 170 L 74 164 Z"
          fill="url(#suitRed)"
          stroke="#3a0805"
          strokeWidth="0.4"
        />
        <path d="M 70 164 L 58 164 L 57 168 L 71 168 Z" fill="url(#suitGold)" opacity="0.55" />
        <circle cx="65" cy="170" r="2.5" fill="#1a0604" stroke="#5e3c0a" strokeWidth="0.3" />
      </g>
    </svg>
  );
}

/* -------------------- Decorative overlays -------------------- */

function FlameTrail({ left, right }: { left?: string; right?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        right,
        top: "96%",
        width: "16%",
        height: "50vmin",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "28%",
          right: "28%",
          top: 0,
          bottom: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,220,120,0.92) 22%, rgba(255,140,40,0.55) 55%, transparent 100%)",
          borderRadius: "50% 50% 30% 30% / 20% 20% 100% 100%",
          animation: "suit-flame 70ms ease-in-out infinite",
          transformOrigin: "top center",
          filter: "blur(1px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "10%",
          right: "10%",
          top: 0,
          bottom: 0,
          background:
            "linear-gradient(180deg, rgba(255,200,80,0.85) 0%, rgba(255,120,30,0.55) 45%, rgba(255,60,10,0.25) 75%, transparent 100%)",
          borderRadius: "50% 50% 30% 30% / 20% 20% 100% 100%",
          filter: "blur(4px)",
          animation: "suit-flame 110ms ease-in-out infinite",
          transformOrigin: "top center",
        }}
      />
    </div>
  );
}

function RepulsorGlow({ style }: { style: React.CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        width: "10%",
        aspectRatio: "1",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, #ffffff 0%, #bde9ff 30%, #00e5ff 60%, transparent 100%)",
        boxShadow: "0 0 14px rgba(0,229,255,0.95), 0 0 32px rgba(0,229,255,0.55)",
        animation: "suit-reactor-pulse 600ms ease-in-out infinite",
        ...style,
      }}
    />
  );
}

function StatusLabel({
  text,
  sub,
  gold,
  progress,
  launchEcho,
}: {
  text: string;
  sub?: string;
  gold?: boolean;
  progress?: boolean;
  launchEcho?: boolean;
}) {
  const borderColor = gold ? "rgba(255,200,80,0.85)" : "rgba(255,120,40,0.75)";
  const titleColor = gold ? "#ffe2a0" : "#ffd28a";
  const shadow = gold
    ? "0 0 10px rgba(255,200,80,0.95), 0 0 26px rgba(255,140,40,0.6)"
    : "0 0 10px rgba(255,120,40,0.9), 0 0 26px rgba(255,80,20,0.55)";
  return (
    <div
      className="absolute left-1/2 px-6 py-3"
      style={{
        top: "10%",
        transform: "translateX(-50%)",
        background: "rgba(30,8,2,0.7)",
        border: `2px solid ${borderColor}`,
        boxShadow: `0 0 30px ${borderColor}`,
        animation: "suit-label-in 300ms ease-out forwards",
      }}
    >
      <div
        className="hud-font font-bold text-xl sm:text-2xl tracking-[0.3em] text-center"
        style={{ color: titleColor, textShadow: shadow }}
      >
        {text}
      </div>
      {sub && (
        <div className="hud-mono text-[0.65rem] tracking-[0.4em] text-center mt-1 text-amber-200/80">
          {sub}
          {progress && <span className="hud-blink"> …</span>}
          {launchEcho && <span className="hud-blink"> ↑↑↑</span>}
        </div>
      )}
    </div>
  );
}

/* -------------------- Keyframes -------------------- */

const suitStyles = `
  @keyframes suit-backdrop {
    0%   { opacity: 0; }
    8%   { opacity: 1; }
    90%  { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes suit-scan {
    0%   { transform: translateY(0); opacity: 0; }
    10%  { opacity: 1; }
    95%  { opacity: 1; }
    100% { transform: translateY(100vh); opacity: 0; }
  }
  /* SVG groups fly in using transform at group level */
  @keyframes suit-fly-top {
    0%   { transform: translate(0, -100vh) rotate(-10deg) scale(0.9); opacity: 0; }
    80%  { opacity: 1; }
    100% { transform: translate(0, 0) rotate(0) scale(1); opacity: 1; }
  }
  @keyframes suit-fly-bottom {
    0%   { transform: translate(0, 100vh) rotate(10deg) scale(0.9); opacity: 0; }
    80%  { opacity: 1; }
    100% { transform: translate(0, 0) rotate(0) scale(1); opacity: 1; }
  }
  @keyframes suit-fly-left {
    0%   { transform: translate(-70vw, 0) rotate(-15deg) scale(0.9); opacity: 0; }
    80%  { opacity: 1; }
    100% { transform: translate(0, 0) rotate(0) scale(1); opacity: 1; }
  }
  @keyframes suit-fly-right {
    0%   { transform: translate(70vw, 0) rotate(15deg) scale(0.9); opacity: 0; }
    80%  { opacity: 1; }
    100% { transform: translate(0, 0) rotate(0) scale(1); opacity: 1; }
  }
  @keyframes suit-reactor-pulse {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.14); }
  }
  @keyframes suit-reactor-bloom {
    0%, 100% { transform: scale(0.9); opacity: 0.3; }
    50%      { transform: scale(1.2); opacity: 0.7; }
  }
  @keyframes suit-shake {
    0%   { transform: translate(0, 0); }
    25%  { transform: translate(-1px, 1px); }
    50%  { transform: translate(1px, -1px); }
    75%  { transform: translate(-1px, -1px); }
    100% { transform: translate(0, 0); }
  }
  @keyframes suit-launch-flash {
    0%   { opacity: 0; }
    20%  { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes suit-flame {
    0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.95; }
    50%      { transform: scaleY(1.25) scaleX(0.85); opacity: 1; }
  }
  @keyframes suit-label-in {
    0%   { opacity: 0; transform: translate(-50%, 12px); }
    100% { opacity: 1; transform: translate(-50%, 0); }
  }
`;
