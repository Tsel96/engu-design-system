// Testimonial.jsx — parent quote
function Testimonial() {
  return (
    <section style={{ padding: '96px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'flex-start' }}>
        <div style={{ font: '500 12px/1 var(--font-body)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--engu-green-text)' }}>
          From a parent in Brno
        </div>
        <blockquote style={{
          margin: 0,
          font: '900 52px/1.0 var(--font-display)',
          letterSpacing: '-0.03em',
          color: 'var(--engu-green)',
          textWrap: 'pretty',
        }}>
          "She used to ask for screen time. Now she asks for{' '}
          <span style={{ fontFamily: 'var(--font-accent)', fontStyle: 'italic', fontWeight: 900, color: '#FFD633' }}>another puzzle</span>.
          Engu turned the bargain on its head."
        </blockquote>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 999, background: 'var(--engu-green)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: '900 22px/1 var(--font-display)', letterSpacing: '-0.02em',
          }}>P</div>
          <div>
            <div style={{ font: '700 16px/1.2 var(--font-body)', color: 'var(--fg-1)' }}>Petra Nováková</div>
            <div style={{ font: '400 14px/1.3 var(--font-body)', color: 'var(--fg-2)' }}>Parent of Anežka, 9</div>
          </div>
        </div>
      </div>
    </section>
  );
}
window.Testimonial = Testimonial;
