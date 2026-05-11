// screen-sobres.jsx — Cuentas y sobres
// Muestra distribución de dinero en sobres con énfasis en libre/comprometido.

function ScreenSobres() {
  const sobres = [
    { name: 'Ahorro',          balance: 11000, type: 'savings',  goal: 48000, color: FT.pos,    locked: true,
      note: 'No tocar · meta MacBook' },
    { name: 'Pago tarjetas',   balance: 5127,  type: 'envelope', color: FT.accent,
      note: 'Reservado para BBVA + Liverpool' },
    { name: 'Fijos',           balance: 1900,  type: 'envelope', color: '#8B6CF0',
      note: 'MacBook 21 may · Internet 28 may' },
    { name: 'Libre',           balance: 1820,  type: 'envelope', color: FT.warn,
      note: 'Gastos variables · 9 días restantes' },
  ];
  const cuentas = [
    { name: 'BBVA Débito',     balance: 8847,  type: 'debit',    sub: '•••• 2103' },
    { name: 'Nu Débito',       balance: 0,     type: 'debit',    sub: '•••• 8814' },
  ];

  const total = sobres.reduce((a, s) => a + s.balance, 0) + cuentas.reduce((a, c) => a + c.balance, 0);

  return (
    <div style={{
      width: '100%', height: '100%', background: FT.bg,
      overflow: 'hidden', position: 'relative', color: FT.text,
    }}>
      <PageHeader
        eyebrow="Patrimonio · 9 may"
        title="Tus sobres"
        right={
          <div style={{
            width: 36, height: 36, borderRadius: 99,
            background: FT.surface2, border: `1px solid ${FT.hairline}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {FIcon.plus(FT.text)}
          </div>
        }
      />

      <div style={{
        padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: 16,
        overflow: 'auto', height: 'calc(100% - 100px)',
      }} className="ft-stack">
        {/* Total + donut */}
        <Card pad={18}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <DonutSobres sobres={[...sobres, ...cuentas]}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FT.sans, fontSize: 12, color: FT.textMute, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                Total disponible
              </div>
              <div style={{ marginTop: 4 }}>
                <BigNum value={total} size={28}/>
              </div>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Legend color={FT.pos}    label="Intocable" value={11000}/>
                <Legend color={FT.accent} label="Comprometido" value={7027}/>
                <Legend color={FT.warn}   label="Libre" value={1820}/>
                <Legend color={FT.textDim} label="Cuentas" value={8847}/>
              </div>
            </div>
          </div>
        </Card>

        <div>
          <SectionHeader title="Sobres" action="Reordenar →"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sobres.map(s => <SobreCard key={s.name} {...s}/>)}
          </div>
        </div>

        <div>
          <SectionHeader title="Cuentas bancarias" action="+ Agregar"/>
          <Card pad={0}>
            {cuentas.map((c, i) => (
              <div key={c.name} style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i === cuentas.length - 1 ? 'none' : `1px solid ${FT.hairline}`,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: FT.surface2, border: `1px solid ${FT.hairline}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FT.sans, fontSize: 13, fontWeight: 600, color: FT.textDim,
                }}>{c.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FT.sans, fontSize: 14, color: FT.text, fontWeight: 500 }}>
                    {c.name}
                  </div>
                  <div style={{ fontFamily: FT.mono, fontSize: 11, color: FT.textMute, marginTop: 1 }}>
                    {c.sub}
                  </div>
                </div>
                <div style={{
                  fontFamily: FT.mono, fontSize: 16, fontWeight: 600, color: FT.text,
                  fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
                }}>${c.balance.toLocaleString()}</div>
              </div>
            ))}
          </Card>
        </div>

        {/* Regla recordatoria */}
        <Card pad={14} surface="rgba(245,181,68,0.06)" style={{ borderColor: 'rgba(245,181,68,0.18)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 99, background: FT.warnSoft, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FT.sans, fontSize: 13, color: FT.warn, fontWeight: 600,
            }}>!</div>
            <div>
              <div style={{ fontFamily: FT.sans, fontSize: 13, color: FT.text, fontWeight: 500 }}>
                Si Libre se acaba, no se repone con tarjeta.
              </div>
              <div style={{ fontFamily: FT.sans, fontSize: 12, color: FT.textDim, marginTop: 3, lineHeight: 1.45 }}>
                Antojos, Bama, Amazon y compras random salen de Libre. El sistema te avisa antes de tocar Ahorro.
              </div>
            </div>
          </div>
        </Card>
      </div>

      <TabBar active="env"/>
    </div>
  );
}

function Legend({ color, label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: FT.sans, fontSize: 11,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: FT.textDim }}>
        {FIcon.dot(color)}<span>{label}</span>
      </div>
      <span style={{ fontFamily: FT.mono, color: FT.text, fontVariantNumeric: 'tabular-nums' }}>
        ${value.toLocaleString()}
      </span>
    </div>
  );
}

function DonutSobres({ sobres }) {
  const total = sobres.reduce((a, s) => a + s.balance, 0);
  const size = 116, stroke = 14, r = (size - stroke) / 2, C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke}/>
        {sobres.map((s, i) => {
          const len = (s.balance / total) * C;
          const c = s.color || FT.textDim;
          const el = (
            <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
                    stroke={c} strokeWidth={stroke}
                    strokeDasharray={`${len - 2} ${C}`}
                    strokeDashoffset={-offset}/>
          );
          offset += len;
          return el;
        })}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      }}>
        <div style={{ fontFamily: FT.sans, fontSize: 9, color: FT.textMute, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          Patrimonio
        </div>
      </div>
    </div>
  );
}

function SobreCard({ name, balance, color, note, goal, locked }) {
  const pct = goal ? balance / goal : 1;
  return (
    <Card pad={14}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 4, alignSelf: 'stretch', borderRadius: 99, background: color,
            minHeight: 36,
          }}/>
          <div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontFamily: FT.sans, fontSize: 15, fontWeight: 600, color: FT.text }}>
                {name}
              </span>
              {locked && (
                <span style={{ color: FT.textFade, display: 'inline-flex' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="10" width="16" height="11" rx="2"/>
                    <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
                  </svg>
                </span>
              )}
            </div>
            <div style={{ fontFamily: FT.sans, fontSize: 11, color: FT.textMute, marginTop: 3 }}>
              {note}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: FT.mono, fontSize: 18, fontWeight: 600, color: FT.text,
            fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
          }}>${balance.toLocaleString()}</div>
          {goal && (
            <div style={{ fontFamily: FT.sans, fontSize: 11, color: FT.textMute, marginTop: 2 }}>
              {Math.round(pct * 100)}% de ${goal.toLocaleString()}
            </div>
          )}
        </div>
      </div>
      {goal && (
        <div style={{ marginTop: 10 }}>
          <ProgressBar pct={pct * 100} color={color} height={4}/>
        </div>
      )}
    </Card>
  );
}

Object.assign(window, { ScreenSobres });
