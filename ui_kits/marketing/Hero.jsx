// Hero.jsx — display headline + Piazzolla italic accent + primary CTA
function Hero({ onCta }) {
  return (
    <section style={{
      position: 'relative',
      padding: '64px 32px 96px',
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      gap: 48,
      alignItems: 'center',
      maxWidth: 1280,
      margin: '0 auto',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ font: '500 12px/1 var(--font-body)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>
          A Bohemia Interactive product
        </div>
        <h1 style={{
          margin: 0,
          font: '900 96px/0.84 var(--font-display)',
          letterSpacing: '-0.04em',
          color: 'var(--engu-green)',
          textWrap: 'balance',
        }}>
          a <span style={{
            fontFamily: 'var(--font-accent)',
            fontStyle: 'italic',
            fontWeight: 900,
            color: '#FFD633',
            letterSpacing: '-0.02em',
            WebkitTextStroke: '0',
          }}>safe</span> place to learn
          <br /> by playing.
        </h1>
        <p style={{
          margin: 0,
          font: '400 18px/1.4 var(--font-body)',
          color: 'var(--fg-2)',
          letterSpacing: '-0.005em',
          maxWidth: 520,
        }}>
          Engu is a virtual world built by Bohemia Interactive that nurtures curiosity
          and rewards exploration. Missions, puzzles, and open-ended challenges develop
          creativity, logical thinking, and digital skills — at every child's pace.
        </p>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 8 }}>
          <button onClick={onCta} style={{
            border: '1px solid rgba(0,0,0,0.1)',
            background: '#FFEB99',
            color: '#332900',
            font: '700 18px/1 var(--font-body)',
            letterSpacing: '-0.01em',
            padding: '18px 32px',
            borderRadius: 999,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-button)',
          }}>Start an adventure</button>
          <button style={{
            border: '1px solid rgba(0,0,0,0.12)',
            background: 'transparent',
            color: 'var(--engu-green-ink)',
            font: '700 16px/1 var(--font-body)',
            letterSpacing: '-0.01em',
            padding: '18px 26px',
            borderRadius: 999,
            cursor: 'pointer',
          }}>Watch the tour</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
          <div style={{ display: 'flex' }}>
            {['L', 'Aa', 'M', 'V'].map((c, i) => (
              <div key={i} style={{
                width: 30, height: 30, borderRadius: 999,
                background: ['#5AA57C', '#FFEB99', '#122119', '#9CC9B0'][i],
                color: i === 1 ? '#332900' : i === 2 ? '#5AA57C' : '#fff',
                border: '2px solid var(--engu-near-white)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: '900 11px/1 var(--font-display)', letterSpacing: '-0.02em',
                marginLeft: i === 0 ? 0 : -10,
              }}>{c}</div>
            ))}
          </div>
          <div style={{ font: '400 14px/1.3 var(--font-body)', color: 'var(--fg-2)' }}>
            <strong style={{ color: 'var(--fg-1)' }}>12,400 families</strong> playing this week
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/5',
          background: 'var(--engu-green)',
          borderRadius: 28,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(18,33,25,0.18)',
        }}>
          <image-slot
            id="engu-hero-img"
            placeholder="Drop a hero photo (children playing / classroom)"
            shape="rect"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          ></image-slot>
        </div>
      </div>
    </section>
  );
}
window.Hero = Hero;
