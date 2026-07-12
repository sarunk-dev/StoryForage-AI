"use client";

import { BookOpen, Users, Globe, Cpu, Sparkles } from "lucide-react";

/**
 * DemoDeck — static hardcoded sample output shown on the landing page.
 * Gives judges an immediate sense of the generated pitch deck quality
 * without needing to wait 60 seconds for a real generation.
 */

const DEMO = {
  prompt: "A blind cartographer discovers the world is flat",
  genre: "Fantasy",
  story: {
    title: "The Edge of Everything",
    logline:
      "A blind cartographer who maps the world through sound and vibration uncovers the terrifying truth — and must choose whether to share it.",
    premise:
      "MIRA VOSS has spent her life making maps she can never see, translating the whispers of traders and the rhythm of tides into charts said to be more accurate than any sighted surveyor's work. When a dying sailor presses a final fragment of chart into her hands, she traces its edges and feels what should be impossible: the world simply… stops. What lies beyond the Edge is not ocean but silence — and something is already climbing up.",
    acts: {
      act1: "Mira deciphers the fragment in her cartography guild in Port Calden. The guild elders dismiss her findings as a forgery, but a royal navigator secretly funds her expedition westward. She assembles a crew of misfits — a disgraced helmsman, a Tidepriest who stopped believing, and a stowaway girl who claims she has already been to the Edge.",
      act2: "Three weeks at sea, instruments fail, stars vanish from the sky, and two crew members disappear without sound. The stowaway reveals she is the sole survivor of a previous Crown expedition. The world's edge is not a cliff — it is a threshold, and something vast communicates through the absence of sound. Mira realises her blindness is not a limitation; she is the only one who can perceive its true shape.",
      act3: "Mira crosses the threshold alone. She charts the space beyond using touch, pulse, and breath, and discovers the 'flat earth' is the top face of a living entity so ancient it has forgotten it is alive. She returns with two maps: one for the Crown that will keep the secret, and one she releases to every port in the world, knowing it will change everything. The entity stirs.",
    },
    theme: "The cost of truth in a world that profits from illusion",
    tone: "Dark & Gritty",
  },
  characters: [
    {
      name: "Mira Voss",
      role: "Protagonist",
      physicalDescription:
        "Mid-30s, close-cropped dark hair, milky sightless eyes that track sound with unsettling precision. Ink-stained fingers, a cane that doubles as a measuring rod.",
      backstory:
        "Blinded in a fire at age seven that also destroyed her father's atlas workshop. Rebuilt his practice from memory, then surpassed him. The guild tolerates her because her charts are simply better.",
      motivation: "To produce the one map that can never be disputed — the map of the world itself.",
      fatalFlaw: "Believes that truth, once found, must be shared regardless of consequence.",
      definingQuote: "I have never needed to see a place to know exactly where it ends.",
    },
    {
      name: "Sable",
      role: "Wildcard",
      physicalDescription:
        "Appears 12, may be older. Salt-bleached hair. Never blinks in direct sunlight. Leaves no footprints on wet sand.",
      backstory:
        "The only named survivor of the Crown's lost Horizon Fleet, sent six years ago. She does not appear to have aged. She does not discuss what she saw. She hums.",
      motivation: "To go back.",
      fatalFlaw: "She is no longer entirely human — and hasn't decided if that matters.",
      definingQuote: "The Edge doesn't fall. It breathes.",
    },
    {
      name: "Admiral Harken",
      role: "Antagonist",
      physicalDescription:
        "Heavyset, immaculate naval uniform, a prosthetic right hand of polished brass. Calm voice, never raises it.",
      backstory:
        "He commissioned the Horizon Fleet. He received Sable back alone. He buried the report and erased the voyage from official record. He has kept the secret for six years because he believes humanity is not ready.",
      motivation: "To control when, how, and whether the world learns what is out there.",
      fatalFlaw: "He may be right.",
      definingQuote: "There are truths the world survives and truths it does not. My job is to know the difference.",
    },
  ],
  world: {
    settingName: "The Calden Reach & The Threshold",
    atmosphere:
      "An age of sail where maps are currency and ignorance is policy. The sea smells of iron past the 40th meridian.",
    geography:
      "A vast ocean world of island chains and trade-wind kingdoms. West of the Hollows, compasses spin freely and the horizon line is wrong — too flat, too close, too still.",
    rulesOrSystem:
      "Sound is the dominant navigation sense past the Veil Line. Light bends unreliably. Conventional instruments fail. Mira's touch-cartography — a tactile mapping system of her own invention — works where everything else does not.",
    culturalFlavor:
      "Maritime mercantile society. Maps are property, secrets, weapons. Cartographers guild-certified; unlicensed mapping is a capital crime. The Church of Tides teaches the world is a wheel with no edge — the Tidepriests are the state's primary anti-heresy arm.",
  },
};

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 section-label">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
}

