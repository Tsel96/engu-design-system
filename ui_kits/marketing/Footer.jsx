// Footer.jsx — multi-column footer on ink green
function Footer() {
  const groups = [
    { title: 'Product', items: ['Play', 'For parents', 'For teachers', 'Schools', 'Pricing'] },
    { title: 'Bohemia Interactive', items: ['About', 'Newsroom', 'Studios', 'Careers'] },
    { title: 'Resources', items: ['Brand guidelines', 'Help center', 'Status', 'Contact'] },
    { title: 'Legal', items: ['Privacy', 'Terms', 'Cookies', 'COPPA'] },
  ];
  return (
    <footer style={{ background: 'var(--engu-green-ink)', color: '#fff', padding: '80px 32px 40px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr',
          gap: 48,
          paddingBottom: 64,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <img src="./assets/engu-horizontal-white.svg" alt="engu" style={{ height: 36, display: 'block' }} />
            <p style={{ margin: 0, font: '400 14px/1.45 var(--font-body)', color: 'rgba(255,255,255,0.7)', maxWidth: 280 }}>
              A safe, richly interactive virtual world that nurtures curiosity and rewards exploration. Built by Bohemia Interactive in Prague.
            </p>
            <div style={{ font: '500 11px/1 var(--font-body)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              Available in English · Čeština
            </div>
          </div>
          {groups.map((g, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ font: '500 11px/1 var(--font-body)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                {g.title}
              </div>
              {g.items.map(it => (
                <a key={it} href="#" style={{
                  font: '500 14px/1.4 var(--font-body)',
                  color: 'rgba(255,255,255,0.84)',
                  textDecoration: 'none',
                }}>{it}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 28,
          font: '400 13px/1 var(--font-body)',
          color: 'rgba(255,255,255,0.5)',
        }}>
          <div>© 2026 Bohemia Interactive a.s.</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Made in Prague</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
window.Footer = Footer;
