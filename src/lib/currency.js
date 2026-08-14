// Currency — suppliers quote in USD; Saudi buyers pay in SAR. The Riyal is pegged
// to the US Dollar at a fixed 3.75 (SAMA peg since 1986), so USD⇄SAR is exact and
// stable — no FX feed needed. Invoices are stored in the supplier's currency (USD);
// the buyer sees SAR (primary) with the USD original as a reference, and is charged
// the SAR amount.
export const SAR_PER_USD = 3.75;

export function toSAR(amount, currency) {
  const n = Number(amount) || 0;
  return String(currency || 'SAR').toUpperCase() === 'USD' ? Math.round(n * SAR_PER_USD * 100) / 100 : n;
}

export const fmtMoney = (n, cur) =>
  `${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur || 'SAR'}`;
