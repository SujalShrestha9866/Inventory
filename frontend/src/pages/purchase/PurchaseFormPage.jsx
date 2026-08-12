import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import { purchaseApi, productApi, partyApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { todayInputValue } from '../../utils/format';

const emptyItem = () => ({ product_id: '', quantity: 1, price: '', expiry_date: '' });

export default function PurchaseFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [parties, setParties] = useState([]);
  const [partyId, setPartyId] = useState('');
  const [purchaseType, setPurchaseType] = useState('Cash');
  const [purchaseDate, setPurchaseDate] = useState(todayInputValue());
  const [items, setItems] = useState([emptyItem()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([productApi.list(), partyApi.list()])
      .then(([p, parties]) => { setProducts(p); setParties(parties); })
      .catch((err) => setError(err.message));
  }, []);

  const updateItem = (idx, patch) => setItems((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const addItem = () => setItems((rows) => [...rows, emptyItem()]);
  const removeItem = (idx) => setItems((rows) => rows.filter((_, i) => i !== idx));

  const total = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.price) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!partyId) { setError('Select a supplier.'); return; }
    if (items.some((it) => !it.product_id || !it.quantity || !it.price)) {
      setError('Every line needs a product, quantity, and price.');
      return;
    }
    setSaving(true);
    try {
      const res = await purchaseApi.create({
        party_id: partyId,
        created_by: user.staff_id,
        purchase_type: purchaseType,
        purchase_date: purchaseDate,
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: Number(it.quantity),
          price: Number(it.price),
          expiry_date: it.expiry_date || undefined,
        })),
      });
      navigate(`/purchase/${res.purchase_id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>New purchase</h1>
          <p>Bring stock in from a supplier, at cost price.</p>
        </div>
        <Link to="/purchase"><Button variant="ghost">← Back to purchases</Button></Link>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}

        <div className="form-grid">
          <FormField label="Supplier">
            <select value={partyId} onChange={(e) => setPartyId(e.target.value)} required>
              <option value="" disabled>Select a party…</option>
              {parties.map((p) => <option key={p.party_id} value={p.party_id}>{p.party_name}</option>)}
            </select>
          </FormField>
          <FormField label="Purchase type">
            <select value={purchaseType} onChange={(e) => setPurchaseType(e.target.value)}>
              <option value="Cash">Cash</option>
              <option value="Credit">Credit</option>
            </select>
          </FormField>
        </div>
        <FormField label="Purchase date">
          <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
        </FormField>

        <h3 style={{ margin: '18px 0 10px', fontSize: '0.95rem' }}>Items</h3>
        {items.map((item, idx) => (
          <div className="item-row" key={idx}>
            <FormField label="Product">
              <select value={item.product_id} onChange={(e) => updateItem(idx, { product_id: e.target.value })} required>
                <option value="" disabled>Select…</option>
                {products.map((p) => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
              </select>
            </FormField>
            <FormField label="Quantity">
              <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: e.target.value })} required />
            </FormField>
            <FormField label="Unit cost">
              <input type="number" min="0.01" step="0.01" value={item.price} onChange={(e) => updateItem(idx, { price: e.target.value })} required />
            </FormField>
            <FormField label="Expiry (optional)">
              <input type="date" value={item.expiry_date} onChange={(e) => updateItem(idx, { expiry_date: e.target.value })} />
            </FormField>
            <Button type="button" variant="danger" size="sm" onClick={() => removeItem(idx)} disabled={items.length === 1}>✕</Button>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={addItem}>+ Add line</Button>

        <div className="total-line">
          <span>Total</span>
          <span>{total.toFixed(2)}</span>
        </div>

        <div className="form-actions">
          <Link to="/purchase"><Button type="button" variant="ghost">Cancel</Button></Link>
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Recording…' : 'Record purchase'}</Button>
        </div>
      </form>
    </div>
  );
}
