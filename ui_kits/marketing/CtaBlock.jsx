// CtaBlock.jsx — full-bleed ink CTA
function CtaBlock({ onCta }) {
  return (
    <section style={{
      background: 'var(--engu-green-ink)',
      color: '#fff',
      padding: '120px 32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <h2 style={{
          margin: 0,
          font: '900 84px/0.86 var(--font-display)',
          letterSpacing: '-0.04em',
          color: 'var(--engu-green)',
          textWrap: 'balance',
        }}>
          start an adventure<br />
          <span style={{ fontFamily: 'var(--font-accent)', fontStyle: 'italic', color: '#FFD633' }}>tonight.</span>
        </h2>
        <p style={{ margin: 0, font: '400 18px/1.45 var(--font-body)', color: 'rgba(255,255,255,0.78)', maxWidth: 540 }}>
          Free 30-day trial. No credit card. One parent account links unlimited children at no extra cost.
        </p>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <button onClick={onCta} style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#FFEB99',
            color: '#332900',
            font: '700 18px/1 var(--font-body)',
            letterSpacing: '-0.01em',
            padding: '20px 36px',
            borderRadius: 999,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-button)',
          }}>Get started — free</button>
          <button style={{
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'transparent',
            color: '#fff',
            font: '700 16px/1 var(--font-body)',
            letterSpacing: '-0.01em',
            padding: '20px 30px',
            borderRadius: 999,
            cursor: 'pointer',
          }}>Talk to a teacher →</button>
        </div>
      </div>
    </section>
  );
}
window.CtaBlock = CtaBlock;
