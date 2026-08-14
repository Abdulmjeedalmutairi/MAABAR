// Maabar contact — WhatsApp is the human channel for the managed-order concierge.
// The trader taps a button that opens WhatsApp with the order ref pre-filled; the
// admin gets the trader's number as a wa.me link to reach out.
export const MAABAR_WHATSAPP = '966554064679';   // Maabar Business (Saudi, intl format)

const intl = (phone) => {
  const d = String(phone || '').replace(/[^\d]/g, '');
  if (!d) return '';
  if (d.startsWith('966')) return d;
  if (d.startsWith('0')) return '966' + d.slice(1);     // 05xxxxxxxx → 9665xxxxxxxx
  if (d.length === 9 && d.startsWith('5')) return '966' + d;  // 5xxxxxxxx
  return d;
};

// Link to message MAABAR (trader → concierge).
export function waLink(text) {
  return `https://wa.me/${MAABAR_WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

// Link to message a given number (admin → trader). Returns '' for an empty number.
export function waTo(phone, text) {
  const n = intl(phone);
  return n ? `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}` : '';
}
