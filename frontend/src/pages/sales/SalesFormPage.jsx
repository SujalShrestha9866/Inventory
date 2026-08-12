import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import { salesApi, productApi, partyApi } from '../../api/endpoints';
import { todayInputValue } from '../../utils/format';

const emptyItem = () => ({ product_id: '', quantity: 1, price: '' });

export default function SalesFormPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [parties, setParties] = useState([]);
  const [partyID, setPartyID] = useState('');
  const [salesType, setSalesType] = useState('Cash');
  const [salesDate, setSalesDate] = useState(todayInputValue());
  const [items, setItems] = useState([emptyItem()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([productApi.list(), partyApi.list()])
      .then(([p, parties]) => { setProducts(p); setParties(parties); })
      .catch((err) => setError(err.message));
  }, []);

  const updateItem = (idx, patch) => {
    setItems((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const onProductChange = (idx, productId) => {
    const product = products.find((p) => p.product_id === productId);
    updateItem(idx, { product_id: productId, price: product ? product.selling_price : '' });
  };

  const addItem = () => setItems((rows) => [...rows, emptyItem()]);
  const removeItem = (idx) => setItems((rows) => rows.filter((_, i) => i !== idx));

  const total = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.price) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!partyID) { setError('Select a party.'); return; }
    if (items.some((it) => !it.product_id || !it.quantity || it.price === '')) {
      setError('Every line needs a product, quantity, and price.');
      return;
    }
    setSaving(true);
    try {
      const res = await salesApi.create({
        partyID,
        sales_type: salesType,
        sales_date: salesDate,
        items: items.map((it) => ({ product_id: it.product_id, quantity: Number(it.quantity), price: Number(it.price) })),
      });
      navigate(`/sales/${res.sale_id}`);
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
          <h1>New sale</h1>
          <p>Record items sold, priced at the moment of sale.</p>
        </div>
        <Link to="/sales"><Button variant="ghost">← Back to sales</Button></Link>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}

        <div className="form-grid">
          <FormField label="Party">
            <select value={partyID} onChange={(e) => setPartyID(e.target.value)} required>
              <option value="" disabled>Select a party…</option>
              {parties.map((p) => <option key={p.party_id} value={p.party_id}>{p.party_name}</option>)}
            </select>
          </FormField>
          <FormField label="Sale type">
            <select value={salesType} onChange={(e) => setSalesType(e.target.value)}>
              <option value="Cash">Cash</option>
              <option value="Credit">Credit</option>
            </select>
          </FormField>
        </div>
        <FormField label="Sale date">
          <input type="date" value={salesDate} onChange={(e) => setSalesDate(e.target.value)} required />
        </FormField>

        <h3 style={{ margin: '18px 0 10px', fontSize: '0.95rem' }}>Items</h3>
        {items.map((item, idx) => (
          <div className="item-row" key={idx}>
            <FormField label="Product">
              <select value={item.product_id} onChange={(e) => onProductChange(idx, e.target.value)} required>
                <option value="" disabled>Select…</option>
                {products.map((p) => <option key={p.product_id} value={p.product_id}>{p.product_name} ({p.remaining_quantity ?? 0} in stock)</option>)}
              </select>
            </FormField>
            <FormField label="Quantity">
              <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: e.target.value })} required />
            </FormField>
            <FormField label="Unit price">
              <input type="number" min="0" step="0.01" value={item.price} onChange={(e) => updateItem(idx, { price: e.target.value })} required />
            </FormField>
            <FormField label="Line total">
              <input value={((Number(item.quantity) || 0) * (Number(item.price) || 0)).toFixed(2)} disabled />
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
          <Link to="/sales"><Button type="button" variant="ghost">Cancel</Button></Link>
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Recording…' : 'Record sale'}</Button>
        </div>
      </form>
    </div>
  );
}
