import { SectionFrame } from "../components/HudOverlay";
import { profile } from "../data/profile";

export function Contact() {
  const channels = [
    { label: "EMAIL", value: profile.email, href: `mailto:${profile.email}` },
    { label: "PHONE", value: profile.phone, href: `tel:${profile.phone.replace(/[^+\d]/g, "")}` },
    { label: "LINKEDIN", value: "/nishant-kumar-tiwari", href: profile.linkedin },
    { label: "PORTFOLIO V1", value: "nishant-kumarr-tiwari.netlify.app", href: profile.portfolio },
  ];

  return (
    <SectionFrame id="contact" label="// UPLINK" title="Open A Secure Channel">
      <div className="grid md:grid-cols-[1fr_1.2fr] gap-5">
        <div className="hud-panel p-6 sm:p-8 reveal relative overflow-hidden">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          {/* Radar sweep */}
          <div className="absolute -top-10 -right-10 w-56 h-56 pointer-events-none opacity-40">
            <div className="absolute inset-0 rounded-full border border-cyan-400/40" />
            <div className="absolute inset-6 rounded-full border border-cyan-400/30" />
            <div className="absolute inset-14 rounded-full border border-cyan-400/20" />
            <div
              className="absolute inset-0 rounded-full hud-spin-fast"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(0,229,255,0.45), transparent 30%)",
                maskImage:
                  "radial-gradient(circle, black 35%, transparent 75%)",
              }}
            />
          </div>

          <div className="hud-mono text-[0.7rem] text-cyan-400/70 tracking-widest mb-2">
            COMMS // ENCRYPTED
          </div>
          <h3 className="hud-font text-2xl text-cyan-100 hud-text-glow mb-3">
            READY FOR TRANSMISSION
          </h3>
          <p className="text-cyan-100/80 text-sm leading-relaxed mb-6 max-w-md">
            Got a suit of armor that needs building? Frontend, performance, or
            real-time systems — open a channel and J.A.R.V.I.S. will route your
            signal.
          </p>
          <a href={`mailto:${profile.email}`} className="hud-btn hud-btn-gold">
            Transmit // {profile.email}
          </a>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="hud-panel p-5 group transition-all hover:-translate-y-1 reveal"
            >
              <div className="hud-corner-tl" />
              <div className="hud-corner-tr" />
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />
              <div className="hud-mono text-[0.65rem] text-amber-300 tracking-widest mb-2">
                {c.label} &gt;
              </div>
              <div className="hud-font text-sm text-cyan-100 group-hover:text-white group-hover:hud-text-glow break-all">
                {c.value}
              </div>
              <div className="hud-divider mt-4" />
            </a>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center reveal">
        <div className="hud-mono text-[0.7rem] text-cyan-400/60 tracking-[0.4em]">
          — END OF TRANSMISSION —
        </div>
        <div className="hud-mono text-[0.65rem] text-cyan-400/40 mt-2">
          STARK INDUSTRIES // PRIVATE NETWORK // ALL SIGNALS LOGGED
        </div>
      </div>
    </SectionFrame>
  );
}
