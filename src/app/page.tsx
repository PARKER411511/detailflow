import Image from "next/image";
import Link from "next/link";
import { BeforeAfter } from "@/components/before-after";
import { ServiceCard } from "@/components/service-card";
import { serviceImage } from "@/data/services";
import { getPublicServices } from "@/lib/public-services";

const homeImages = {
  hero: "/images/detailflow-cinematic-home-v1.png",
  craft: "/images/detailflow-ceramic-craft-v1.png",
  studio: "/images/detailflow-dark-studio-v1.png",
  final: "/images/detailflow-rear-finish-v1.png",
};

const faqs = [
  ["How far ahead can I book?", "Appointments are planned up to 60 days ahead in the studio’s local time."],
  ["What if I need to change plans?", "You can cancel or reschedule up to 24 hours before your appointment from your account."],
  ["Do you work on all makes?", "Yes. Tell us what you drive and what you have noticed; we will recommend the right scope."],
] as const;

const process = [
  ["Choose", "Pick a scope that fits the car, then choose a time."],
  ["Arrive", "We confirm the condition and plan together before work begins."],
  ["Collect", "We walk you through what changed and leave a simple care note."],
] as const;

const work = [
  ["Paint / reflection", "/images/detailflow-paint-reflection-v2.png", "Dry silver paint catching a clean studio reflection."],
  ["Cabin / material", "/images/detailflow-materials-v2.png", "A close look at the textures that make a cabin feel finished."],
  ["Wheel / finish", "/images/detailflow-wheel-v2.png", "Clean edges and quiet contrast around the wheel and panel."],
  ["Interior / handover", "/images/detailflow-interior.png", "A calm interior reset ready for the next drive."],
] as const;

const reviewExamples = [
  ["The scope was clear from the first walkaround, and the handover felt just as considered.", "Maya R."],
  ["The paint came back with a depth I had forgotten was there. The care note was genuinely useful.", "Jon P."],
  ["Quiet studio, careful work, no hard sell. Exactly the kind of place I want looking after my car.", "Ari K."],
] as const;

