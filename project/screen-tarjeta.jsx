// screen-tarjeta.jsx — Detalle de tarjeta BBVA Azul con ciclo actual.

function ScreenTarjeta() {
  // Ciclo BBVA: 06 may → 05 jun, pago 25 jun
  const used = 3847.20;
  const budget = 5000;
  const limit = 28000;
  const pct = used / budget;
  const dayInCycle = 4;
  const cycleDays = 30;
  const daysToClose = 26;

  const categorias = [
    { label: 'Transporte',      value: 1240, color: FT.accent },
    { label: 'Comida/salidas',  value: 980,  color: '#8B6CF0' },
    { label: 'Tools/subs',      value: 612,  color: '#3DD6C9' },
    { label: 'MSI',             value: 580,  color: FT.warn   },
    { label: 'Libre',           value: 435,  color: FT.danger },
  ];

  return (
    <div style={{
      width: '100%', height: '100%', background: FT.bg,
      overflow: 'auto', position: 'relative', color: FT.text,
      paddingBottom: 40,
    }}>
      {/* Top bar */}
      <div style={{
        padding: '60px 16px 12px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 99,
          background: FT.surface2, border: `1px solid ${FT.hairline}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 1L3 7l6 6" stroke={FT.textDim} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ fontFamily: FT.sans, fontSize: 14, color: FT.textDim }}>Tarjeta</div>
        <div style={{
          width: 36, height: 36, borderRadius: 99,
          background: FT.surface2, border: `1px solid ${FT.hairline}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="4" viewBox="0 0 16 4" fill="none">
            <circle cx="2" cy="2" r="1.5" fill={FT.textDim}/>
            <circle cx="8" cy="2" r="1.5" fill={FT.textDim}/>
            <circle cx="14" cy="2" r="1.5" fill={FT.textDim}/>
          </svg>
        </div>
      </div>

      {/* Card hero — visual tarjeta */}
      <div style={{ padding: '0 16px 18px' }}>
        <div style={{
          height: 196, borderRadius: 20,
          background: 'linear-gradient(135deg, #1E3DB0 0%, #2A5BFF 55%, #5C84FF 100%)',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(42,91,255,0.32), inset 0 1px 0 rgba(255,255,255,0.25)',
          padding: 20, color: '#fff',
        }}>
          {/* mesh */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,0.25) 0%, transparent 60%)',
          }}/>
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: FT.sans, fontSize: 11, opacity: 0.8, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  BBVA · Crédito
                </div>
                <div style={{ fontFamily: FT.sans, fontSize: 22, fontWeight: 600, marginTop: 4 }}>
                  Azul
                </div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                padding: '4px 10px', borderRadius: 99,
                fontFamily: FT.sans, fontSize: 11, fontWeight: 500, letterSpacing: 0.4,
              }}>VISA</div>
            </div>
            <div>
              <div style={{
                fontFamily: FT.mono, fontSize: 16, letterSpacing: 4, opacity: 0.9,
              }}>•••• 4821</div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                marginTop: 12,
              }}>
                <div>
                  <div style={{ fontSize: 9, opacity: 0.7, letterSpacing: 0.6, textTransform: 'uppercase' }}>Corte</div>
                  <div style={{ fontFamily: FT.mono, fontSize: 14, fontWeight: 500 }}>05 jun</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, opacity: 0.7, letterSpacing: 0.6, textTransform: 'uppercase' }}>Pago</div>
                  <div style={{ fontFamily: FT.mono, fontSize: 14, fontWeight: 500 }}>25 jun</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, opacity: 0.7, letterSpacing: 0.6, textTransform: 'uppercase' }}>Límite</div>
                  <div style={{ fontFamily: FT.mono, fontSize: 14, fontWeight: 500 }}>${limit.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Presupuesto del ciclo */}
      <div style={{ padding: '0 16px 18px' }}>
        <Card pad={18}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: FT.sans, fontSize: 12, color: FT.textMute, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                Presupuesto personal
              </div>
              <div style={{ marginTop: 6 }}>
                <BigNum value={used} size={36}/>
              </div>
              <div style={{ fontFamily: FT.sans, fontSize: 12, color: FT.textMute, marginTop: 4 }}>
                de <span style={{ fontFamily: FT.mono }}>${budget.toLocaleString()}</span> ·
                te quedan <span style={{ fontFamily: FT.mono, color: FT.text }}>${(budget - used).toFixed(2)}</span>
              </div>
            </div>
            <Ring size={68} stroke={7} value={pct} color={pct > 0.85 ? FT.danger : pct > 0.7 ? FT.warn : FT.accent}>
              <div style={{ fontFamily: FT.mono, fontSize: 13, fontWeight: 600, color: FT.text }}>
                {Math.round(pct * 100)}%
              </div>
            </Ring>
          </div>

          {/* timeline ciclo */}
          <div style={{ marginTop: 18 }}>
            <div style={{
              position: 'relative', height: 28,
            }}>
              {/* track */}
              <div style={{
                position: 'absolute', top: 13, left: 0, right: 0, height: 2,
                background: 'rgba(255,255,255,0.07)', borderRadius: 99,
              }}/>
              {/* progress */}
              <div style={{
                position: 'absolute', top: 13, left: 0,
                width: `${(dayInCycle/cycleDays)*100}%`, height: 2,
                background: FT.accent, borderRadius: 99,
              }}/>
              {/* markers */}
              {[
                { d: 0, label: '06 may', sub: 'inicio' },
                { d: dayInCycle, label: 'Hoy', sub: '09 may', active: true },
                { d: cycleDays, label: '05 jun', sub: 'corte' },
                { d: cycleDays + 20, label: '25 jun', sub: 'pago' },
              ].map((m, i) => {
                const max = cycleDays + 20;
                return (
                  <div key={i} style={{
                    position: 'absolute', left: `${(m.d/max)*100}%`,
                    transform: i === 0 ? 'translateX(0)' : i === 3 ? 'translateX(-100%)' : 'translateX(-50%)',
                    top: 0, textAlign: i === 0 ? 'left' : i === 3 ? 'right' : 'center',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: 99,
                      background: m.active ? FT.accent : i < 2 ? FT.accent : FT.surface3,
                      border: m.active ? `2px solid ${FT.bg}` : 'none',
                      boxShadow: m.active ? `0 0 0 2px ${FT.accent}` : 'none',
                      margin: i === 0 ? '8px 0 0' : i === 3 ? '8px 0 0 auto' : '8px auto 0',
                    }}/>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: FT.sans, fontSize: 10, color: FT.textMute }}>
              <span>06 may<br/><span style={{ color: FT.textFade }}>inicio</span></span>
              <span style={{ color: FT.accent, textAlign: 'center' }}>Hoy<br/><span style={{ color: FT.accent, opacity: 0.7 }}>09 may</span></span>
              <span style={{ textAlign: 'right' }}>05 jun<br/><span style={{ color: FT.textFade }}>corte · 26 d</span></span>
              <span style={{ textAlign: 'right' }}>25 jun<br/><span style={{ color: FT.textFade }}>pago</span></span>
            </div>
          </div>
        </Card>
      </div>

      {/* Categorías */}
      <div style={{ padding: '0 16px 18px' }}>
        <SectionHeader title="Por categoría · este ciclo"/>
        <Card pad={16}>
          <BarsH data={categorias}/>
        </Card>
      </div>

      {/* MSI */}
      <div style={{ padding: '0 16px 18px' }}>
        <SectionHeader title="MSI activos" action="3 planes →"/>
        <Card pad={0}>
          <MsiRow merchant="Apple · Audífonos" total={4800}  monthly={400} cur={6} tot={12}/>
          <MsiRow merchant="Liverpool · Ropa"  total={2100}  monthly={350} cur={2} tot={6}/>
          <MsiRow merchant="Amazon · Monitor"  total={3870}  monthly={645} cur={3} tot={6} last/>
        </Card>
      </div>

      {/* Movimientos del ciclo */}
      <div style={{ padding: '0 16px 18px' }}>
        <SectionHeader title="Movimientos · 9 de 47" action="Ver todos →"/>
        <Card pad={0}>
          <CycleTx merchant="Uber"     cat="Transporte" amount={69.60}  date="Hoy"/>
          <CycleTx merchant="Spotify"  cat="Tools/subs" amount={115}    date="Hoy"/>
          <CycleTx merchant="iCloud+"  cat="Tools/subs" amount={49}     date="08 may"/>
          <CycleTx merchant="Didi"     cat="Transporte" amount={128.40} date="08 may"/>
          <CycleTx merchant="Claude"   cat="Tools/subs" amount={399}    date="07 may"/>
          <CycleTx merchant="Uber Eats" cat="Comida/salidas" amount={245} date="07 may" last/>
        </Card>
      </div>
    </div>
  );
}

