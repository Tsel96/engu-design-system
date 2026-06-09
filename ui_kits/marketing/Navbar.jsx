// Navbar.jsx — sticky top navigation
function Navbar({ onCta }) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const navStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 32px',
    background: scrolled ? 'rgba(252,252,252,0.86)' : 'transparent',
    backdropFilter: scrolled ? 'saturate(140%) blur(18px)' : 'none',
    WebkitBackdropFilter: scrolled ? 'saturate(140%) blur(18px)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
    transition: 'background 240ms var(--ease-out), border-color 240ms var(--ease-out)',
  };
  const linkStyle = {
    font: '600 14px/1 var(--font-body)',
    color: 'var(--fg-1)',
    letterSpacing: '-0.005em',
    textDecoration: 'none',
    padding: '8px 4px',
    opacity: 0.84,
  };
  return (
    <nav style={navStyle}>
      <a href="#" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <img src="./assets/engu-horizontal-green.svg" alt="engu" style={{ height: 32, display: 'block' }} />
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <a href="#play" style={linkStyle}>Play</a>
        <a href="#parents" style={linkStyle}>For parents</a>
        <a href="#teachers" style={linkStyle}>For teachers</a>
        <a href="#about" style={linkStyle}>About</a>
        <a href="#cs" style={{ ...linkStyle, opacity: 0.5 }}>CS</a>
      </div>
      <button onClick={onCta} className="engu-btn-primary" style={{
        border: '1px solid rgba(0,0,0,0.1)',
        background: '#FFEB99',
        color: '#332900',
        font: '700 14px/1 var(--font-body)',
        letterSpacing: '-0.01em',
        padding: '12px 22px',
        borderRadius: 999,
        cursor: 'pointer',
        boxShadow: 'var(--shadow-button)',
      }}>Get started</button>
    </nav>
  );
}
window.Navbar = Navbar;