export default async function Home() {
  const services = await getPublicServices();

  return (
    <div className="home-shell">
      <section className="home-hero">
        <div className="home-hero-media">
          <Image
            src={homeImages.hero}
            alt="Graphite performance coupe in a dark studio with a narrow cobalt light strip"
            fill
            priority
            sizes="(max-width: 767px) 100vw, 100vw"
            className="home-hero-image"
          />
        </div>
        <div className="home-hero-vignette" />
        <div className="home-container home-hero-content">
          <div className="home-hero-copy">
            <p className="home-eyebrow"><span aria-hidden="true" />Independent automotive detailing / Brooklyn, NY</p>
            <div className="home-hero-row">
              <h1 className="home-hero-title"><span>Obsessed with</span><strong>perfection.</strong></h1>
              <div className="home-hero-support">
                <p className="home-hero-intro">Paint, ceramic, and interior care for cars that deserve more time under the light.</p>
                <div className="home-hero-actions">
                  <Link href="/booking" className="home-button home-button-blue">Book your detail <span aria-hidden="true">↗</span></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="home-container home-hero-note"><span>One car / one bay</span><span>Tue—Sat / 08—18</span></div>
      </section>

      <section className="home-promise" aria-label="DetailFlow studio focus">
        <div className="home-container home-promise-grid">
          <p className="home-eyebrow home-eyebrow-muted">What we focus on</p>
          <div className="home-promise-list">
            <div><strong>Paint correction</strong><span>Read the reflection.</span></div>
            <div><strong>Ceramic protection</strong><span>Keep the finish clear.</span></div>
            <div><strong>Interior detailing</strong><span>Reset the cabin.</span></div>
          </div>
        </div>
      </section>

      <section id="services" className="home-section home-services">
        <div className="home-container">
          <div className="home-section-heading home-section-heading-row">
            <div><p className="home-eyebrow home-eyebrow-blue">The menu</p><h2>Care built around the car.</h2></div>
            <Link href="/services" className="home-text-link">All services & pricing <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="home-services-grid">
            {services.length ? services.map((service) => <ServiceCard key={service.slug} service={service} variant="compact" image={serviceImage(service.slug)} />) : <p className="home-empty-state">The studio menu is unavailable in this preview.</p>}
          </div>
        </div>
      </section>

      <section className="home-craft">
        <div className="home-container home-craft-grid">
          <div className="home-craft-copy">
            <p className="home-eyebrow home-eyebrow-blue">The close look</p>
            <h2>Precision you can see.</h2>
            <p>We slow down for the surfaces that tell the story: paint under a point light, a ceramic layer leveled by hand, the texture of a leather seat.</p>
            <Link href="/about" className="home-text-link">How we work <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="home-craft-media">
            <Image src={homeImages.craft} alt="Close-up ceramic protection and polished paint catching a cobalt studio light" fill sizes="(max-width: 767px) 100vw, 58vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="home-compare">
        <div className="home-container">
          <div className="home-section-heading home-compare-heading">
            <div><p className="home-eyebrow home-eyebrow-blue">The surface</p><h2>See the care in the reflection.</h2></div>
            <p>Illustrative before / after concept imagery. It is not a customer result.</p>
          </div>
          <BeforeAfter wide showBadge={false} />
        </div>
      </section>

      <section className="home-work" aria-labelledby="selected-work-heading">
        <div className="home-container">
          <div className="home-section-heading home-section-heading-row">
            <div><p className="home-eyebrow home-eyebrow-blue">Selected details</p><h2 id="selected-work-heading">The finish, in close-up.</h2></div>
            <Link href="/gallery" className="home-text-link">View the gallery <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="home-work-track" tabIndex={0} aria-label="Selected detail photography">
            {work.map(([label, src, alt]) => <figure key={src} className="home-work-card"><div><Image src={src} alt={alt} fill sizes="(max-width: 767px) 78vw, 28vw" className="object-cover" /></div><figcaption>{label}</figcaption></figure>)}
          </div>
        </div>
      </section>

      <section id="studio" className="home-studio">
        <div className="home-container home-studio-grid">
          <div className="home-studio-media"><Image src={homeImages.studio} alt="Dark one-bay detailing studio with a graphite coupe under soft light" fill sizes="(max-width: 767px) 100vw, 52vw" className="object-cover" /></div>
          <div className="home-studio-copy"><p className="home-eyebrow home-eyebrow-blue">Visit the studio</p><h2>A quieter place to care for a car.</h2><p>One bay, good light, and enough time to explain what the surface is asking for.</p><div className="home-studio-details"><p><strong>19 Mercer Lane</strong><br />Brooklyn, NY 11222</p><p><strong>Tue—Sat</strong><br />08:00—18:00</p></div><p className="home-fine-print">Fictional studio location for this portfolio concept.</p><Link href="/contact" className="home-text-link">Contact the studio <span aria-hidden="true">↗</span></Link></div>
        </div>
      </section>

      <section className="home-info">
        <div className="home-container home-info-grid">
          <div className="home-process"><p className="home-eyebrow home-eyebrow-blue">The visit</p><h2>Simple from here.</h2><ol>{process.map(([title, copy], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol></div>
          <div className="home-faq"><p className="home-eyebrow home-eyebrow-blue">Good to know</p><h2>Before you arrive.</h2><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div>
        </div>
      </section>

      <section className="home-reviews" aria-labelledby="review-heading">
        <div className="home-container"><p className="home-eyebrow home-eyebrow-blue">Fictional review examples</p><h2 id="review-heading">A considered handover.</h2><div className="home-review-grid">{reviewExamples.map(([quote, author]) => <blockquote key={author}><p>“{quote}”</p><cite>{author} / illustrative example</cite></blockquote>)}</div></div>
      </section>

      <section className="home-final-cta">
        <Image src={homeImages.final} alt="Graphite coupe rear quarter and wheel under cobalt studio light" fill sizes="100vw" className="object-cover" />
        <div className="home-final-cta-shade" />
        <div className="home-container home-final-cta-content"><p className="home-eyebrow">Book your detail</p><h2>Your car deserves<br />a better finish.</h2><Link href="/booking" className="home-button home-button-blue">Find an appointment <span aria-hidden="true">↗</span></Link></div>
      </section>
    </div>
  );
}
