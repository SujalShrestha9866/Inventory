import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import { inventoryApi } from '../../api/endpoints';
import { formatDate } from '../../utils/format';

export default function InventoryLogsPage() {
  const { productId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    inventoryApi.getLogs(productId)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Stock movement log</h1>
          <p>{rows[0]?.product?.product_name || 'Every quantity change recorded for this product.'}</p>
        </div>
        <Link to="/inventory"><Button variant="ghost">← Back to inventory</Button></Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <DataTable
        loading={loading}
        rowKey="log_id"
        rows={rows}
        columns={[
          { key: 'change_type', header: 'Type', render: (r) => (
            <span className={`badge ${r.change_type === 'IN' ? 'badge-active' : 'badge-cancelled'}`}>{r.change_type}</span>
          ) },
          { key: 'change_quantity', header: 'Quantity' },
          { key: 'reason', header: 'Reason' },
          { key: 'reference_type', header: 'Reference' },
          { key: 'created_at', header: 'Date', render: (r) => formatDate(r.created_at) },
        ]}
      />
    </div>
  );
}
