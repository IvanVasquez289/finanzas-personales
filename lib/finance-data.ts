export const financeSnapshot = {
  user: {
    name: "Iván",
    initials: "IL",
  },
  income: {
    amount: 9250,
    periodLabel: "Quincena · 1 — 15 may",
    receivedAt: "2026-05-01",
  },
  allocation: {
    pagoTarjetas: 2500,
    ahorro: 2500,
    fijos: 1000,
    libre: 3250,
  },
  goals: {
    ahorro: {
      name: "Meta · MacBook + colchón",
      currentAmount: 11000,
      targetAmount: 48000,
      monthlyDelta: 5500,
      history: [3500, 4200, 4800, 5100, 5300, 5500, 6200, 7400, 8200, 9100, 10100, 11000],
    },
  },
  envelopes: [
    {
      name: "Ahorro",
      balance: 11000,
      color: "#3DD68C",
      note: "No tocar · meta MacBook",
      goal: 48000,
      locked: true,
    },
    {
      name: "Pago tarjetas",
      balance: 5127,
      color: "#2A5BFF",
      note: "Reservado para BBVA + Liverpool",
    },
    {
      name: "Fijos",
      balance: 1900,
      color: "#8B6CF0",
      note: "MacBook 21 may · Internet 28 may",
    },
    {
      name: "Libre",
      balance: 1820,
      color: "#F5B544",
      note: "Gastos variables · 9 días restantes",
    },
  ],
  bankAccounts: [
    { name: "BBVA Débito", balance: 8847, sub: "•••• 2103" },
    { name: "Nu Débito", balance: 0, sub: "•••• 8814" },
  ],
  creditCards: [
    {
      issuer: "BBVA Azul",
      dot: "#2A5BFF",
      daysToClose: 26,
      used: 3847.2,
      budget: 5000,
      limit: 28000,
      cycleLabel: "06 may → 05 jun",
      paymentDue: "25 jun",
    },
    {
      issuer: "Liverpool",
      dot: "#E94B6A",
      daysToClose: 12,
      used: 1280,
      budget: 2200,
      limit: 9000,
      cycleLabel: "22 abr → 21 may",
      paymentDue: "21 may",
    },
  ],
  payments: [
    { label: "MacBook", sub: "Mensualidad 9 de 12", date: "21 may", amount: 1400, chip: "Fijos" },
    { label: "Liverpool", sub: "Pago mínimo del ciclo", date: "21 may", amount: 1280, chip: "Tarjeta", chipColor: "#E94B6A" },
    { label: "Internet", sub: "Telmex", date: "28 may", amount: 500, chip: "Fijos" },
    { label: "BBVA", sub: "Pago no generado", date: "25 jun", amount: 3847, chip: "Tarjeta", chipColor: "#2A5BFF", muted: true },
  ],
  transactions: [
    { merchant: "Uber", cat: "Transporte", account: "BBVA", amount: -69.6, date: "hoy · 14:22" },
    { merchant: "Spotify", cat: "Tools/subs", account: "BBVA", amount: -115, date: "hoy · 09:05" },
    { merchant: "Bama", cat: "Libre", account: "Débito", amount: -87.5, date: "ayer · 20:11" },
    { merchant: "Quincena", cat: "Ingreso", account: "Nu", amount: 9250, date: "1 may · 06:00", income: true },
  ],
};
