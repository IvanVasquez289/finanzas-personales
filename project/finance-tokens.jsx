// finance-tokens.jsx — shared tokens, primitives, and tiny chart helpers
// Loaded before screens; exposes everything on `window`.

const FT = {
  // Surfaces (dark premium, cool near-black)
  bg:        '#06080c',
  bgSoft:    '#0b0e14',
  surface:   '#10141c',
  surface2:  '#161b25',
  surface3:  '#1d2330',
  hairline:  'rgba(255,255,255,0.06)',
  hairline2: 'rgba(255,255,255,0.10)',

  // Text
  text:      '#eef2f8',
  textDim:   '#a4adbe',
  textMute:  '#6a7384',
  textFade:  '#444c5b',

  // Accents
  accent:    '#2A5BFF',
  accentSoft:'rgba(42,91,255,0.16)',
  accentLine:'rgba(42,91,255,0.35)',

  // Semantic
  pos:       '#3DD68C',
  posSoft:   'rgba(61,214,140,0.14)',
  warn:      '#F5B544',
  warnSoft:  'rgba(245,181,68,0.14)',
  danger:    '#F46A6A',
  dangerSoft:'rgba(244,106,106,0.14)',

  // Typography
  sans: '"Geist", -apple-system, system-ui, sans-serif',
  mono: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
};

// Currency formatter — MXN-style with $ prefix and no decimals for big numbers
function money(n, { decimals = 0, sign = false } = {}) {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const s = n < 0 ? '−' : (sign && n > 0 ? '+' : '');
  return `${s}$${formatted}`;
}

// Tiny chevron / arrow / glyph set — kept minimal, no decorative SVGs.
const FIcon = {
  chev: (c = FT.textMute) => (
    <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
      <path d="M1 1l5 5-5 5" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arrowUp: (c) => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M5 1.5v7M2 4l3-3 3 3" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arrowDown: (c) => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M5 1.5v7M2 6l3 3 3-3" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  plus: (c = '#fff') => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5v11M1.5 7h11" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  dot: (c) => (<span style={{display:'inline-block',width:6,height:6,borderRadius:99,background:c}}/>),
};

// Big number — tabular monospaced, with optional currency split
function BigNum({ value, size = 44, weight = 600, color = FT.text, mono = true, prefix = '$' }) {
  const abs = Math.abs(value);
  const [intPart, decPart] = abs.toFixed(2).split('.');
  const intWithCommas = Number(intPart).toLocaleString('en-US');
  return (
    <div style={{
      fontFamily: mono ? FT.mono : FT.sans,
      fontWeight: weight, color, lineHeight: 1, letterSpacing: -0.5,
      display: 'inline-flex', alignItems: 'baseline',
      fontVariantNumeric: 'tabular-nums',
    }}>
      <span style={{ fontSize: size * 0.55, color: FT.textMute, marginRight: 2 }}>{prefix}</span>
      <span style={{ fontSize: size }}>{intWithCommas}</span>
      <span style={{ fontSize: size * 0.5, color: FT.textMute, marginLeft: 2 }}>.{decPart}</span>
    </div>
  );
}

// Horizontal progress bar — segmented (used / committed / left)
function ProgressBar({ pct, color = FT.accent, track = 'rgba(255,255,255,0.06)', height = 6 }) {
  return (
    <div style={{
      width: '100%', height, background: track, borderRadius: 99, overflow: 'hidden',
    }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%',
        background: color, borderRadius: 99,
      }} />
    </div>
  );
}

// Segmented bar — multiple parts in one track
function SegmentBar({ segments, height = 8 }) {
  return (
    <div style={{
      display: 'flex', width: '100%', height, gap: 2,
      background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden',
    }}>
      {segments.map((s, i) => (
        <div key={i} style={{ flex: s.value, background: s.color, height: '100%' }} />
      ))}
    </div>
  );
}

// SVG ring (donut) — half or full
function Ring({ size = 110, stroke = 10, value = 0.6, color = FT.accent, track = 'rgba(255,255,255,0.07)', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * value;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={`${dash} ${c}`} strokeLinecap="round"/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      }}>{children}</div>
    </div>
  );
}

// Sparkline (path)
function Spark({ data, width = 320, height = 60, color = FT.accent, fill = true }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - ((v - min) / range) * (height - 6) - 3]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`spk-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#spk-${color.replace('#','')})`}/>}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

