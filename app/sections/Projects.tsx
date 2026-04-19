import { SectionFrame } from "../components/HudOverlay";
import { openSource, blogs, extras } from "../data/profile";

export function Projects() {
  return (
    <SectionFrame
      id="projects"
      label="// DEPLOYMENTS"
      title="Open Channels"
      accent="gold"
    >
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Open source */}
        <div className="hud-panel p-5 sm:p-6 lg:col-span-1 reveal">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />
          <div className="hud-mono text-[0.7rem] text-amber-300 tracking-widest mb-3">
            OPEN SOURCE BROADCAST
          </div>
          {openSource.map((p) => (
            <div key={p.name} className="mb-2">
              <h3 className="hud-font text-lg text-cyan-100 hud-text-glow">
                {p.name}
              </h3>
              <p className="text-cyan-100/80 text-sm mt-1">{p.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="hud-chip">{p.meta}</span>
                <span className="hud-chip">NPM</span>
              </div>
            </div>
          ))}
          <div className="hud-divider my-5" />
          <div className="hud-mono text-[0.7rem] text-cyan-400/70 tracking-widest mb-2">
            FIELD OPERATIONS
          </div>
          <ul className="space-y-1.5 text-cyan-100/85 text-sm">
            {extras.map((e, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-300">◆</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Blogs */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {blogs.map((b, i) => (
            <a
              key={b.url}
              href={b.url}
              target="_blank"
              rel="noreferrer"
              className="hud-panel p-5 group transition-all duration-300 hover:-translate-y-1 reveal block"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="hud-corner-tl" />
              <div className="hud-corner-tr" />
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />
              <div className="flex items-center justify-between mb-3">
                <span className="hud-chip">{b.tag}</span>
                <span className="hud-mono text-[0.65rem] text-cyan-400/70">
                  LOG.{(i + 1).toString().padStart(3, "0")}
                </span>
              </div>
              <h3 className="hud-font text-base sm:text-lg text-cyan-100 group-hover:text-white group-hover:hud-text-glow transition-colors leading-tight">
                {b.title}
              </h3>
              <div className="flex items-center justify-between mt-5">
                <span className="hud-mono text-[0.7rem] text-cyan-400/70">
                  medium.com / transmission
                </span>
                <span className="text-amber-300 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}
