import { SectionFrame } from "../components/HudOverlay";
import { skills } from "../data/profile";

export function Skills() {
  const groups: { label: string; items: string[] }[] = [
    { label: "LANGUAGES", items: skills.languages },
    { label: "FRAMEWORKS", items: skills.frameworks },
    { label: "TOOLING", items: skills.tools },
    { label: "ARCHITECTURE", items: skills.architecture },
  ];

  return (
    <SectionFrame id="skills" label="// ARSENAL" title="Weapon Systems">
      <div className="grid md:grid-cols-2 gap-5">
        {groups.map((g) => (
          <div key={g.label} className="hud-panel p-5 sm:p-6 reveal">
            <div className="hud-corner-tl" />
            <div className="hud-corner-tr" />
            <div className="hud-corner-bl" />
            <div className="hud-corner-br" />
            <div className="flex items-center justify-between mb-4">
              <div className="hud-font text-amber-300 text-sm tracking-[0.3em]">
                {g.label}
              </div>
              <div className="hud-mono text-[0.65rem] text-cyan-400/70">
                {g.items.length.toString().padStart(2, "0")} MODULES
              </div>
            </div>
            <div className="hex-grid">
              {g.items.map((s) => (
                <div key={s} className="hex-chip">
                  {s}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}