function MsiRow({ merchant, total, monthly, cur, tot, last }) {
  const pct = cur / tot;
  return (
    <div style={{
      padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${FT.hairline}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: FT.sans, fontSize: 14, color: FT.text, fontWeight: 500 }}>
          {merchant}
        </div>
        <div style={{
          fontFamily: FT.mono, fontSize: 14, color: FT.text, fontWeight: 600,
          fontVariantNumeric: 'tabular-nums', letterSpacing: -0.2,
        }}>${monthly}/mes</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <div style={{ flex: 1 }}>
          <ProgressBar pct={pct * 100} color={FT.warn} height={4}/>
        </div>
        <div style={{ fontFamily: FT.mono, fontSize: 11, color: FT.textMute, fontVariantNumeric: 'tabular-nums' }}>
          {cur}/{tot} · resta ${((tot-cur)*monthly).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function CycleTx({ merchant, cat, amount, date, last }) {
  return (
    <div style={{
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: last ? 'none' : `1px solid ${FT.hairline}`,
    }}>
      <div style={{
        fontFamily: FT.mono, fontSize: 10, color: FT.textMute,
        width: 44, flexShrink: 0,
      }}>{date}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FT.sans, fontSize: 14, color: FT.text, fontWeight: 500 }}>
          {merchant}
        </div>
        <div style={{ fontFamily: FT.sans, fontSize: 11, color: FT.textMute, marginTop: 1 }}>
          {cat}
        </div>
      </div>
      <div style={{
        fontFamily: FT.mono, fontSize: 14, fontWeight: 600, color: FT.text,
        fontVariantNumeric: 'tabular-nums',
      }}>
        ${amount.toLocaleString('en-US', {minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2})}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenTarjeta });
