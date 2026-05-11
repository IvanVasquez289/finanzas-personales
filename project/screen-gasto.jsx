// screen-gasto.jsx — Registro de gasto manual con teclado numérico

function ScreenGasto() {
  const [amount, setAmount] = React.useState('128.40');
  const [cat, setCat] = React.useState('transporte');
  const [method, setMethod] = React.useState('bbva');

  const cats = [
    { id: 'transporte', label: 'Transporte',     color: FT.accent },
    { id: 'comida',     label: 'Comida/salidas', color: '#8B6CF0' },
    { id: 'tools',      label: 'Tools/subs',     color: '#3DD6C9' },
    { id: 'libre',      label: 'Libre',          color: FT.warn   },
    { id: 'msi',        label: 'MSI',            color: FT.danger },
    { id: 'fijos',      label: 'Fijos',          color: FT.pos    },
  ];

  const methods = [
    { id: 'bbva',      label: 'BBVA Azul',     sub: 'Crédito · 4821' },
    { id: 'liverpool', label: 'Liverpool',     sub: 'Crédito · 9942' },
    { id: 'debito',    label: 'BBVA Débito',   sub: 'Libre · $1,820' },
  ];

  return (
    <div style={{
      width: '100%', height: '100%', background: FT.bg,
      overflow: 'hidden', position: 'relative', color: FT.text,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '60px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: FT.sans, fontSize: 14, color: FT.textDim,
        }}>Cancelar</div>
        <div style={{ fontFamily: FT.sans, fontSize: 15, fontWeight: 600, color: FT.text }}>
          Nuevo gasto
        </div>
        <div style={{
          fontFamily: FT.sans, fontSize: 14, color: FT.accent, fontWeight: 600,
        }}>Guardar</div>
      </div>

      {/* Amount display */}
      <div style={{ padding: '24px 20px 8px', textAlign: 'center' }}>
        <div style={{
          fontFamily: FT.sans, fontSize: 11, color: FT.textMute,
          letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8,
        }}>Monto</div>
        <div style={{
          display: 'inline-flex', alignItems: 'baseline', justifyContent: 'center',
          fontFamily: FT.mono, fontVariantNumeric: 'tabular-nums', letterSpacing: -1.5,
        }}>
          <span style={{ fontSize: 28, color: FT.textMute, marginRight: 4 }}>−$</span>
          <span style={{ fontSize: 64, fontWeight: 600, color: FT.text, lineHeight: 1 }}>
            {amount.split('.')[0]}
          </span>
          <span style={{ fontSize: 32, color: FT.textDim, fontWeight: 600 }}>.{amount.split('.')[1] || '00'}</span>
          <span style={{
            display: 'inline-block', width: 2, height: 36, background: FT.accent,
            marginLeft: 4, animation: 'blink 1s steps(2) infinite',
          }}/>
        </div>
        <div style={{
          fontFamily: FT.sans, fontSize: 12, color: FT.textMute, marginTop: 8,
        }}>9 may · 14:22 · Uber</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px 16px' }}>
        {/* Categoría */}
        <div style={{ marginTop: 8 }}>
          <SectionHeader title="Categoría"/>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {cats.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)} style={{
                padding: '8px 14px', borderRadius: 99,
                background: cat === c.id ? `${c.color}22` : FT.surface,
                border: `1px solid ${cat === c.id ? `${c.color}55` : FT.hairline}`,
                color: cat === c.id ? c.color : FT.textDim,
                fontFamily: FT.sans, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: 99, background: c.color,
                  display: 'inline-block',
                }}/>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Método de pago */}
        <div style={{ marginTop: 18 }}>
          <SectionHeader title="Cargar a"/>
          <Card pad={0}>
            {methods.map((m, i) => (
              <button key={m.id} onClick={() => setMethod(m.id)} style={{
                width: '100%', background: 'transparent', border: 'none',
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i === methods.length - 1 ? 'none' : `1px solid ${FT.hairline}`,
                cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 99,
                  border: `1.5px solid ${method === m.id ? FT.accent : FT.hairline2}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {method === m.id && (
                    <div style={{ width: 10, height: 10, borderRadius: 99, background: FT.accent }}/>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FT.sans, fontSize: 14, fontWeight: 500, color: FT.text }}>
                    {m.label}
                  </div>
                  <div style={{ fontFamily: FT.sans, fontSize: 11, color: FT.textMute, marginTop: 1 }}>
                    {m.sub}
                  </div>
                </div>
                {method === m.id && (
                  <Tag color={FT.accent} bg={FT.accentSoft}>
                    Asigna a ciclo 06 may → 05 jun
                  </Tag>
                )}
              </button>
            ))}
          </Card>
        </div>

        {/* MSI toggle */}
        <div style={{ marginTop: 14 }}>
          <Card pad={14}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: FT.sans, fontSize: 14, fontWeight: 500, color: FT.text }}>
                  ¿Meses sin intereses?
                </div>
                <div style={{ fontFamily: FT.sans, fontSize: 11, color: FT.textMute, marginTop: 2 }}>
                  Divide el monto en parcialidades del ciclo
                </div>
              </div>
              {/* toggle off */}
              <div style={{
                width: 42, height: 24, borderRadius: 99,
                background: FT.surface3, padding: 2, display: 'flex', alignItems: 'center',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 99, background: FT.textMute,
                }}/>
              </div>
            </div>
          </Card>
        </div>

        {/* Notas */}
        <div style={{ marginTop: 14 }}>
          <Card pad={14}>
            <div style={{
              fontFamily: FT.sans, fontSize: 11, color: FT.textMute,
              letterSpacing: 0.6, textTransform: 'uppercase',
            }}>Nota</div>
            <div style={{
              fontFamily: FT.sans, fontSize: 14, color: FT.textDim, marginTop: 6,
            }}>Didi al aeropuerto, viernes</div>
          </Card>
        </div>
      </div>

      {/* Numeric keypad — custom (no iOS) */}
      <Keypad value={amount} setValue={setAmount}/>
    </div>
  );
}

function Keypad({ value, setValue }) {
  const press = (k) => {
    setValue(v => {
      if (k === 'del') return v.length > 1 ? v.slice(0, -1) : '0';
      if (k === '.') return v.includes('.') ? v : v + '.';
      if (v === '0') return k;
      return v + k;
    });
  };
  const keys = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    ['.','0','del'],
  ];
  return (
    <div style={{
      padding: '8px 12px 28px',
      background: 'linear-gradient(to top, rgba(11,14,20,1), rgba(11,14,20,0.85))',
      borderTop: `1px solid ${FT.hairline}`,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {keys.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 6 }}>
            {row.map(k => (
              <button key={k} onClick={() => press(k)} style={{
                flex: 1, height: 46, borderRadius: 12,
                background: FT.surface2, border: `1px solid ${FT.hairline}`,
                fontFamily: FT.mono, fontSize: 22, fontWeight: 500, color: FT.text,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {k === 'del' ? (
                  <svg width="20" height="14" viewBox="0 0 24 17" fill="none">
                    <path d="M8 1h13a2 2 0 012 2v11a2 2 0 01-2 2H8l-7-8.5L8 1z" stroke={FT.textDim} strokeWidth="1.4"/>
                    <path d="M12 5l6 6m0-6l-6 6" stroke={FT.textDim} strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                ) : k}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenGasto });
