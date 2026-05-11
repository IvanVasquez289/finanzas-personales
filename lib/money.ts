export function money(n: number, decimals = 0) {
  const sign = n < 0 ? "−" : "";

  return `${sign}$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
