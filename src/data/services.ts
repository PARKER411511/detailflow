export type Service = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  details: string;
  duration: string;
  price: number;
  accent: string;
  bestFor: string;
  inclusions: string[];
  stages: string[];
  outcome: string;
  care: string;
};

const presentation: Record<string, Omit<Service, "slug" | "name" | "eyebrow" | "description" | "details" | "duration" | "price" | "accent">> = {
  "the-refresh": {
    bestFor: "Cars needing a clean, measured reset between bigger details.",
    inclusions: ["Hand wash + wheel detail", "Paint decontamination", "Spray sealant handover"],
    stages: ["Condition walkaround", "Two-bucket exterior wash", "Decontamination and finish"],
    outcome: "A cleaner, brighter exterior with a clear next-care plan.",
    care: "Keep the finish clear with gentle washes and avoid automatic brushes between visits.",
  },
  "the-correction": {
    bestFor: "Daily drivers with visible wash marks or softened paint clarity.",
    inclusions: ["Everything in The Refresh", "Single-stage paint correction", "Panel-by-panel inspection"],
    stages: ["Paint inspection and test panel", "Measured single-stage correction", "Refinement and handover"],
    outcome: "A clearer surface with the condition and remaining marks explained plainly.",
    care: "We leave a simple wash routine so the corrected surface stays easier to maintain.",
  },
  "the-signature": {
    bestFor: "Owners planning a full interior and exterior reset with protection.",
    inclusions: ["Paint correction", "Interior deep clean + leather care", "Ceramic protection"],
    stages: ["Full condition review", "Interior and exterior preparation", "Protection application and handover"],
    outcome: "A considered reset across the cabin and paint, with protection for the next season of driving.",
    care: "Follow the studio care note and allow the protection to cure as advised at handover.",
  },
};

export const services: Service[] = [
  {
    slug: "the-refresh",
    name: "The Refresh",
    eyebrow: "A considered reset",
    description: "A precise exterior wash, decontamination, and finish for cars that need a little more care than a drive-through can offer.",
    details: "Hand wash · wheel detail · paint decontamination · spray sealant",
    duration: "2.5 hours",
    price: 145,
    accent: "#bfdbfe",
    ...presentation["the-refresh"],
  },
  {
    slug: "the-correction",
    name: "The Correction",
    eyebrow: "Clarity, restored",
    description: "A single-stage paint correction that softens the marks of daily driving and returns a clear, deep gloss.",
    details: "Everything in The Refresh · paint correction · panel-by-panel inspection",
    duration: "5 hours",
    price: 325,
    accent: "#93c5fd",
    ...presentation["the-correction"],
  },
  {
    slug: "the-signature",
    name: "The Signature",
    eyebrow: "Our full expression",
    description: "A full interior and exterior reset with ceramic protection, built for owners who want their car to feel new again.",
    details: "Paint correction · interior deep clean · leather conditioning · ceramic coating",
    duration: "6 hours",
    price: 875,
    accent: "#2563eb",
    ...presentation["the-signature"],
  },
];

export function serviceImage(slug: string) {
  return {
    "the-refresh": "/images/detailflow-paint-detail.png",
    "the-correction": "/images/detailflow-polishing.png",
    "the-signature": "/images/detailflow-interior.png",
  }[slug] ?? "/images/detailflow-hero.png";
}

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}

export function getServicePresentation(slug: string) {
  return presentation[slug];
}