// Bar chart — categorical
function BarsH({ data, color = FT.accent, max }) {
  const top = max ?? Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginBottom: 6, fontFamily: FT.sans,
          }}>
            <span style={{ fontSize: 13, color: FT.text }}>{d.label}</span>
            <span style={{
              fontSize: 12, color: FT.textDim, fontFamily: FT.mono,
              fontVariantNumeric: 'tabular-nums',
            }}>{money(d.value)}</span>
          </div>
          <ProgressBar pct={(d.value / top) * 100} color={d.color || color} height={5}/>
        </div>
      ))}
    </div>
  );
}

// Card surface
function Card({ children, style = {}, pad = 16, surface = FT.surface, border = true }) {
  return (
    <div style={{
      background: surface, borderRadius: 18,
      border: border ? `1px solid ${FT.hairline}` : 'none',
      padding: pad, ...style,
    }}>{children}</div>
  );
}

// Section label + optional action
function SectionHeader({ title, action, style = {} }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 4px 10px', ...style,
    }}>
      <div style={{
        fontFamily: FT.sans, fontSize: 12, fontWeight: 500,
        color: FT.textMute, textTransform: 'uppercase', letterSpacing: 0.8,
      }}>{title}</div>
      {action && <div style={{ fontFamily: FT.sans, fontSize: 13, color: FT.accent }}>{action}</div>}
    </div>
  );
}

// Pill / tag
function Tag({ children, color = FT.textDim, bg = 'rgba(255,255,255,0.06)', style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500,
      color, background: bg, fontFamily: FT.sans, letterSpacing: 0.2,
      ...style,
    }}>{children}</span>
  );
}

// Bottom tab bar
function TabBar({ active = 'home' }) {
  const items = [
    { id: 'home',  label: 'Inicio',     glyph: <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2V10z"/> },
    { id: 'cards', label: 'Tarjetas',   glyph: <><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></> },
    { id: 'add',   label: '',           glyph: null, isAdd: true },
    { id: 'env',   label: 'Sobres',     glyph: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 8l9 6 9-6"/></> },
    { id: 'goal',  label: 'Meta',       glyph: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></> },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, padding: '28px 18px 44px',
      background: 'linear-gradient(to top, rgba(6,8,12,0.98) 72%, rgba(6,8,12,0))',
      zIndex: 30,
    }}>
      <div style={{
        minHeight: 76, borderRadius: 30, border: `1px solid ${FT.hairline}`,
        background: 'rgba(8,11,18,0.94)', backdropFilter: 'blur(24px)',
        boxShadow: '0 -12px 38px rgba(0,0,0,0.48)',
        display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', alignItems: 'center',
        padding: '8px 8px',
      }}>
        {items.map(it => it.isAdd ? (
          <div key={it.id} style={{
            width: 58, height: 58, borderRadius: 99, background: FT.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 28px rgba(42,91,255,0.50), inset 0 1px 0 rgba(255,255,255,0.24)',
            margin: '-36px auto 0',
          }}>{FIcon.plus('#fff')}</div>
        ) : (
          <div key={it.id} style={{
            width: 58, height: 58, margin: '0 auto',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            color: active === it.id ? FT.text : FT.textFade,
            borderRadius: 16,
            background: active === it.id ? 'rgba(255,255,255,0.07)' : 'transparent',
            boxShadow: active === it.id ? 'inset 0 0 0 1px rgba(255,255,255,0.13)' : 'none',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth={active === it.id ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
              {it.glyph}
            </svg>
            <span style={{ fontFamily: FT.sans, fontSize: 10, fontWeight: active === it.id ? 650 : 500, lineHeight: 1 }}>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Status-bar-aware page header inside an iOS frame
function PageHeader({ eyebrow, title, right, version = 'V2.0.0', style = {} }) {
  return (
    <div style={{
      padding: '60px 20px 18px', display: 'flex', alignItems: 'flex-end',
      justifyContent: 'space-between', ...style,
    }}>
      <div>
        {eyebrow && <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: FT.sans, fontSize: 12, color: FT.textMute,
          letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8,
        }}>
          <span>{eyebrow}</span>
          <span style={{
            border: `1px solid ${FT.hairline}`, background: 'rgba(255,255,255,0.04)',
            borderRadius: 99, padding: '2px 8px', fontSize: 10,
            fontWeight: 650, color: FT.textDim, letterSpacing: 0.4,
          }}>{version}</span>
        </div>}
        <div style={{
          fontFamily: FT.sans, fontSize: 31, fontWeight: 600,
          color: FT.text, letterSpacing: -0.5, lineHeight: 1.1,
        }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

Object.assign(window, {
  FT, FIcon, money,
  BigNum, ProgressBar, SegmentBar, Ring, Spark, BarsH,
  Card, SectionHeader, Tag, TabBar, PageHeader,
});
