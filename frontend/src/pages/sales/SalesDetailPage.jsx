import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { TypeBadge, StatusBadge } from '../../components/ui/Badge';
import { salesApi, productApi } from '../../api/endpoints';
import { formatMoney, formatDate } from '../../utils/format';

export default function SalesDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [productNames, setProductNames] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    setLoading(true);
    salesApi.get(id)
      .then(setSale)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  // The sale detail endpoint only returns product_id per line item, so we
  // fetch the product list once to resolve readable names.
  useEffect(() => {
    productApi.list()
      .then((list) => setProductNames(Object.fromEntries(list.map((p) => [p.product_id, p.product_name]))))
      .catch(() => {});
  }, []);

  const total = sale?.sale_item?.reduce((sum, it) => sum + Number(it.sales_quantity) * Number(it.sales_price), 0) || 0;

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await salesApi.cancel(id);
      setConfirmCancel(false);
      load();
    } catch (err) {
      setError(err.message);
      setConfirmCancel(false);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="loading-row">Loading…</div>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!sale) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sale detail</h1>
          <p>{formatDate(sale.sales_date)} · {sale.party?.party_name}</p>
        </div>
        <div className="toolbar">
          <Link to="/sales"><Button variant="ghost">← Back</Button></Link>
          {sale.status !== 'CANCELLED' && (
            <Button variant="danger" onClick={() => setConfirmCancel(true)}>Cancel sale</Button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-grid">
          <div>
            <div className="hint">Party</div>
            <div>{sale.party?.party_name}</div>
          </div>
          <div>
            <div className="hint">Sold by</div>
            <div>{sale.staff?.staff_name}</div>
          </div>
          <div>
            <div className="hint">Type</div>
            <div><TypeBadge type={sale.sales_type} /></div>
          </div>
          <div>
            <div className="hint">Status</div>
            <div><StatusBadge status={sale.status || 'ACTIVE'} /></div>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Product</th><th>Quantity</th><th>Unit price</th><th>Line total</th></tr>
          </thead>
          <tbody>
            {sale.sale_item?.map((item) => (
              <tr key={item.sale_item_id}>
                <td>{productNames[item.product_id] || item.product_id}</td>
                <td>{item.sales_quantity}</td>
                <td>{formatMoney(item.sales_price)}</td>
                <td>{formatMoney(Number(item.sales_quantity) * Number(item.sales_price))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="total-line"><span>Total</span><span>{formatMoney(total)}</span></div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this sale?"
        message="Stock will be returned to inventory and, for credit sales, the party's ledger will be reversed."
        confirmLabel="Cancel sale"
        danger
        loading={cancelling}
        onConfirm={handleCancel}
        onClose={() => setConfirmCancel(false)}
      />
    </div>
  );
}
