import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="functional-page contact-page">
      <section className="functional-intro"><div className="functional-container functional-intro-grid"><div><p className="functional-eyebrow">Contact / studio desk</p><h1>Let’s talk through the car.</h1></div><p>Tell us what you’re driving, what you’ve noticed, and what you’re hoping for. We’ll point you in the right direction.</p></div></section>
      <section className="functional-section"><div className="functional-container contact-grid"><div className="contact-image"><Image src="/images/detailflow-inspection-v1.png" alt="Silver headlight and fender under a cobalt inspection light" fill sizes="(max-width: 900px) 100vw, 40vw" className="object-cover" /></div><div className="contact-copy"><div className="contact-details"><div><span>Studio</span><p>19 Mercer Lane<br />Brooklyn, NY 11222</p></div><div><span>Hours</span><p>Tuesday—Saturday<br />8:00 am—6:00 pm</p></div><div><span>Email</span><a href="mailto:hello@detailflow.demo">hello@detailflow.demo</a></div></div><form className="contact-form" action="mailto:hello@detailflow.demo" method="post" encType="text/plain"><p className="form-helper">Share a little context and your email client will open a prepared message. Nothing is sent automatically from this preview.</p><div className="form-grid-two"><label>Name<input name="name" required placeholder="Your name" className="field" /></label><label>Email<input name="email" type="email" required placeholder="you@example.com" className="field" /></label></div><label>What can we help with?<textarea name="message" rows={5} required placeholder="Tell us what you’re seeing…" className="field" /></label><div className="form-submit-row"><button type="submit" className="action-primary">Prepare email <span aria-hidden="true">↗</span></button><span>Demo only · your email client handles the message.</span></div></form></div></div></section>
    </div>
  );
}
