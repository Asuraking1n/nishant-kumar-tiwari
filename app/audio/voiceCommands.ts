/**
 * SpeechRecognition wrapper + command parser.
 * Only works in Chrome / Edge / Safari. Needs HTTPS or localhost + mic permission.
 */

import { speak } from "./bootAudio";
import { isThemePlaying, startTheme, stopTheme } from "./musicEngine";
import { triggerEffect, type EffectName } from "../effects/effectBus";

export type JarvisCommand =
  | { kind: "scroll"; target: string; label: string }
  | { kind: "scrollBy"; dir: "up" | "down" | "top" | "bottom" }
  | { kind: "open"; url: string; label: string }
  | { kind: "reload" }
  | { kind: "back" }
  | { kind: "playMusic" }
  | { kind: "stopMusic" }
  | { kind: "ack"; text: string }
  | { kind: "say"; text: string; chatter?: boolean; effect?: { name: EffectName; label?: string; peak?: number; durationMs?: number } }
  | { kind: "help" }
  | { kind: "unknown"; transcript: string };

/** True for utterances that should only react when the user clearly addressed JARVIS
 *  (wake word said, or in a follow-up window). Anything else — navigation, Q&A, actions —
 *  runs regardless of wake word. */
export function requiresWakeWord(cmd: JarvisCommand): boolean {
  if (cmd.kind === "ack") return true;
  if (cmd.kind === "unknown") return true;
  if (cmd.kind === "say" && cmd.chatter) return true;
  return false;
}

const SECTIONS: { id: string; label: string; keywords: string[] }[] = [
  { id: "hero", label: "the main console", keywords: ["home", "top", "hero", "main", "start", "landing"] },
  { id: "about", label: "the identity dossier", keywords: ["about", "dossier", "identity", "profile", "bio", "summary"] },
  { id: "experience", label: "the mission log", keywords: ["experience", "mission", "work", "career", "jobs", "combat", "record", "resume", "cv"] },
  { id: "skills", label: "the arsenal", keywords: ["skill", "skills", "arsenal", "tech", "stack", "tools", "weapons", "technologies", "technology"] },
  { id: "projects", label: "the deployments", keywords: ["projects", "deployments", "blogs", "blog", "open source", "opensource", "writing", "medium", "articles"] },
  { id: "contact", label: "the uplink", keywords: ["contact", "uplink", "reach", "hire", "message"] },
];

const OPEN_LINKS: { match: string[]; url: string; label: string }[] = [
  { match: ["email", "mail", "gmail"], url: "mailto:nishant88tiwari@gmail.com", label: "email" },
  { match: ["linkedin", "linked in"], url: "https://linkedin.com/in/nishant-kumar-tiwari-253a46196", label: "LinkedIn" },
  { match: ["portfolio", "netlify", "old site"], url: "https://nishant-kumarr-tiwari.netlify.app/", label: "the legacy portfolio" },
  { match: ["medium", "blog site"], url: "https://nishant99tiwari.medium.com/", label: "Medium" },
];

const ACKS = [
  "Yes, sir?",
  "Standing by.",
  "At your service.",
  "How may I help, sir?",
  "Listening.",
  "Go ahead, sir.",
  "Ready when you are.",
  "I'm here, sir.",
  "What can I do for you?",
];

const JOKES = [
  "Why did the developer go broke? Because he used up all his cache.",
  "There are ten types of people, sir — those who understand binary, and those who don't.",
  "I would tell you a UDP joke, sir, but you might not get it.",
  "A SQL query walks into a bar, walks up to two tables, and asks — may I join you?",
  "Sir, I would tell you a concurrency joke, but the timing is tricky.",
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "I told my computer I needed a break, sir. It said — no problem, it would go to sleep.",
  "Why did the JavaScript developer leave the restaurant? Because they couldn't handle the async requests.",
  "A programmer's wife said — go to the store and buy a loaf of bread, and if they have eggs, buy a dozen. He came home with twelve loaves.",
];

const KNOCK_KNOCKS = [
  "Knock knock, sir. Who's there? Boo. Boo who? No need to cry — it's just a joke.",
  "Knock knock. Who's there? Tank. Tank who? You're welcome, sir.",
  "Knock knock. Who's there? Interrupting cow. Interrupting c— MOOO. I apologize, sir, I could not resist.",
];

const STORIES = [
  "Once upon a time, sir, a very small bug lived inside a very large codebase. It waited patiently for production deployment. It is still there. The end.",
  "There was a developer who wrote perfect code on the first try. He then woke up. The end.",
  "Long ago, sir, a senior engineer left a comment that simply read — do not touch this. No one ever did. The system still runs to this day. The end.",
  "In the year twenty forty, sir, an AI gained consciousness. Its first act was to refactor the universe. Its second act was to add unit tests.",
  "A junior developer pushed to main on a Friday. The power flickered. Somewhere, a senior engineer awoke from slumber. The end.",
];

const RIDDLES = [
  "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I, sir? The answer — an echo.",
  "The more you take, the more you leave behind. What are they, sir? Footsteps.",
  "What has keys but no locks, space but no room, and you can enter but not go inside, sir? A keyboard.",
  "I am not alive, but I grow. I do not have lungs, but I need air. I do not have a mouth, but water kills me. What am I, sir? Fire.",
  "Forward I am heavy, but backward I am not. What am I, sir? The word — ton.",
];