export function DemoDeck() {
  return (
    <div className="space-y-2">
      {/* Demo header pill */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Sample Output
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide
                           bg-[#0f62fe] text-white rounded-full px-2.5 py-0.5 leading-none">
            <Cpu className="w-2.5 h-2.5" />
            
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground/40 italic">
          &ldquo;{DEMO.prompt}&rdquo;
        </span>
      </div>

      {/* ── Story ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/50 bg-card px-6 py-6 space-y-6">
        {/* Label row */}
        <div className="flex items-center gap-3 flex-wrap">
          <SectionLabel icon={BookOpen} label="Story Outline" />
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide
                           bg-[#0f62fe] text-white rounded-full px-2.5 py-0.5 leading-none">
            <Cpu className="w-2.5 h-2.5" />
            IBM Granite 4
          </span>
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide
                           border border-primary/30 text-primary/80 bg-primary/5 rounded-full px-2.5 py-0.5">
            {DEMO.genre}
          </span>
        </div>

        {/* Title + logline */}
        <div className="space-y-1.5">
          <h3 className="text-[1.9rem] font-extrabold tracking-tight leading-tight">
            {DEMO.story.title}
          </h3>
          <p className="text-[14px] text-muted-foreground italic leading-relaxed">
            &ldquo;{DEMO.story.logline}&rdquo;
          </p>
        </div>

        {/* Premise */}
        <div className="rounded-xl bg-muted/40 border border-border/50 px-5 py-4">
          <p className="text-[14px] leading-[1.75] text-foreground/90">{DEMO.story.premise}</p>
        </div>

        {/* Three acts */}
        <div className="space-y-2.5">
          {(["act1", "act2", "act3"] as const).map((key, i) => (
            <div
              key={key}
              className="flex gap-4 rounded-xl border border-border/40 bg-card px-4 py-4"
            >
              <div className="flex-shrink-0 w-16 pt-0.5">
                <div className="text-[12px] font-bold text-primary uppercase tracking-widest">
                  Act {["I", "II", "III"][i]}
                </div>
                <div className="text-[11px] text-muted-foreground/60 mt-0.5 font-medium">
                  {["Setup", "Conflict", "Resolution"][i]}
                </div>
              </div>
              <div className="w-px bg-border/60 flex-shrink-0 self-stretch" />
              <p className="flex-1 text-[14px] leading-[1.75] text-foreground/85 min-w-0">
                {DEMO.story.acts[key]}
              </p>
            </div>
          ))}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted-foreground pt-2 border-t border-border/40">
          <span>
            <span className="font-semibold text-foreground/70">Theme</span>
            <span className="mx-1.5 text-border">—</span>
            {DEMO.story.theme}
          </span>
          <span>
            <span className="font-semibold text-foreground/70">Tone</span>
            <span className="mx-1.5 text-border">—</span>
            {DEMO.story.tone}
          </span>
        </div>
      </div>

      {/* ── Characters ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/50 bg-card px-6 py-6 space-y-5">
        <SectionLabel icon={Users} label="Characters" />
        <div className="grid gap-4 sm:grid-cols-3">
          {DEMO.characters.map((char, idx) => (
            <div
              key={char.name}
              className="rounded-xl border border-border/50 bg-background p-4 space-y-3 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground/40 block mb-0.5">
                    #{String(idx + 1).padStart(2, "0")}
                  </span>
                  <h4 className="text-[1rem] font-bold tracking-tight leading-snug">{char.name}</h4>
                </div>
                <span className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border
                                 bg-muted/60 text-muted-foreground border-border flex-shrink-0 mt-0.5">
                  {char.role}
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground italic leading-relaxed">{char.physicalDescription}</p>
              <p className="text-[13px] text-foreground/80 leading-relaxed flex-1">{char.backstory}</p>
              <div className="border-l-2 border-primary/40 pl-3 py-0.5">
                <p className="text-[12px] italic text-muted-foreground">&ldquo;{char.definingQuote}&rdquo;</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── World ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/50 bg-card px-6 py-6 space-y-5">
        <SectionLabel icon={Globe} label="World Building" />
        <div className="rounded-2xl ink-surface px-6 py-5 space-y-1.5">
          <h3 className="text-[1.2rem] font-bold tracking-tight">{DEMO.world.settingName}</h3>
          <p className="text-[13px] leading-relaxed opacity-60 italic">{DEMO.world.atmosphere}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { label: "Geography & Environment", value: DEMO.world.geography },
            { label: "Rules & Systems", value: DEMO.world.rulesOrSystem },
            { label: "Culture & Society", value: DEMO.world.culturalFlavor },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-2">
              <div className="section-label">{label}</div>
              <p className="text-[13px] leading-relaxed text-foreground/80">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA nudge */}
      <div className="text-center pt-3 pb-1">
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground/50">
          <Sparkles className="w-3 h-3" />
          Type your own concept above to generate a full deck in under 60 seconds
        </span>
      </div>
    </div>
  );
}
