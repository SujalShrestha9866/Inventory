import { useEffect, useState, useCallback } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import DataTable from '../../components/ui/DataTable';
import { paymentApi, partyApi, staffApi } from '../../api/endpoints';
import { formatMoney, formatDate, todayInputValue } from '../../utils/format';

const METHODS = ['Cash', 'Bank', 'Cheque', 'Mobile'];

export default function PaymentPage() {
  const [rows, setRows] = useState([]);
  const [parties, setParties] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    party_id: '', staff_id: '', payment_type: 'Received', payment_method: 'Cash',
    amount: '', reference_note: '', payment_date: todayInputValue(),
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pay, party, staffList] = await Promise.all([paymentApi.list(), partyApi.list(), staffApi.list()]);
      setRows(Array.isArray(pay) ? pay : []);
      setParties(party);
      setStaff(staffList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ party_id: '', staff_id: '', payment_type: 'Received', payment_method: 'Cash', amount: '', reference_note: '', payment_date: todayInputValue() });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.party_id && !form.staff_id) {
      setFormError('Choose either a party or a staff member to link this payment to.');
      return;
    }
    setSaving(true);
    try {
      await paymentApi.create({
        party_id: form.party_id || undefined,
        staff_id: form.staff_id || undefined,
        payment_type: form.payment_type,
        payment_method: form.payment_method,
        amount: Number(form.amount),
        reference_note: form.reference_note,
        payment_date: form.payment_date,
      });
      setModalOpen(false);
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
          <h1>Payments</h1>
          <p>Cash and bank movements — money received from parties or paid out to staff/suppliers.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ New Payment</Button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <DataTable
        loading={loading}
        rowKey="payment_id"
        rows={rows}
        columns={[
          { key: 'payment_date', header: 'Date', render: (r) => formatDate(r.payment_date) },
          { key: 'party', header: 'Party', render: (r) => r.party?.party_name || '—' },
          { key: 'staff', header: 'Staff', render: (r) => r.staff?.staff_name || '—' },
          { key: 'payment_type', header: 'Type', render: (r) => (
            <span className={`badge ${r.payment_type === 'Received' ? 'badge-active' : 'badge-credit'}`}>{r.payment_type}</span>
          ) },
          { key: 'payment_method', header: 'Method' },
          { key: 'amount', header: 'Amount', render: (r) => formatMoney(r.amount) },
          { key: 'reference_note', header: 'Note' },
        ]}
      />

      <Modal open={modalOpen} title="New payment" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          {formError && <div className="error-banner">{formError}</div>}
          <div className="form-grid">
            <FormField label="Party (optional)">
              <select value={form.party_id} onChange={(e) => setForm({ ...form, party_id: e.target.value })}>
                <option value="">— none —</option>
                {parties.map((p) => <option key={p.party_id} value={p.party_id}>{p.party_name}</option>)}
              </select>
            </FormField>
            <FormField label="Staff (optional)">
              <select value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })}>
                <option value="">— none —</option>
                {staff.map((s) => <option key={s.staff_id} value={s.staff_id}>{s.staff_name}</option>)}
              </select>
            </FormField>
          </div>
          <div className="form-grid">
            <FormField label="Payment type">
              <select value={form.payment_type} onChange={(e) => setForm({ ...form, payment_type: e.target.value })}>
                <option value="Received">Received</option>
                <option value="Paid">Paid</option>
              </select>
            </FormField>
            <FormField label="Method">
              <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </FormField>
          </div>
          <div className="form-grid">
            <FormField label="Amount">
              <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </FormField>
            <FormField label="Date">
              <input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} required />
            </FormField>
          </div>
          <FormField label="Note">
            <input value={form.reference_note} onChange={(e) => setForm({ ...form, reference_note: e.target.value })} placeholder="e.g. Invoice #204 settlement" />
          </FormField>
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Record payment'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