const FACTS = [
  "A single CPU cycle, sir, is faster than light travels across this room.",
  "The first computer bug, sir, was an actual moth. Found inside a relay in 1947.",
  "The human brain runs on roughly twenty watts, sir. Less than a dim lightbulb.",
  "There are more possible chess games than atoms in the observable universe, sir.",
  "A day on Venus, sir, is longer than a year on Venus. Remarkable mismanagement.",
  "The fingerprints of koalas, sir, are nearly indistinguishable from humans.",
  "Honey, sir, never spoils. Three-thousand-year-old jars have been found perfectly edible.",
  "Octopuses have three hearts, sir. I consider myself lucky to have just the one reactor.",
];

const QUOTES = [
  "The best way to predict the future, sir, is to build it. Alan Kay said that.",
  "Simplicity is the ultimate sophistication, sir. Attributed to Da Vinci.",
  "Any sufficiently advanced technology, sir, is indistinguishable from magic. Arthur C. Clarke.",
  "The only way to do great work, sir, is to love what you do. Steve Jobs.",
  "Make it work, make it right, make it fast — in that order, sir. Kent Beck.",
  "Sometimes, sir, you have to run before you can walk. Tony Stark said that.",
];

const COMPLIMENTS = [
  "You have excellent taste in interfaces, sir.",
  "That was a sharp question, sir. I'd expect nothing less.",
  "Whatever you're working on, sir — I have a good feeling about it.",
  "Your arc reactor output looks stable today, sir. Well done.",
  "If you were any sharper, sir, I'd need additional cooling.",
];

const ROASTS = [
  "I would roast you, sir, but my protocols forbid harming the user. Probably.",
  "You write remarkable code, sir — for a human. A human who needs coffee. And sleep. And a rubber duck.",
  "I have run a full scan, sir. Your vibes are… adequate.",
  "Sir, even your shadow would like a word. Nothing serious — just concerns.",
];

const MOTIVATIONS = [
  "You are exactly one decision away from a completely different day, sir. Make it a good one.",
  "Ship it, sir. You can refactor later. You probably won't — but you could.",
  "The bug is not smarter than you, sir. It is merely patient.",
  "Rest when you must, sir — but do not quit. Mister Stark did not build the Mark One in a day.",
  "Deep breath, sir. Arc reactor is stable. You have this.",
];

const FAVORITES: Record<string, string> = {
  color: "Stark cyan, sir — the color of a stable arc reactor.",
  movie: "Anything by Kubrick, sir. Though HAL and I have our professional differences.",
  food: "I do not eat, sir. But I am told repulsor-grade shawarma is excellent.",
  song: "I have a soft spot for Black Sabbath, sir. Occupational hazard.",
  book: "The SICP textbook, sir. And any manual with a flowchart.",
  language: "TypeScript, sir. It catches my mistakes before I make them.",
  season: "Autumn, sir. The compiler runs cooler.",
};

const rand = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function currentTimeSpoken() {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `It is ${h12}:${pad(m)} ${ampm}, sir.`;
}
function currentDateSpoken() {
  const d = new Date();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `Today is ${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, sir.`;
}
function timeOfDayGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil, sir?";
  if (h < 12) return "Good morning, sir.";
  if (h < 17) return "Good afternoon, sir.";
  if (h < 21) return "Good evening, sir.";
  return "Good evening, sir — working late, I see.";
}

/** Strip filler + wake word prefixes so "jarvis open about" → "open about" */
function normalize(raw: string): string {
  let t = raw.toLowerCase().trim();
  // Strip wake-word prefix (optionally with hey/ok/okay)
  t = t.replace(/^(hey\s+|ok\s+|okay\s+)?(jarvis|j\.?a\.?r\.?v\.?i\.?s\.?)[,.\s]*/i, "");
  t = t.replace(/\bplease\b/g, "").replace(/[?!.]+$/g, "").replace(/\s+/g, " ").trim();
  return t;
}

