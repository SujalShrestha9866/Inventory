export default function FormField({ label, hint, error, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="hint" style={{ color: 'var(--red-500)' }}>{error}</span>}
    </div>
  );
}
