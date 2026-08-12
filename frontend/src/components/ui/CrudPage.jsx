import { useEffect, useState, useCallback } from 'react';
import DataTable from './DataTable';
import Modal from './Modal';
import Button from './Button';
import FormField from './FormField';
import ConfirmDialog from './ConfirmDialog';
import EmptyState from './EmptyState';

/**
 * Generic list + create/edit modal + soft-delete flow for simple resources
 * (Categories, Products, Staff, Parties, Expenses). Custom, multi-step flows
 * (Sales, Purchases) get their own dedicated pages instead of using this.
 *
 * props:
 *  - title, description
 *  - idKey: primary key field name in each row
 *  - columns: DataTable column config
 *  - fields: [{ name, label, type, required, options, hint, toPayload, fromRow }]
 *  - api: { list, create, update, remove }
 *  - canCreate / canEdit / canDelete: booleans
 *  - emptyValues: default form state for "create"
 */
export default function CrudPage({
  title,
  description,
  idKey,
  columns,
  fields,
  api,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  emptyValues = {},
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyValues);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyValues);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const initial = {};
    fields.forEach((f) => {
      initial[f.name] = f.fromRow ? f.fromRow(row) : row[f.name];
    });
    setForm(initial);
    setFormError('');
    setModalOpen(true);
  };

  const handleChange = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {};
      fields.forEach((f) => {
        payload[f.name] = f.toPayload ? f.toPayload(form[f.name]) : form[f.name];
      });
      if (editing) {
        await api.update(editing[idKey], payload);
      } else {
        await api.create(payload);
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
      await api.remove(deleteTarget[idKey]);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const tableColumns = [
    ...columns,
    ...(canEdit || canDelete
      ? [{
          key: '__actions',
          header: '',
          render: (row) => (
            <div className="row-actions">
              {canEdit && <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>Edit</Button>}
              {canDelete && <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>Deactivate</Button>}
            </div>
          ),
        }]
      : []),
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {canCreate && <Button variant="primary" onClick={openCreate}>+ New</Button>}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState
          title={`No ${title.toLowerCase()} yet`}
          message="Create the first record to get started."
          action={canCreate ? <Button variant="primary" onClick={openCreate}>+ New {title.replace(/s$/, '')}</Button> : null}
        />
      ) : (
        <DataTable columns={tableColumns} rows={rows} rowKey={idKey} loading={loading} />
      )}

      <Modal open={modalOpen} title={editing ? `Edit ${title.replace(/s$/, '')}` : `New ${title.replace(/s$/, '')}`} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          {formError && <div className="error-banner">{formError}</div>}
          {fields.map((f) => (
            <FormField key={f.name} label={f.label} hint={f.hint}>
              {f.type === 'select' ? (
                <select
                  value={form[f.name] ?? ''}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  required={f.required}
                >
                  <option value="" disabled>Select…</option>
                  {(f.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  value={form[f.name] ?? ''}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  required={f.required}
                  rows={3}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  step={f.type === 'number' ? '0.01' : undefined}
                  value={form[f.name] ?? ''}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  required={f.required}
                  disabled={f.readOnlyOnEdit && !!editing}
                  placeholder={f.placeholder}
                />
              )}
            </FormField>
          ))}
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate record?"
        message="This performs a soft delete — the record is marked inactive and hidden from lists, but existing transactions that reference it are preserved."
        confirmLabel="Deactivate"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