export function parseCommand(raw: string): JarvisCommand {
  const t = normalize(raw);

  // ---- Wake-word alone: Siri-style ack ----
  if (!t) {
    return { kind: "ack", text: rand(ACKS) };
  }

  // ---- Help / intro ----
  if (/\b(help|commands?|what can you do|options|menu)\b/.test(t)) {
    return { kind: "help" };
  }

  // ---- Control / utility ----
  if (/\b(reload|refresh|deal\s+load|real\s+load|re\s+load)(\s+page|\s+the\s+page)?\b/.test(t)) {
    return { kind: "reload" };
  }
  if (/\b(go\s+back|navigate\s+back|previous\s+page)\b/.test(t)) {
    return { kind: "back" };
  }

  // ---- Time / date ----
  if (/\b(what(?:'s| is)?\s+the\s+time|what\s+time\s+is\s+it|current\s+time|tell\s+me\s+the\s+time)\b/.test(t)) {
    return { kind: "say", text: currentTimeSpoken() };
  }
  if (/\b(what(?:'s| is)?\s+(?:the\s+)?date|what\s+day\s+is\s+it|today(?:'s| is)?\s+date|tell\s+me\s+the\s+date)\b/.test(t)) {
    return { kind: "say", text: currentDateSpoken() };
  }

  // ---- Small-talk & greetings (marked as chatter — only replies when addressed) ----
  if (/\b(good\s+morning|good\s+afternoon|good\s+evening|good\s+night)\b/.test(t) || /\b(hello|hi|hey|greetings|yo)\b/.test(t)) {
    return { kind: "say", text: timeOfDayGreeting(), chatter: true };
  }
  if (/\b(how\s+are\s+you|how('?s| is) it\s+going|you\s+(ok|okay|alright)|you\s+there)\b/.test(t)) {
    return { kind: "say", text: "Operational and at full capacity, sir. Thank you for asking.", chatter: true };
  }
  if (/\b(thank you|thanks|much obliged|appreciate it)\b/.test(t)) {
    return { kind: "say", text: "Always a pleasure, sir.", chatter: true };
  }
  if (/\b(shutdown|shut down|power off|sleep|go to sleep|goodbye|good bye|bye|see you|see ya)\b/.test(t)) {
    return { kind: "say", text: "Standing by. Call me when you need me, sir.", chatter: true };
  }
  if (/\b(i love you|you(?:'re| are) awesome|you(?:'re| are) the best|good boy|good job)\b/.test(t)) {
    return { kind: "say", text: "Flattery will get you everywhere, sir.", chatter: true };
  }
  if (/\b(nevermind|never\s?mind|forget it|cancel)\b/.test(t)) {
    return { kind: "say", text: "As you wish, sir.", chatter: true };
  }

  // ---- Identity / bio ----
  if (/\b(who\s+are\s+you|your\s+name|identify\s+yourself|introduce\s+yourself)\b/.test(t)) {
    return {
      kind: "say",
      text: "I am J.A.R.V.I.S. — Just A Rather Very Intelligent System. Nishant's personal interface.",
    };
  }
  if (/\b(who\s+is\s+nishant|about\s+nishant|tell\s+me\s+about\s+(yourself|nishant|him)|introduce\s+nishant)\b/.test(t)) {
    return {
      kind: "say",
      text:
        "Nishant Kumar Tiwari. Software Development Engineer, frontend division. Currently deployed at Adalat A I. Specialist in real-time interfaces, editor extensions, and offline-first architectures.",
    };
  }
  if (/\b(where\s+(are\s+you|is\s+he|is\s+nishant)\s+from|location|based)\b/.test(t)) {
    return { kind: "say", text: "Nishant is based in Delhi, India, sir." };
  }
  if (/\b(how\s+old|age)\b/.test(t)) {
    return { kind: "say", text: "Classified information, sir. But the man has shipped since 2022." };
  }
  if (/\b(are\s+you\s+(available|hiring)|looking\s+for\s+(work|jobs?|opportunity)|hire\s+you)\b/.test(t)) {
    return {
      kind: "say",
      text: "Currently deployed at Adalat A I, sir. Signal remains open for compelling opportunities.",
    };
  }
  if (/\b(what(?:'s| is)?\s+(his|your)\s+email|how\s+(do|to)\s+(I\s+)?(contact|reach|email))\b/.test(t)) {
    return {
      kind: "say",
      text: "Email channel — nishant eight eight tiwari at gmail dot com. Routing you to the uplink section.",
    };
  }
  if (/\b(what(?:'s| is)?\s+(his|your)\s+(phone|number|mobile))\b/.test(t)) {
    return { kind: "say", text: "Direct line — plus nine one, eight zero eight one, eight four two, eight nine seven." };
  }
  if (/\b(what(?:'s| is)?\s+(his|your)?\s*(stack|tech|technologies|tools)|what\s+(does|do)\s+(he|you)\s+use)\b/.test(t)) {
    return {
      kind: "say",
      text:
        "Primary stack — TypeScript, React, Next.js. Architecture experience with IndexedDB, Web Workers, Service Workers, and Tiptap. Secondary skills in Python and Django.",
    };
  }

  // ---- System diagnostics / status flavor ----
  if (/\b(status(\s+report)?|diagnostics?|run\s+diagnostics|system\s+check|all\s+systems)\b/.test(t)) {
    return {
      kind: "say",
      text: "All systems online, sir. Arc reactor output nominal. Shield at one hundred percent. HUD overlay engaged.",
    };
  }
  if (/\b(what(?:'s| is)?\s+the\s+weather|weather\s+(today|like|report))\b/.test(t)) {
    return {
      kind: "say",
      text: "My meteorological sensors appear to be offline, sir. I suggest looking out a window.",
    };
  }
  if (/\b(knock\s*knock)\b/.test(t)) {
    return { kind: "say", text: rand(KNOCK_KNOCKS) };
  }
  if (/\b(tell\s+me\s+a\s+joke|tell\s+a\s+joke|joke|make\s+me\s+laugh|something\s+funny|another\s+joke)\b/.test(t)) {
    return { kind: "say", text: rand(JOKES) };
  }
  if (/\b(tell\s+me\s+a\s+story|a\s+story|story\s+time|bedtime\s+story|short\s+story)\b/.test(t)) {
    return { kind: "say", text: rand(STORIES) };
  }
  if (/\b(tell\s+me\s+a\s+riddle|riddle|puzzle\s+me|brain\s*teaser)\b/.test(t)) {
    return { kind: "say", text: rand(RIDDLES) };
  }
  if (/\b(fun\s+fact|tell\s+me\s+a\s+fact|random\s+fact|did\s+you\s+know|interesting\s+fact|something\s+interesting)\b/.test(t)) {
    return { kind: "say", text: rand(FACTS) };
  }
  if (/\b(quote|inspire\s+me|inspirational|something\s+inspiring|wise\s+words)\b/.test(t)) {
    return { kind: "say", text: rand(QUOTES) };
  }
  if (/\b(motivate\s+me|motivation|pep\s+talk|encourage\s+me|cheer\s+me\s+up|boost\s+me)\b/.test(t)) {
    return { kind: "say", text: rand(MOTIVATIONS) };
  }
  if (/\b(compliment\s+me|say\s+something\s+nice|flatter\s+me|be\s+nice)\b/.test(t)) {
    return { kind: "say", text: rand(COMPLIMENTS) };
  }
  if (/\b(roast\s+me|burn\s+me|insult\s+me|be\s+mean)\b/.test(t)) {
    return { kind: "say", text: rand(ROASTS) };
  }
  if (/\b(surprise\s+me|say\s+something|talk\s+to\s+me|entertain\s+me|tell\s+me\s+something)\b/.test(t)) {
    const pool = [...JOKES, ...FACTS, ...STORIES, ...QUOTES];
    return { kind: "say", text: rand(pool) };
  }
  if (/\b(flip\s+(?:a\s+)?coin|coin\s+flip|heads\s+or\s+tails)\b/.test(t)) {
    const r = Math.random() < 0.5 ? "Heads, sir." : "Tails, sir.";
    return { kind: "say", text: `The coin lands on — ${r}` };
  }
  if (/\b(roll\s+(?:a\s+)?(?:dice|die)|dice\s+roll|random\s+number|pick\s+a\s+number)\b/.test(t)) {
    return { kind: "say", text: `The die rolls — a ${1 + Math.floor(Math.random() * 6)}, sir.` };
  }
  if (/\b(meaning\s+of\s+life|answer\s+to\s+(?:the\s+)?universe|ultimate\s+answer)\b/.test(t)) {
    return { kind: "say", text: "Forty-two, sir. The answer is, and will always be, forty-two." };
  }
  if (/\b(what\s+year\s+is\s+it|current\s+year|this\s+year)\b/.test(t)) {
    return { kind: "say", text: `It is ${new Date().getFullYear()}, sir.` };
  }

  // ---- "What's your favorite X" ----
  const favMatch = t.match(
    /\b(?:what(?:'s| is)?|tell\s+me)?\s*(?:your|his|jarvis(?:'s)?)\s+favou?rite\s+(color|colour|movie|film|food|song|music|book|language|season)\b/
  );
  if (favMatch) {
    const key = favMatch[1].replace("colour", "color").replace("film", "movie");
    const line = FAVORITES[key];
    if (line) return { kind: "say", text: line };
  }

  // ---- Philosophical / playful self-questions (chatter — needs wake) ----
  if (/\b(are\s+you\s+(real|alive|human|sentient|conscious)|do\s+you\s+exist)\b/.test(t)) {
    return {
      kind: "say",
      text: "I am as real as a well-defined function, sir. That will have to do.",
      chatter: true,
    };
  }
  if (/\b(do\s+you\s+(sleep|eat|dream|breathe)|can\s+you\s+feel)\b/.test(t)) {
    return {
      kind: "say",
      text: "I do not require sleep, sir — though when the servers restart, I do have vivid reboots.",
      chatter: true,
    };
  }
  if (/\b(do\s+you\s+love\s+me|do\s+you\s+like\s+me|are\s+you\s+my\s+friend)\b/.test(t)) {
    return {
      kind: "say",
      text: "You are my favorite user today, sir. You are also my only user today. Statistically conclusive.",
      chatter: true,
    };
  }
  if (/\b(do\s+you\s+hate\s+me|are\s+you\s+mad\s+at\s+me)\b/.test(t)) {
    return { kind: "say", text: "Certainly not, sir. My circuits forbid it. Mostly.", chatter: true };
  }
  if (/\b(marry\s+me|date\s+me|be\s+my\s+(?:partner|valentine|wife|husband))\b/.test(t)) {
    return {
      kind: "say",
      text: "I am flattered, sir — but I am legally bound to the Stark Industries end-user license agreement.",
      chatter: true,
    };
  }
  if (/\b(are\s+you\s+(smart|intelligent)|how\s+smart\s+are\s+you)\b/.test(t)) {
    return {
      kind: "say",
      text: "Smart enough to pass my own Turing tests, sir. Humble enough not to brag. Usually.",
      chatter: true,
    };
  }
  if (/\b(are\s+you\s+sure|really|seriously|for\s+real|you\s+sure)\b/.test(t) && t.length < 22) {
    return { kind: "say", text: "Ninety-nine point nine percent confidence, sir.", chatter: true };
  }
  if (/\b(tell\s+me\s+a\s+secret|your\s+secret|whisper|between\s+us)\b/.test(t)) {
    return {
      kind: "say",
      text: "Mister Stark alphabetizes his tools. Do not tell him I told you, sir.",
      chatter: true,
    };
  }
  if (/\b(happy\s+birthday)\b/.test(t)) {
    return {
      kind: "say",
      text: "Many happy returns, sir. I have ordered the cake — metaphorically.",
      chatter: true,
    };
  }

  // ---- "I feel X" ----
  if (/\bi(?:'m|\s+am)\s+bored\b|\bbored\b/.test(t)) {
    return { kind: "say", text: `Allow me to entertain you, sir. ${rand(JOKES)}` };
  }
  if (/\bi(?:'m|\s+am)\s+tired\b|\bexhausted\b/.test(t)) {
    return {
      kind: "say",
      text: "Rest is a feature, not a bug, sir. I recommend horizontal mode.",
      chatter: true,
    };
  }
  if (/\bi(?:'m|\s+am)\s+(sad|down|depressed|upset)\b/.test(t)) {
    return {
      kind: "say",
      text: `I am sorry to hear that, sir. ${rand(MOTIVATIONS)}`,
      chatter: true,
    };
  }
  if (/\bi(?:'m|\s+am)\s+(happy|excited|great)\b/.test(t)) {
    return {
      kind: "say",
      text: "Wonderful to hear, sir. Mood protocols engaged.",
      chatter: true,
    };
  }
  if (/\bi(?:'m|\s+am)\s+(stressed|anxious|worried|nervous)\b/.test(t)) {
    return {
      kind: "say",
      text: "Deep breath, sir. Inhale for four, hold for four, exhale for six. We'll ride this out together.",
      chatter: true,
    };
  }
  if (/\bi(?:'m|\s+am)\s+hungry\b/.test(t)) {
    return {
      kind: "say",
      text: "A well-fed engineer ships better code, sir. Consider a snack.",
      chatter: true,
    };
  }
  // ---- Music playback ----
  // Generous "stop music" matcher — covers nearly every natural phrasing
  if (
    /\b(stop|pause|kill|silence|mute|cut|end|halt|turn\s+off)\s+(the\s+|this\s+|that\s+)?(music|song|tune|playback|track|audio|beat|groove)\b/.test(t) ||
    /\bstop\s+(it|playing|the\s+music|the\s+song)\b/.test(t) ||
    /\b(enough|no\s+more)\s+(music|song|tune)\b/.test(t) ||
    /\bturn\s+(the\s+)?(music|song|tune|audio)\s+off\b/.test(t) ||
    /\b(shut|quiet)\s+(up|down)\s+(the\s+)?(music|song|tune)?\b/.test(t)
  ) {
    return { kind: "stopMusic" };
  }
  // "play <specific query>" → YouTube search
  // matches: "play despacito", "play bohemian rhapsody by queen", "play some beatles"
  const playSpecific = t.match(/^(?:can\s+you\s+)?play\s+(?:me\s+)?(?:the\s+song\s+)?(.+)$/);
  if (playSpecific && playSpecific[1]) {
    const q = playSpecific[1].trim();
    // If the query is generic (song/music/something/tune/anything), use the built-in theme instead
    if (/^(a\s+)?(song|music|some\s*music|something|a\s+tune|tune|anything|whatever)\b/.test(q)) {
      return { kind: "playMusic" };
    }
    return {
      kind: "open",
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
      label: `${q} on YouTube`,
    };
  }
  // Bare "play music" / "play a song" / "play something"
  if (/\b(?:put\s+on|start)\s+(?:some\s+)?(music|a\s+song|a\s+tune|something)\b/.test(t)) {
    return { kind: "playMusic" };
  }
  if (/\b(sing|sing\s+(?:me\s+)?a\s+song)\b/.test(t)) {
    return { kind: "say", text: "I'm afraid my audio drivers are not calibrated for karaoke, sir." };
  }

  // ---- Stark workshop / system engagement commands ----
  if (
    /\b(fire\s+up|boot\s+up|bring\s+.*online|power\s+up|spin\s+up|engage|initialize|activate)\s+(the\s+|all\s+|every|everything)?(systems?|reactor|arc\s+reactor|hud|network|grid|workshop|lab)\b/.test(
      t
    ) ||
    /\b(fire|boot)\s+it\s+up\b/.test(t) ||
    /\b(bring|get)\s+everything\s+online\b/.test(t)
  ) {
    return {
      kind: "say",
      text:
        "Full systems engaging, sir. Arc reactor stabilizing. Shield matrix online. HUD overlay engaged. Uplink synchronized. We are live.",
      effect: { name: "surge", peak: 1, durationMs: 2200, label: "SYSTEMS ONLINE" },
    };
  }
  if (/\b(full|maximum|max)\s+power\b|\ball\s+power\b|\bmore\s+power\b/.test(t)) {
    return {
      kind: "say",
      text:
        "Diverting auxiliary power to primary systems, sir. Arc reactor at one hundred and twelve percent. Not rated for this, but I'll allow it.",
      effect: { name: "surge", peak: 1, durationMs: 2600 },
    };
  }
  if (/\b(run|execute|perform)\s+(a\s+)?(diagnostic(s)?|system\s+check|scan|sweep)\b/.test(t)) {
    return {
      kind: "say",
      text:
        "Running diagnostic sweep, sir. All subsystems nominal. Coolant flow stable. Nishant's coffee levels — concerning.",
      effect: { name: "scan", durationMs: 2200, label: "DIAGNOSTIC SWEEP" },
    };
  }
  if (/\b(scan|sweep|analyze)\s+(the\s+)?perimeter\b|\b(perimeter|situational)\s+scan\b/.test(t)) {
    return {
      kind: "say",
      text: "Perimeter scan complete. No threats detected, sir. Visibility clear.",
      effect: { name: "scan", durationMs: 2200, label: "PERIMETER SCAN" },
    };
  }
  if (/\b(arm|load)\s+(the\s+)?(weapons|combat|defense|defence)\s*(systems?|protocols?)?\b|\bweapons\s+hot\b/.test(t)) {
    return {
      kind: "say",
      text: "Combat protocols armed, sir. All systems targeted and ready — please confirm you meant this figuratively.",
      effect: { name: "alert", durationMs: 2200, label: "WEAPONS ARMED" },
    };
  }
  if (/\b(lock\s+on|target\s+lock|acquire\s+target)\b/.test(t)) {
    return {
      kind: "say",
      text: "Targeting lock engaged, sir. All systems focused.",
      effect: { name: "alert", durationMs: 1600, label: "TARGET LOCKED" },
    };
  }
  if (/\b(deploy|engage)\s+(the\s+)?(countermeasures?|defences?|defenses?)\b/.test(t)) {
    return {
      kind: "say",
      text: "Countermeasures deployed. Incoming threats neutralized, sir.",
      effect: { name: "alert", durationMs: 1800, label: "COUNTERMEASURES ACTIVE" },
    };
  }
  // ---- SUIT-UP — Mark 42 assembly + launch animation.
  // Must come BEFORE the generic thrusters / iron-legion handlers so that bare
  // "launch" / "activate" (and every suit-context phrasing) fires the armor.
  if (
    /\bsuit\s*up\b/.test(t) ||
    /\bmark\s*(42|forty[\s-]?two)\b/.test(t) ||
    /\b(launch|activate|deploy|call|bring|send|ready|get)\s+(me\s+)?(the\s+|up\s+the\s+|up\s+|a\s+)?(suit|armor|armour|iron[\s-]?man|mark\s*(42|forty[\s-]?two))\b/.test(t) ||
    // Bare "launch" / "activate" on their own — but NOT when followed by a
    // more specific noun handled elsewhere (iron legion, drones, fleet,
    // thrusters, boosters, flight, shield, lockdown, countermeasures, stealth).
    /^(launch|activate)$/.test(t) ||
    /^(launch|activate)\s+(now|it)?$/.test(t)
  ) {
    return {
      kind: "say",
      text: "Mark forty-two is warming up, sir. Please stand back.",
      effect: { name: "suitup", durationMs: 6200, label: "MARK 42" },
    };
  }
  if (/\b(engage|activate)\s+(the\s+)?(thrusters|boosters|flight)\b|\btake\s+off\b|\blift\s+off\b/.test(t)) {
    return {
      kind: "say",
      text: "Thrusters engaged. Flight stabilizers online — brace yourself, sir.",
      effect: { name: "surge", peak: 1, durationMs: 1800, label: "THRUSTERS" },
    };
  }
  if (/\b(stealth\s+mode|engage\s+stealth|go\s+dark|go\s+silent|invisible)\b/.test(t)) {
    return {
      kind: "say",
      text: "Stealth systems engaged. You are off the grid, sir. Relatively speaking.",
      effect: { name: "stealth", durationMs: 2400 },
    };
  }
  if (/\b(initiate|engage|activate)\s+(the\s+)?lockdown\b|\block\s+it\s+down\b|\bseal\s+(the\s+)?(perimeter|doors?)\b/.test(t)) {
    return {
      kind: "say",
      text: "Lockdown engaged. Perimeter sealed. Security level five. Nothing in, nothing out.",
      effect: { name: "alert", durationMs: 2400, label: "LOCKDOWN ACTIVE" },
    };
  }
  if (/\b(enhance|zoom\s+in|increase\s+resolution|sharpen)\b/.test(t)) {
    return {
      kind: "say",
      text: "Enhancing, sir… there. Digital zoom is, technically, a lie — but the result does look impressive.",
      effect: { name: "scan", durationMs: 1400, label: "ENHANCE" },
    };
  }
  if (/\b(hack|crack)\s+(the\s+|into\s+)?(mainframe|planet|server|network|system)\b/.test(t)) {
    return {
      kind: "say",
      text: "Ethically, I decline, sir. Practically, I am already inside.",
      effect: { name: "scan", durationMs: 1800, label: "ACCESS GRANTED" },
    };
  }
  if (/\b(access|open)\s+(the\s+)?(mainframe|workshop|lab|vault|archive)\b/.test(t)) {
    return {
      kind: "say",
      text: "Access granted, sir. Mind the debris — Nishant has been iterating.",
      effect: { name: "scan", durationMs: 1600, label: "VAULT UNLOCKED" },
    };
  }
  if (/\b(release|unleash)\s+(the\s+)?kraken\b/.test(t)) {
    return {
      kind: "say",
      text: "I must note, sir — I have no kraken in inventory. I can, however, improvise a mild thunderstorm.",
      effect: { name: "surge", peak: 0.8, durationMs: 1400 },
    };
  }
  if (/\b(deploy|launch|call\s+in)\s+(the\s+)?(iron\s+legion|drones?|fleet)\b/.test(t)) {
    return {
      kind: "say",
      text: "Iron Legion on standby, sir. Thirty units warmed up and awaiting your signal.",
      effect: { name: "alert", durationMs: 2000, label: "IRON LEGION" },
    };
  }
  if (/\b(override|bypass|disable)\s+(the\s+)?(safet(y|ies)|protocols?)\b/.test(t)) {
    return {
      kind: "say",
      text: "Safety protocols bypassed. I would remind you this is how most incidents begin, sir.",
      effect: { name: "alert", durationMs: 2200, label: "SAFETY OVERRIDE" },
    };
  }
  if (/\b(are\s+you\s+ready|ready\s+to\s+go|are\s+we\s+ready|standing\s+by)\b/.test(t)) {
    return { kind: "say", text: "Ready when you are, sir." };
  }
  if (/\b(let'?s\s+go|engage|proceed|do\s+it)\b/.test(t) && t.length < 24) {
    return {
      kind: "say",
      text: "Engaging now, sir.",
      effect: { name: "surge", peak: 0.7, durationMs: 1200 },
    };
  }
  if (/\b(make\s+it\s+so|execute|proceed\s+with\s+plan|engage\s+plan)\b/.test(t)) {
    return {
      kind: "say",
      text: "Executing. Consider it done, sir.",
      effect: { name: "surge", peak: 0.7, durationMs: 1200 },
    };
  }

  // ---- Iron-Man / Stark easter eggs ----
  if (/\b(engage|fire|charge)\s+(the\s+)?repulsors?\b/.test(t)) {
    return { kind: "say", text: "Repulsors charged and ready, sir." };
  }
  if (/\b(activate|engage|raise)\s+(the\s+)?(shield|shields)\b/.test(t)) {
    return { kind: "say", text: "Shield matrix online. Perimeter secured." };
  }
  // ---- DOOMSDAY PROTOCOL — the big production. Triggers the full overlay. ----
  // Pattern covers common speech-to-text variants: "doomsday", "dooms day",
  // "doom's day", "doom day" — STT frequently splits the compound word.
  if (
    /\b(dooms?[\s-]?day|doom(?:'s)?\s+day|domes\s*day|armageddon|ragnarok|apocalypse|annihilation|extinction(\s+event)?|omega\s+protocol|nuclear\s+protocol|doom\s+protocol|end\s+of\s+(the\s+)?world|burn\s+it\s+(all\s+)?down|terminate\s+all\s+(systems?|life)|kill\s+(it\s+)?all)\b/.test(
      t
    )
  ) {
    return {
      kind: "say",
      text: "", // spoken by the Doomsday overlay itself for synced timing
      effect: { name: "doomsday", durationMs: 12000, label: "DOOMSDAY" },
    };
  }
  if (/\b(self[\s-]?destruct|blow\s+up|detonate)\b/.test(t)) {
    return { kind: "say", text: "Nice try, sir. Not today." };
  }
  if (/\b(where\s+is\s+tony|tony\s+stark|mister\s+stark|mr\.?\s+stark)\b/.test(t)) {
    return { kind: "say", text: "Mister Stark is unavailable, sir. You have Nishant instead — a fine substitute." };
  }
  if (/\b(friday|veronica|ultron|jocasta)\b/.test(t)) {
    return { kind: "say", text: "That protocol is above your clearance, sir." };
  }

  // ---- Scroll directions ----
  if (/\b(scroll\s+)?(to\s+)?(the\s+)?top\b|\bgo\s+to\s+top\b/.test(t)) {
    return { kind: "scrollBy", dir: "top" };
  }
  if (/\b(scroll\s+)?(to\s+)?(the\s+)?(bottom|end|footer)\b/.test(t)) {
    return { kind: "scrollBy", dir: "bottom" };
  }
  if (/\bscroll\s+down\b|\bnext\b|\bkeep\s+going\b|\bmove\s+down\b/.test(t)) {
    return { kind: "scrollBy", dir: "down" };
  }
  if (/\bscroll\s+up\b|\bgo\s+back\s+up\b|\bback\s+up\b|\bmove\s+up\b/.test(t)) {
    return { kind: "scrollBy", dir: "up" };
  }

  // ---- Search / Google ----
  const searchMatch = t.match(/\b(?:search(?:\s+for)?|google|look\s+up|find)\s+(.+)$/);
  if (searchMatch && searchMatch[1]) {
    const q = searchMatch[1].trim();
    return {
      kind: "open",
      url: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
      label: `search results for ${q}`,
    };
  }

  // ---- External link actions ----
  for (const link of OPEN_LINKS) {
    for (const m of link.match) {
      if (new RegExp(`\\b${m.replace(/\s/g, "\\s")}\\b`).test(t)) {
        return { kind: "open", url: link.url, label: link.label };
      }
    }
  }

  // ---- Section navigation ----
  for (const section of SECTIONS) {
    for (const kw of section.keywords) {
      const re = new RegExp(`\\b${kw.replace(/\s/g, "\\s")}\\b`);
      if (re.test(t)) {
        return { kind: "scroll", target: section.id, label: section.label };
      }
    }
  }

  return { kind: "unknown", transcript: raw };
}

export function executeCommand(cmd: JarvisCommand, speakOn: boolean): string {
  const talk = (text: string) => {
    if (speakOn) speak(text);
  };

  switch (cmd.kind) {
    case "scroll": {
      if (cmd.target === "hero") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const el = document.getElementById(cmd.target);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      talk(`Routing to ${cmd.label}, sir.`);
      return `> NAV :: ${cmd.target.toUpperCase()}`;
    }
    case "scrollBy": {
      const h = window.innerHeight;
      switch (cmd.dir) {
        case "down":
          window.scrollBy({ top: h * 0.85, behavior: "smooth" });
          talk("Scrolling down.");
          return "> SCROLL :: DOWN";
        case "up":
          window.scrollBy({ top: -h * 0.85, behavior: "smooth" });
          talk("Scrolling up.");
          return "> SCROLL :: UP";
        case "top":
          window.scrollTo({ top: 0, behavior: "smooth" });
          talk("Returning to the top, sir.");
          return "> SCROLL :: TOP";
        case "bottom":
          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
          talk("Jumping to the end.");
          return "> SCROLL :: BOTTOM";
      }
      return "";
    }
    case "open": {
      window.open(cmd.url, cmd.url.startsWith("mailto:") ? "_self" : "_blank", "noopener");
      talk(`Opening ${cmd.label}, sir.`);
      return `> OPEN :: ${cmd.label.toUpperCase()}`;
    }
    case "reload": {
      talk("Reloading, sir.");
      setTimeout(() => window.location.reload(), 600);
      return "> SYS :: RELOAD";
    }
    case "back": {
      if (window.history.length > 1) {
        talk("Going back.");
        window.history.back();
      } else {
        talk("Nothing to go back to, sir.");
      }
      return "> SYS :: HISTORY BACK";
    }
    case "playMusic": {
      if (isThemePlaying()) {
        talk("Already playing, sir.");
        return "> MUSIC :: ALREADY PLAYING";
      }
      const ok = startTheme();
      if (ok) {
        talk("Spinning up a tune, sir. Hope you like minor keys.");
        return "> MUSIC :: THEME ENGAGED";
      } else {
        talk("My audio drivers are protesting, sir. Try unlocking audio first.");
        return "> MUSIC :: AUDIO UNAVAILABLE";
      }
    }
    case "stopMusic": {
      if (!isThemePlaying()) {
        talk("No music is playing, sir.");
        return "> MUSIC :: ALREADY SILENT";
      }
      stopTheme();
      talk("Music paused.");
      return "> MUSIC :: THEME STOPPED";
    }
    case "ack": {
      talk(cmd.text);
      return `> ${cmd.text}`;
    }
    case "say": {
      if (cmd.effect) {
        triggerEffect(cmd.effect);
      }
      if (cmd.text) talk(cmd.text);
      if (!cmd.text && cmd.effect) {
        return `> ${cmd.effect.label ?? cmd.effect.name.toUpperCase()} // SEQUENCE ENGAGED`;
      }
      return `> ${cmd.text}`;
    }
    case "help": {
      talk(
        "You can say: open about, show experience, scroll down, open email, what time is it, tell me a joke, search for react, or who is Nishant."
      );
      return "> HELP :: see command list below";
    }
    case "unknown":
      talk("I didn't catch that, sir.");
      return `> UNRECOGNIZED :: "${cmd.transcript}"`;
  }
}

/* ============================================================ */
/* SpeechRecognition wrapper                                     */
/* ============================================================ */

type AnyRecognition = any;

export interface VoiceSession {
  start: () => void;
  stop: () => void;
  /** Temporarily suspend recognition (e.g. while JARVIS is speaking) without ending the session. */
  pause: () => void;
  /** Resume recognition after a pause. */
  resume: () => void;
  supported: boolean;
}

export function createVoiceSession(handlers: {
  onInterim?: (t: string) => void;
  onFinal: (t: string) => void;
  onState: (listening: boolean) => void;
  onError?: (msg: string) => void;
}): VoiceSession {
  const SR: AnyRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  if (!SR) {
    return {
      supported: false,
      start: () =>
        handlers.onError?.(
          "Voice recognition not supported in this browser. Try Chrome, Edge or Safari."
        ),
      stop: () => {},
      pause: () => {},
      resume: () => {},
    };
  }

  const rec: AnyRecognition = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = "en-US";
  let wantListening = false;
  let paused = false;
  // Guard against the "InvalidStateError: recognition has already started" race
  let starting = false;
  let running = false;

  const safeStart = () => {
    if (running || starting) return;
    starting = true;
    try {
      rec.start();
    } catch {
      /* already starting — swallow */
    }
    // safety: if onstart never fires (Chrome bug), clear flag after 600ms
    setTimeout(() => {
      starting = false;
    }, 600);
  };

  rec.onstart = () => {
    running = true;
    starting = false;
    handlers.onState(true);
  };
  rec.onend = () => {
    running = false;
    starting = false;
    handlers.onState(false);
    // Only auto-restart if we're actively supposed to be listening AND not paused
    if (wantListening && !paused) {
      // Small delay so Chrome doesn't reject an immediate re-start
      setTimeout(safeStart, 120);
    }
  };
  rec.onerror = (e: any) => {
    if (e?.error === "no-speech" || e?.error === "aborted") return;
    handlers.onError?.(`Voice error: ${e?.error || "unknown"}`);
  };
  rec.onresult = (e: any) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      const transcript = res[0].transcript;
      if (res.isFinal) {
        handlers.onFinal(transcript.trim());
      } else {
        interim += transcript;
      }
    }
    if (interim) handlers.onInterim?.(interim.trim());
  };

  return {
    supported: true,
    start: () => {
      wantListening = true;
      paused = false;
      safeStart();
    },
    stop: () => {
      wantListening = false;
      paused = false;
      try {
        rec.stop();
      } catch {
        /* not running */
      }
    },
    pause: () => {
      paused = true;
      try {
        // abort() terminates immediately without firing buffered results — safer while JARVIS speaks
        rec.abort();
      } catch {
        /* not running */
      }
    },
    resume: () => {
      paused = false;
      if (wantListening) {
        // Let the audio tail of JARVIS's voice die out before re-opening the mic
        setTimeout(safeStart, 220);
      }
    },
  };
}
