export const profile = {
  name: "Nishant Kumar Tiwari",
  handle: "NKT-STARK-01",
  title: "Software Development Engineer — Frontend",
  location: "Delhi, India",
  phone: "+91-8081842897",
  email: "nishant88tiwari@gmail.com",
  linkedin: "https://linkedin.com/in/nishant-kumar-tiwari-253a46196",
  portfolio: "https://nishant-kumarr-tiwari.netlify.app/",
  summary:
    "Frontend engineer building high-performance, real-time interfaces. Specializing in editor extensions, offline-first architectures, and complex state systems. Currently deployed at Adalat.ai reinforcing the legal-tech frontline.",
};

export const experience = [
  {
    id: "EXP-04",
    company: "Adalat.ai",
    role: "Software Development Engineer (Frontend)",
    location: "Remote",
    duration: "Aug 2025 — Present",
    status: "ACTIVE",
    points: [
      "Building next-gen legal-tech interfaces on the frontline.",
      "Architecting real-time collaborative tooling for casework.",
    ],
    stack: ["React", "TypeScript", "Next.js"],
  },
  {
    id: "EXP-03",
    company: "Thena.ai",
    role: "Software Development Engineer (Frontend)",
    location: "Bangalore",
    duration: "Mar 2024 — Jul 2024",
    status: "COMPLETE",
    points: [
      "Developed custom extensions for the Tiptap editor.",
      "Built dynamic form workflows with complex payload engines.",
      "Designed macros for real-time communication and automation.",
      "Shipped Saved Views — filtered-state persistence layer.",
      "Integrated Paragon for Zendesk / HubSpot CRM connectors.",
      "Integrated Linear to automate ticketing pipelines.",
    ],
    stack: [
      "Tiptap",
      "IndexedDB",
      "Dexie.js",
      "Zustand",
      "Web Workers",
      "Service Workers",
      "shadcn/ui",
      "DOM Virtualization",
      "Tailwind CSS",
      "TypeScript",
    ],
  },
  {
    id: "EXP-02",
    company: "GDL Qualities System",
    role: "Frontend Engineer",
    location: "Remote",
    duration: "Mar 2023 — Mar 2024",
    status: "COMPLETE",
    points: [
      "Shipped frontend for multi-region deployments (IN, US).",
      "Delivered Cragocrew and Hastings Deerings platforms.",
      "Built dynamic sitemap.xml generation at scale.",
      "Architected i18n system across a single shared codebase.",
      "Optimized performance via SSR tuning.",
    ],
    stack: ["Next.js", "TypeScript", "Redux", "Zustand", "Material UI", "Jest"],
  },
  {
    id: "EXP-01",
    company: "Meeraq",
    role: "Software Development Engineer",
    location: "Bangalore",
    duration: "Jun 2022 — Mar 2023",
    status: "COMPLETE",
    points: [
      "Full-stack ownership of the core product.",
      "Built UI components and evolved product functionality.",
      "Authored backend services in Django.",
    ],
    stack: ["Next.js", "TypeScript", "Redux", "Zustand", "Material UI", "Jest", "Django"],
  },
] as const;

export const skills = {
  languages: ["JavaScript", "TypeScript", "Python"],
  frameworks: ["React", "Next.js", "Redux", "Zustand", "Express.js"],
  tools: ["Vite", "Webpack", "Jest"],
  architecture: [
    "IndexedDB",
    "Dexie.js",
    "Web Workers",
    "Service Workers",
    "Tiptap",
    "Tailwind CSS",
    "DOM Virtualization",
    "SSR",
    "shadcn/ui",
  ],
};

export const openSource = [
  {
    name: "Nested Fuzzy Search",
    description:
      "NPM package for deep fuzzy search across nested objects — arbitrary depth, zero dependencies.",
    meta: "300+ weekly downloads",
  },
];

export const blogs = [
  {
    title: "useEffect — A Whole New Mental Model",
    url: "https://nishant99tiwari.medium.com/useeffect-a-whole-new-mental-model-8f1d01d41d04",
    tag: "REACT",
  },
  {
    title: "Transpiler vs Compiler",
    url: "https://nishant99tiwari.medium.com/transpiler-vs-compiler-2c138de85d01",
    tag: "FUNDAMENTALS",
  },
  {
    title: "What and Why `if __name__ == '__main__'` in Python",
    url: "https://nishant99tiwari.medium.com/what-and-why-if-name-main-in-python-23bed7cac274",
    tag: "PYTHON",
  },
  {
    title: "CSS Flex Boxing Guide",
    url: "https://nishant99tiwari.medium.com/css-flex-boxing-guide-46f0a093e778",
    tag: "CSS",
  },
];

export const education = {
  degree: "B.Tech. — Computer Science and Engineering",
  institution: "Dr. Ram Manohar Lohia Avadh University",
  year: "2021",
};

export const extras = [
  "Mentored 10+ individuals in tech and career growth",
  "Conducted webinars and shared insights on LinkedIn",
  "Contributed to Topmate for interview prep and career guidance",
];
