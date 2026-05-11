// dashboard.jsx — Pantalla principal
// "Resumen de quincena + avance de meta" como héroe.

function ScreenDashboard() {
  // ── Datos del spec ──────────────────────────────────────────
  const ingreso = 9250;
  const repartido = { pagoTarjetas: 2500, ahorro: 2500, fijos: 1000, libre: 3250 };
  const gastado = 4128;            // gastado del periodo
  const libreUsado = 1430;
  const libreTotal = 3250;
  const ahorroActual = 11000;
  const ahorroMeta = 48000;
  const ahorroDelta = 5500;        // este mes
  const ahorroHistory = [3500, 4200, 4800, 5100, 5300, 5500, 6200, 7400, 8200, 9100, 10100, 11000];

  return (
    <div style={{
      width: '100%', height: '100%', background: FT.bg,
      overflow: 'hidden', position: 'relative', color: FT.text,
    }}>
      <PageHeader
        eyebrow="Quincena · 1 — 15 may"
        title="Hola, Iván."
        right={
          <div style={{
            width: 36, height: 36, borderRadius: 99,
            background: FT.surface2, border: `1px solid ${FT.hairline}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FT.sans, fontSize: 13, color: FT.textDim, fontWeight: 500,
          }}>IL</div>
        }
      />

      <div style={{
        padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: 18,
        overflow: 'auto', height: 'calc(100% - 100px)',
      }} className="ft-stack">
        {/* ── HÉROE: Quincena + Meta ──────────────────────────── */}
        <div style={{
          background: 'radial-gradient(120% 100% at 0% 0%, rgba(42,91,255,0.18) 0%, rgba(42,91,255,0) 55%), ' + FT.surface,
          border: `1px solid ${FT.hairline}`, borderRadius: 22, padding: 18,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* subtle grid */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none',
            background: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px) 0 0/100% 28px',
          }}/>
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 6,
            }}>
              <span style={{ fontFamily: FT.sans, fontSize: 13, color: FT.textDim }}>
                Te quedan libres
              </span>
              <Tag color={FT.pos} bg={FT.posSoft}>
                {FIcon.dot(FT.pos)} En camino
              </Tag>
            </div>
            <BigNum value={libreTotal - libreUsado} size={48} weight={600}/>
            <div style={{
              fontFamily: FT.sans, fontSize: 12, color: FT.textMute, marginTop: 6,
            }}>
              de <span style={{ fontFamily: FT.mono }}>{money(libreTotal)}</span> · te alcanza ~9 días
            </div>

            {/* Segment bar — composición de quincena */}
            <div style={{ marginTop: 18 }}>
              <SegmentBar
                segments={[
                  { value: repartido.pagoTarjetas, color: FT.accent },
                  { value: repartido.fijos,        color: '#8B6CF0' },
                  { value: libreUsado,             color: FT.warn },
                  { value: libreTotal - libreUsado,color: 'rgba(255,255,255,0.10)' },
                  { value: repartido.ahorro,       color: FT.pos },
                ]}
                height={10}
              />
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8,
                marginTop: 12, fontFamily: FT.sans, fontSize: 10,
              }}>
                {[
                  ['Tarjetas',  money(repartido.pagoTarjetas), FT.accent],
                  ['Fijos',     money(repartido.fijos),        '#8B6CF0'],
                  ['Libre usado', money(libreUsado),           FT.warn],
                  ['Libre',     money(libreTotal - libreUsado),'rgba(255,255,255,0.5)'],
                  ['Ahorro',    money(repartido.ahorro),       FT.pos],
                ].map(([l, v, c]) => (
                  <div key={l}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: FT.textMute, marginBottom: 2 }}>
                      {FIcon.dot(c)}<span>{l}</span>
                    </div>
                    <div style={{
                      fontFamily: FT.mono, color: FT.text, fontSize: 11,
                      fontVariantNumeric: 'tabular-nums', letterSpacing: -0.2,
                    }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── META DE AHORRO ──────────────────────────────────── */}
        <Card pad={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: FT.sans, fontSize: 12, color: FT.textMute, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                Meta · MacBook + colchón
              </div>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{
                  fontFamily: FT.mono, fontSize: 26, fontWeight: 600,
                  color: FT.text, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5,
                }}>${ahorroActual.toLocaleString()}</span>
                <span style={{ fontFamily: FT.sans, fontSize: 13, color: FT.textMute }}>
                  / ${ahorroMeta.toLocaleString()}
                </span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
                fontFamily: FT.sans, fontSize: 12, color: FT.pos,
              }}>
                {FIcon.arrowUp(FT.pos)}
                <span style={{ fontFamily: FT.mono, fontVariantNumeric: 'tabular-nums' }}>+${ahorroDelta.toLocaleString()}</span>
                <span style={{ color: FT.textMute }}>este mes · llegas en sep ’26</span>
              </div>
            </div>
            <Ring size={70} stroke={7} value={ahorroActual / ahorroMeta} color={FT.pos}>
              <div style={{
                fontFamily: FT.mono, fontSize: 14, fontWeight: 600, color: FT.text,
              }}>{Math.round(ahorroActual / ahorroMeta * 100)}%</div>
            </Ring>
          </div>
          <div style={{ margin: '14px -4px 0' }}>
            <Spark data={ahorroHistory} width={328} height={48} color={FT.pos}/>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: FT.sans, fontSize: 10, color: FT.textFade, padding: '0 4px',
          }}>
            <span>jun ’25</span><span>nov ’25</span><span>may ’26</span>
          </div>
        </Card>

        {/* ── TARJETAS ─────────────────────────────────────────── */}
        <div>
          <SectionHeader title="Tarjetas · ciclo actual" action="Ver todas →"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <MiniCard
              issuer="BBVA Azul"
              dot={FT.accent}
              days={26}
              used={3847}
              budget={5000}
              cycleLabel="06 may → 05 jun"
            />
            <MiniCard
              issuer="Liverpool"
              dot="#E94B6A"
              days={12}
              used={1280}
              budget={2200}
              cycleLabel="22 abr → 21 may"
              warn
            />
          </div>
        </div>

        {/* ── PRÓXIMOS PAGOS ───────────────────────────────────── */}
        <div>
          <SectionHeader title="Próximos pagos" action="Calendario →"/>
          <Card pad={0}>
            <PaymentRow label="MacBook"   sub="Mensualidad 9 de 12" date="21 may" amount={1400} chip="Fijos"/>
            <PaymentRow label="Liverpool" sub="Pago mínimo del ciclo" date="21 may" amount={1280} chip="Tarjeta" chipColor="#E94B6A"/>
            <PaymentRow label="Internet"  sub="Telmex"               date="28 may" amount={500}  chip="Fijos"/>
            <PaymentRow label="BBVA"      sub="Pago no generado"     date="25 jun" amount={3847} chip="Tarjeta" chipColor={FT.accent} last muted/>
          </Card>
        </div>

        {/* ── DINERO COMPROMETIDO ─────────────────────────────── */}
        <Card pad={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div>
              <div style={{
                fontFamily: FT.sans, fontSize: 12, color: FT.textMute,
                letterSpacing: 0.6, textTransform: 'uppercase',
              }}>Dinero comprometido</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{
                  fontFamily: FT.mono, fontSize: 24, fontWeight: 600, color: FT.text,
                  fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5,
                }}>$7,027</span>
                <span style={{ fontFamily: FT.sans, fontSize: 12, color: FT.textMute }}>
                  hasta corte
                </span>
              </div>
            </div>
            <Tag color={FT.warn} bg={FT.warnSoft}>4 pagos</Tag>
          </div>
          <BarsH data={[
            { label: 'Tarjetas',       value: 5127, color: FT.accent },
            { label: 'Pagos fijos',    value: 1900, color: '#8B6CF0' },
            { label: 'MSI activos',    value: 580,  color: FT.warn },
          ]}/>
        </Card>

        {/* ── ACTIVIDAD RECIENTE ──────────────────────────────── */}
        <div>
          <SectionHeader title="Movimientos recientes" action="Ver todos →"/>
          <Card pad={0}>
            <TxRow merchant="Uber"        cat="Transporte"   account="BBVA"     amount={-69.60}  date="hoy · 14:22"/>
            <TxRow merchant="Spotify"     cat="Tools/subs"   account="BBVA"     amount={-115}    date="hoy · 09:05"/>
            <TxRow merchant="Bama"        cat="Libre"        account="Débito"   amount={-87.50}  date="ayer · 20:11"/>
            <TxRow merchant="Quincena"    cat="Ingreso"      account="Nu"       amount={+9250}   date="1 may · 06:00" income last/>
          </Card>
        </div>
      </div>

      <TabBar active="home"/>
    </div>
  );
}

// ── Mini tarjeta de tarjeta ─────────────────────────────────────
function MiniCard({ issuer, dot, days, used, budget, cycleLabel, warn }) {
  const pct = used / budget;
  return (
    <Card pad={14}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: 2, background: dot, display: 'inline-block',
            }}/>
            <span style={{ fontFamily: FT.sans, fontSize: 15, fontWeight: 600, color: FT.text }}>
              {issuer}
            </span>
          </div>
          <div style={{ fontFamily: FT.sans, fontSize: 11, color: FT.textMute, marginTop: 2 }}>
            {cycleLabel}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: FT.sans, fontSize: 11, color: warn ? FT.warn : FT.textMute,
          }}>
            {warn ? 'Corte en' : 'Corte en'} <span style={{
              fontFamily: FT.mono, fontWeight: 600,
              color: warn ? FT.warn : FT.text,
            }}>{days} días</span>
          </div>
          <div style={{ fontFamily: FT.sans, fontSize: 11, color: FT.textMute, marginTop: 2 }}>
            Presupuesto {money(budget)}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6,
        }}>
          <span style={{
            fontFamily: FT.mono, fontSize: 18, fontWeight: 600, color: FT.text,
            fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
          }}>${used.toLocaleString()}</span>
          <span style={{ fontFamily: FT.sans, fontSize: 12, color: FT.textMute }}>
            {Math.round(pct * 100)}% usado
          </span>
        </div>
        <ProgressBar pct={pct * 100} color={pct > 0.85 ? FT.danger : pct > 0.7 ? FT.warn : FT.accent} height={5}/>
      </div>
    </Card>
  );
}

// ── Fila de pago próximo ────────────────────────────────────────
function PaymentRow({ label, sub, date, amount, chip, chipColor, last, muted }) {
  return (
    <div style={{
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: last ? 'none' : `1px solid ${FT.hairline}`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: FT.surface2,
        border: `1px solid ${FT.hairline}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{ fontFamily: FT.mono, fontSize: 11, color: FT.textDim, lineHeight: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: FT.textMute, marginBottom: 1 }}>
            {date.split(' ')[1].toUpperCase()}
          </div>
          <div style={{ color: FT.text, fontWeight: 600 }}>{date.split(' ')[0]}</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FT.sans, fontSize: 14, fontWeight: 500, color: muted ? FT.textDim : FT.text }}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Tag color={chipColor || FT.textDim} bg={chipColor ? `${chipColor}22` : 'rgba(255,255,255,0.05)'}>
            {chip}
          </Tag>
          <span style={{ fontFamily: FT.sans, fontSize: 11, color: FT.textMute }}>{sub}</span>
        </div>
      </div>
      <div style={{
        fontFamily: FT.mono, fontSize: 15, fontWeight: 600,
        color: muted ? FT.textDim : FT.text,
        fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
      }}>
        ${amount.toLocaleString()}
      </div>
    </div>
  );
}

// ── Fila de transacción ─────────────────────────────────────────
function TxRow({ merchant, cat, account, amount, date, income, last }) {
  return (
    <div style={{
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: last ? 'none' : `1px solid ${FT.hairline}`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 99,
        background: income ? FT.posSoft : 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FT.sans, fontSize: 13, fontWeight: 600,
        color: income ? FT.pos : FT.textDim,
      }}>{merchant[0]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FT.sans, fontSize: 14, color: FT.text, fontWeight: 500 }}>
          {merchant}
        </div>
        <div style={{ fontFamily: FT.sans, fontSize: 11, color: FT.textMute, marginTop: 1 }}>
          {cat} · {account} · {date}
        </div>
      </div>
      <div style={{
        fontFamily: FT.mono, fontSize: 14, fontWeight: 600,
        color: income ? FT.pos : FT.text,
        fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
      }}>
        {income ? '+' : '−'}${Math.abs(amount).toLocaleString('en-US', {minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2})}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenDashboard });
