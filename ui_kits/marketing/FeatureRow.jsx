// FeatureRow.jsx — alternating editorial rows
function FeatureRow({ eyebrow, title, body, image, side = 'left', accent = false }) {
  const isLeft = side === 'left';
  return (
    <section style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 64,
      alignItems: 'center',
      padding: '64px 32px',
      maxWidth: 1280,
      margin: '0 auto',
    }}>
      <div style={{
        gridColumn: isLeft ? 1 : 2,
        gridRow: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}>
        <div style={{ font: '500 12px/1 var(--font-body)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--engu-green-text)' }}>
          {eyebrow}
        </div>
        <h2 style={{
          margin: 0,
          font: '900 56px/0.9 var(--font-display)',
          letterSpacing: '-0.035em',
          color: 'var(--engu-green)',
          textWrap: 'balance',
        }}>
          {accent ? (
            <>{title.before}<span style={{ fontFamily: 'var(--font-accent)', fontStyle: 'italic', fontWeight: 900, color: '#FFD633' }}>{title.accent}</span>{title.after}</>
          ) : title}
        </h2>
        <p style={{ margin: 0, font: '400 18px/1.45 var(--font-body)', color: 'var(--fg-2)', maxWidth: 460 }}>
          {body}
        </p>
      </div>
      <div style={{
        gridColumn: isLeft ? 2 : 1,
        gridRow: 1,
        position: 'relative',
        aspectRatio: '4/3',
        background: 'var(--engu-cream)',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.06)',
      }}>
        <image-slot
          id={image.id}
          placeholder={image.placeholder}
          shape="rect"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        ></image-slot>
      </div>
    </section>
  );
}
window.FeatureRow = FeatureRow;
