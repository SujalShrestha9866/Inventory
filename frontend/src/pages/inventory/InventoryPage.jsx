import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import { inventoryApi } from '../../api/endpoints';
import { formatDate } from '../../utils/format';

export default function InventoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await inventoryApi.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdjust = (row) => {
    setAdjustTarget(row);
    setQty(row.remaining_quantity);
    setReason('');
    setFormError('');
  };

  const submitAdjust = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await inventoryApi.adjust(adjustTarget.product_id, { remainingQuantity: qty, reason });
      setAdjustTarget(null);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>Current stock levels for every product. Adjust to correct counts, write-offs, or damage.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <DataTable
        loading={loading}
        rowKey="inventory_id"
        rows={rows}
        columns={[
          { key: 'product', header: 'Product', render: (r) => r.product?.product_name || '—' },
          { key: 'remaining_quantity', header: 'Remaining qty' },
          { key: 'updated_at', header: 'Last updated', render: (r) => formatDate(r.updated_at) },
          {
            key: '__actions', header: '', render: (r) => (
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => openAdjust(r)}>Adjust</Button>
                <Link to={`/inventory/${r.product_id}/logs`}>
                  <Button size="sm" variant="ghost" type="button">View logs</Button>
                </Link>
              </div>
            ),
          },
        ]}
      />

      <Modal open={!!adjustTarget} title={`Adjust stock — ${adjustTarget?.product?.product_name || ''}`} onClose={() => setAdjustTarget(null)}>
        <form onSubmit={submitAdjust}>
          {formError && <div className="error-banner">{formError}</div>}
          <FormField label="New remaining quantity" hint={`Currently ${adjustTarget?.remaining_quantity ?? 0}`}>
            <input type="number" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} required />
          </FormField>
          <FormField label="Reason" hint="e.g. Stock count, Damage, Write-off">
            <input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </FormField>
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => setAdjustTarget(null)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Save adjustment'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
