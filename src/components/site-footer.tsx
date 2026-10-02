import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="site-footer-brand"><p>DETAILFLOW</p><span>Independent automotive detailing / Brooklyn, NY</span></div>
        <nav className="site-footer-links" aria-label="Footer navigation">
          <Link href="/services">Services</Link>
          <Link href="/gallery">Work</Link>
          <Link href="/about">Studio</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="site-footer-visit"><p>19 Mercer Lane<br />Brooklyn, NY 11222<br />Tue—Sat · 08:00—18:00</p><Link href="/booking">Book your detail <span aria-hidden="true">↗</span></Link></div>
      </div>
      <div className="site-footer-bottom"><span>© 2026 DetailFlow Studio</span><span>Concept project — created for portfolio purposes. Imagery and reviews are illustrative.</span></div>
    </footer>
  );
}
