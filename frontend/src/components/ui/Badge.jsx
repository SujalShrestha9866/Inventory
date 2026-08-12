export function ActiveBadge({ active }) {
  return <span className={`badge ${active ? 'badge-active' : 'badge-inactive'}`}>{active ? 'Active' : 'Inactive'}</span>;
}

export function TypeBadge({ type }) {
  const isCredit = String(type).toLowerCase() === 'credit';
  return <span className={`badge ${isCredit ? 'badge-credit' : 'badge-cash'}`}>{type}</span>;
}

export function StatusBadge({ status }) {
  const cancelled = String(status).toUpperCase() === 'CANCELLED';
  return <span className={`badge ${cancelled ? 'badge-cancelled' : 'badge-active'}`}>{status}</span>;
}
