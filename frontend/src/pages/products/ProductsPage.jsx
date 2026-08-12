import { useEffect, useState, useCallback } from 'react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { ActiveBadge } from '../../components/ui/Badge';
import { productApi, categoryApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../utils/format';

const UNITS = ['pcs', 'kg', 'g', 'litre', 'ml', 'box', 'pack', 'dozen'];

export default function ProductsPage() {
  const { user } = useAuth();
  const canWrite = ['Admin', 'Manager'].includes(user?.user_role);
  const canDelete = user?.user_role === 'Admin';

  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ productName: '', sellingPrice: '', unit: 'pcs', categoryId: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [prod, cat] = await Promise.all([productApi.list(), categoryApi.list()]);
      setRows(Array.isArray(prod) ? prod : []);
      setCategories(Array.isArray(cat) ? cat : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ productName: '', sellingPrice: '', unit: 'pcs', categoryId: categories[0]?.category_id || '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const category = categories.find((c) => c.category_name === row.category_name);
    setForm({
      productName: row.product_name,
      sellingPrice: row.selling_price,
      unit: row.unit,
      categoryId: category?.category_id || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        productName: form.productName,
        sellingPrice: form.sellingPrice,
        unit: form.unit,
        categoryId: form.categoryId,
      };
      if (editing) {
        await productApi.update(editing.product_id, payload);
      } else {
        await productApi.create(payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      // NOTE: the backend's delete endpoint reads the id off req.body.id, not
      // req.params — see the "known backend issues" note in the README.
      await productApi.remove(deleteTarget.product_id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>Sellable items, priced and grouped by category.</p>
        </div>
        {canWrite && <Button variant="primary" onClick={openCreate}>+ New Product</Button>}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <DataTable
        loading={loading}
        rowKey="product_id"
        rows={rows}
        columns={[
          { key: 'product_name', header: 'Product' },
          { key: 'category_name', header: 'Category' },
          { key: 'selling_price', header: 'Price', render: (r) => formatMoney(r.selling_price) },
          { key: 'unit', header: 'Unit' },
          { key: 'remaining_quantity', header: 'In stock', render: (r) => r.remaining_quantity ?? 0 },
          { key: 'is_active', header: 'Status', render: (r) => <ActiveBadge active={r.is_active} /> },
          ...(canWrite || canDelete ? [{
            key: '__actions', header: '', render: (r) => (
              <div className="row-actions">
                {canWrite && <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Edit</Button>}
                {canDelete && <Button size="sm" variant="danger" onClick={() => setDeleteTarget(r)}>Deactivate</Button>}
              </div>
            ),
          }] : []),
        ]}
      />

      <Modal open={modalOpen} title={editing ? 'Edit product' : 'New product'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          {formError && <div className="error-banner">{formError}</div>}
          <FormField label="Product name">
            <input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} required />
          </FormField>
          <div className="form-grid">
            <FormField label="Selling price">
              <input type="number" step="0.01" min="0" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} required />
            </FormField>
            <FormField label="Unit">
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Category">
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
              <option value="" disabled>Select a category…</option>
              {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
          </FormField>
          {editing && (
            <FormField label="Stock on hand" hint="Adjust stock from the Inventory page, not here.">
              <input value={editing.remaining_quantity ?? 0} disabled />
            </FormField>
          )}
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message="This performs a soft delete. Existing sales and purchases referencing this product are preserved."
        confirmLabel="Deactivate"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
