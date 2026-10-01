export type Service = { slug: string; name: string; eyebrow: string; description: string; details: string; duration: string; price: number; accent: string };
export const services: Service[] = [
  { slug: "the-refresh", name: "The Refresh", eyebrow: "A considered reset", description: "A precise exterior wash, decontamination, and finish for cars that need a little more care than a drive-through can offer.", details: "Hand wash · wheel detail · paint decontamination · spray sealant", duration: "2.5 hours", price: 145, accent: "#bfdbfe" },
  { slug: "the-correction", name: "The Correction", eyebrow: "Clarity, restored", description: "A single-stage paint correction that softens the marks of daily driving and returns a clear, deep gloss.", details: "Everything in The Refresh · paint correction · panel-by-panel inspection", duration: "5 hours", price: 325, accent: "#93c5fd" },
  { slug: "the-signature", name: "The Signature", eyebrow: "Our full expression", description: "A full interior and exterior reset with ceramic protection, built for owners who want their car to feel new again.", details: "Paint correction · interior deep clean · leather conditioning · ceramic coating", duration: "6 hours", price: 875, accent: "#2563eb" },
];
export function getService(slug: string) { return services.find((service) => service.slug === slug); }
