// screen-distribucion.jsx — Distribución de quincena
// Flujo activo: usuario recibió $9,250 y debe repartirlo en sobres.

function ScreenDistribucion() {
  const ingreso = 9250;
  const [vals, setVals] = React.useState({
    pago:   2500,
    ahorro: 2500,
    fijos:  1000,
    libre:  3250,
  });
  const total = vals.pago + vals.ahorro + vals.fijos + vals.libre;
  const diff = ingreso - total;

  const setVal = (k, v) => setVals(s => ({ ...s, [k]: Math.max(0, v) }));

  const sobres = [
    { key: 'pago',   name: 'Pago tarjetas', sugerido: 2500, color: FT.accent,
      note: 'Cubre BBVA + Liverpool + MSI',
      icon: <><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></> },
    { key: 'ahorro', name: 'Ahorro',         sugerido: 2500, color: FT.pos,
      note: 'Meta MacBook · $48,000',
      icon: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></> },
    { key: 'fijos',  name: 'Fijos',          sugerido: 950,  color: '#8B6CF0',
      note: 'MacBook $1,400 · Internet $500',
      icon: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6v6H9z"/></> },
    { key: 'libre',  name: 'Libre',          sugerido: 3300, color: FT.warn,
      note: 'Gastos variables · 14 días',
      icon: <><path d="M3 12h18M12 3v18"/></> },
  ];

  return (
    <div style={{
      width: '100%', height: '100%', background: FT.bg,
      overflow: 'hidden', position: 'relative', color: FT.text,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '60px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 99,
          background: FT.surface2, border: `1px solid ${FT.hairline}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h12M7 1l6 6-6 6" stroke={FT.textDim} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 7 7)"/>
          </svg>
        </div>
        <div style={{ fontFamily: FT.sans, fontSize: 14, color: FT.textDim }}>Paso 2 de 3</div>
        <div style={{
          fontFamily: FT.sans, fontSize: 13, color: FT.accent, fontWeight: 500,
        }}>Sugerencia</div>
      </div>

      <div style={{ padding: '0 20px 8px' }}>
        <div style={{ fontFamily: FT.sans, fontSize: 12, color: FT.textMute, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Quincena recibida · 1 may
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <BigNum value={ingreso} size={36}/>
          <Tag color={FT.pos} bg={FT.posSoft}>+ ingreso</Tag>
        </div>
        <div style={{ fontFamily: FT.sans, fontSize: 13, color: FT.textDim, marginTop: 6 }}>
          ¿Cómo lo repartimos hoy?
        </div>
      </div>

      {/* Status bar */}
      <div style={{ padding: '16px 16px 12px' }}>
        <Card pad={14}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
          }}>
            <div style={{ fontFamily: FT.sans, fontSize: 13, color: FT.textDim }}>
              Asignado · <span style={{
                fontFamily: FT.mono, color: FT.text,
                fontVariantNumeric: 'tabular-nums',
              }}>${total.toLocaleString()}</span>
            </div>
            <div style={{
              fontFamily: FT.sans, fontSize: 12, fontWeight: 600,
              color: diff === 0 ? FT.pos : diff > 0 ? FT.warn : FT.danger,
            }}>
              {diff === 0
                ? '✓ Cuadrado'
                : diff > 0
                  ? `Faltan $${diff.toLocaleString()}`
                  : `Te pasaste $${Math.abs(diff).toLocaleString()}`}
            </div>
          </div>
          <SegmentBar
            segments={[
              { value: vals.pago,   color: FT.accent },
              { value: vals.ahorro, color: FT.pos },
              { value: vals.fijos,  color: '#8B6CF0' },
              { value: vals.libre,  color: FT.warn },
              ...(diff > 0 ? [{ value: diff, color: 'rgba(255,255,255,0.06)' }] : []),
            ]}
            height={8}
          />
        </Card>
      </div>

      {/* Sliders */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 16px 200px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="ft-stack">
          {sobres.map(s => (
            <SobreSlider
              key={s.key}
              name={s.name}
              note={s.note}
              color={s.color}
              icon={s.icon}
              value={vals[s.key]}
              sugerido={s.sugerido}
              ingreso={ingreso}
              onChange={(v) => setVal(s.key, v)}
            />
          ))}
        </div>
      </div>

      {/* CTA fijo */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '12px 16px 28px',
        background: 'linear-gradient(to top, rgba(6,8,12,0.96) 60%, rgba(6,8,12,0))',
      }}>
        <button style={{
          width: '100%', padding: '14px 16px', borderRadius: 14, border: 'none',
          background: diff === 0 ? FT.accent : FT.surface3,
          color: diff === 0 ? '#fff' : FT.textDim,
          fontFamily: FT.sans, fontSize: 15, fontWeight: 600, letterSpacing: -0.1,
          boxShadow: diff === 0 ? '0 8px 24px rgba(42,91,255,0.32)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          cursor: 'pointer',
        }}>
          Confirmar distribución
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{
          textAlign: 'center', marginTop: 8,
          fontFamily: FT.sans, fontSize: 11, color: FT.textMute,
        }}>
          Aplicar plantilla sugerida →
        </div>
      </div>
    </div>
  );
}

function SobreSlider({ name, note, color, icon, value, sugerido, ingreso, onChange }) {
  const pct = (value / ingreso) * 100;
  const sugDelta = value - sugerido;
  const isSug = Math.abs(sugDelta) < 50;
  return (
    <Card pad={14}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}1f`, border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            {icon}
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FT.sans, fontSize: 14, fontWeight: 600, color: FT.text }}>
            {name}
          </div>
          <div style={{ fontFamily: FT.sans, fontSize: 11, color: FT.textMute, marginTop: 1 }}>
            {note}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: FT.mono, fontSize: 18, fontWeight: 600, color: FT.text,
            fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
          }}>${value.toLocaleString()}</div>
          <div style={{
            fontFamily: FT.sans, fontSize: 10, marginTop: 2,
            color: isSug ? FT.pos : FT.textMute,
          }}>
            {isSug ? '✓ sugerido' : `sugerido $${sugerido.toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Pseudo slider — visual */}
      <div style={{ position: 'relative', padding: '6px 0' }}>
        <div style={{
          height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, height: 4, width: `${pct}%`,
            background: color, borderRadius: 99,
          }}/>
          {/* sugerido marker */}
          <div style={{
            position: 'absolute', top: -3, left: `${(sugerido/ingreso)*100}%`,
            width: 2, height: 10, background: 'rgba(255,255,255,0.4)', borderRadius: 99,
            transform: 'translateX(-50%)',
          }}/>
          {/* thumb */}
          <div style={{
            position: 'absolute', top: -7, left: `${pct}%`,
            width: 18, height: 18, borderRadius: 99,
            background: '#fff', border: `3px solid ${color}`,
            transform: 'translateX(-50%)',
            boxShadow: `0 4px 12px ${color}66`,
          }}/>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 8,
          fontFamily: FT.sans, fontSize: 10, color: FT.textFade,
        }}>
          <span>$0</span>
          <span style={{ color: FT.textMute, fontFamily: FT.mono, fontVariantNumeric: 'tabular-nums' }}>
            {pct.toFixed(0)}% de la quincena
          </span>
          <span>${ingreso.toLocaleString()}</span>
        </div>
      </div>
    </Card>
  );
}

Object.assign(window, { ScreenDistribucion });
