// AgeTiles.jsx — 3-up age-tier cards on cream surface
function AgeTiles() {
  const tiles = [
    { ages: '6–8', title: 'First explorers', body: 'Gentle puzzles, big shapes, friendly guides. Reading-light, gesture-heavy.', bg: '#fff', fg: 'var(--engu-green-ink)', sub: 'var(--fg-2)', chip: 'var(--engu-cream)', chipFg: 'var(--engu-green-text)' },
    { ages: '9–11', title: 'Adventurers',     body: 'Branching missions, simple maps, and the first co-op challenges with classmates.', bg: 'var(--engu-green)', fg: '#fff', sub: 'rgba(255,255,255,0.84)', chip: 'rgba(255,255,255,0.18)', chipFg: '#fff' },
    { ages: '12+',  title: 'Builders',        body: 'Open-ended building, scripted logic, and player-led tournaments.', bg: 'var(--engu-green-ink)', fg: 'var(--engu-green)', sub: 'rgba(255,255,255,0.7)', chip: '#FFD633', chipFg: '#332900' },
  ];
  return (
    <section style={{ background: 'var(--engu-cream)', padding: '96px 32px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, gap: 24 }}>
          <h2 style={{ margin: 0, font: '900 64px/0.86 var(--font-display)', letterSpacing: '-0.035em', color: 'var(--engu-green)' }}>
            grows with the<br />
            <span style={{ fontFamily: 'var(--font-accent)', fontStyle: 'italic', fontWeight: 900, color: '#FFD633' }}>player.</span>
          </h2>
          <p style={{ margin: 0, font: '400 18px/1.45 var(--font-body)', color: 'var(--fg-2)', maxWidth: 320 }}>
            Three tiers of content, automatically adjusted to the child's pace and reading level.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          {tiles.map((t, i) => (
            <article key={i} style={{
              background: t.bg, color: t.fg,
              borderRadius: 24, padding: 32,
              display: 'flex', flexDirection: 'column', gap: 20,
              minHeight: 380,
              boxShadow: t.bg === '#fff' ? '0 1px 2px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.06)' : 'none',
            }}>
              <div style={{
                font: '500 12px/1 var(--font-body)', letterSpacing: '0.16em', textTransform: 'uppercase',
                color: t.sub,
              }}>Ages</div>
              <div style={{
                font: '900 64px/0.84 var(--font-display)', letterSpacing: '-0.04em',
              }}>{t.ages}</div>
              <div style={{ font: '700 20px/1.2 var(--font-body)', letterSpacing: '-0.01em', marginTop: 'auto' }}>
                {t.title}
              </div>
              <div style={{ font: '400 14px/1.45 var(--font-body)', color: t.sub }}>
                {t.body}
              </div>
              <div>
                <span style={{
                  background: t.chip, color: t.chipFg,
                  font: '500 11px/1 var(--font-body)', letterSpacing: '0.14em', textTransform: 'uppercase',
                  padding: '8px 12px', borderRadius: 999,
                }}>{i === 2 ? 'New' : 'Included'}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
window.AgeTiles = AgeTiles;
