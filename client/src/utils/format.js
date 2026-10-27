export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in the user's local time.
export function toLocalInputValue(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
