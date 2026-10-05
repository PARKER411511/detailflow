import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-shell">
        <div className="site-footer-identity">
          <div className="site-footer-lockup">
            <svg aria-hidden="true" viewBox="0 0 38 38" fill="none"><path d="M4 7h18l12 12-12 12H4l11-12L4 7Z" stroke="currentColor" strokeWidth="2" /><path d="M4 19h18M19 7v24" stroke="#315bff" strokeWidth="2" /></svg>
            <span>DETAILFLOW</span>
          </div>
          <p className="site-footer-index">DF / 026 <span aria-hidden="true">—</span> AUTOMOTIVE STUDIO</p>
          <p className="site-footer-note">Precision care for paint, cabin, and everything in between.</p>
        </div>
        <div className="site-footer-groups">
          <div className="site-footer-group"><p>Explore</p><nav aria-label="Explore footer links"><Link href="/services">Services</Link><Link href="/gallery">Work</Link><Link href="/about">Studio</Link><Link href="/contact">Contact</Link></nav></div>
          <div className="site-footer-group"><p>Account</p><nav aria-label="Account footer links"><Link href="/booking">Book a detail</Link><Link href="/login?next=/">Sign in</Link><Link href="/account">Your appointments</Link></nav></div>
          <div className="site-footer-group site-footer-studio"><p>Studio desk</p><address>19 Mercer Lane<br />Brooklyn, NY 11222<br />Tue—Sat · 08:00—18:00</address><a href="mailto:hello@detailflow.demo">hello@detailflow.demo</a></div>
        </div>
      </div>
      <div className="site-footer-bottom"><span>© 2026 DetailFlow Studio</span><span>Concept project — imagery and reviews are illustrative.</span><span className="site-footer-mark" aria-hidden="true">— / DF</span></div>
    </footer>
  );
}
