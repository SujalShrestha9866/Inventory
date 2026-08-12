import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { TypeBadge } from '../../components/ui/Badge';
import { purchaseApi } from '../../api/endpoints';
import { formatMoney, formatDate } from '../../utils/format';

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    purchaseApi.get(id)
      .then(setPurchase)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-row">Loading…</div>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!purchase) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Purchase detail</h1>
          <p>{formatDate(purchase.purchase_date)} · {purchase.party?.party_name}</p>
        </div>
        <Link to="/purchase"><Button variant="ghost">← Back</Button></Link>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-grid">
          <div>
            <div className="hint">Supplier</div>
            <div>{purchase.party?.party_name}</div>
            <div className="hint" style={{ marginTop: 6 }}>{purchase.party?.party_address}</div>
          </div>
          <div>
            <div className="hint">Recorded by</div>
            <div>{purchase.staff?.staff_name}</div>
          </div>
          <div>
            <div className="hint">Type</div>
            <div><TypeBadge type={purchase.purchase_type} /></div>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Product</th><th>Quantity</th><th>Unit cost</th><th>Expiry</th><th>Line total</th></tr>
          </thead>
          <tbody>
            {purchase.items?.map((item) => (
              <tr key={item.purchase_item_id}>
                <td>{item.product?.product_name}</td>
                <td>{item.product_quantity} {item.product?.unit}</td>
                <td>{formatMoney(item.purchase_price)}</td>
                <td>{item.expiry_date ? formatDate(item.expiry_date) : '—'}</td>
                <td>{formatMoney(Number(item.product_quantity) * Number(item.purchase_price))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="total-line"><span>Total</span><span>{formatMoney(purchase.total_amount)}</span></div>
    </div>
  );
}
