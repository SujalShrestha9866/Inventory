import { useEffect, useState } from 'react';
import DataTable from '../../components/ui/DataTable';
import FormField from '../../components/ui/FormField';
import { ledgerApi, partyApi } from '../../api/endpoints';
import { formatMoney, formatDate } from '../../utils/format';

export default function LedgerPage() {
  const [parties, setParties] = useState([]);
  const [partyId, setPartyId] = useState('');
  const [rows, setRows] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    partyApi.list().then(setParties).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!partyId) { setRows([]); setBalance(null); return; }
    setLoading(true);
    setError('');
    Promise.all([ledgerApi.getByParty(partyId), ledgerApi.getBalance(partyId)])
      .then(([entries, bal]) => {
        setRows(Array.isArray(entries) ? entries : []);
        setBalance(bal.balance);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [partyId]);

  const selectedParty = parties.find((p) => p.party_id === partyId);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Ledger</h1>
          <p>Running balance of credit sales, credit purchases, and payments per party.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <FormField label="Party">
          <select value={partyId} onChange={(e) => setPartyId(e.target.value)}>
            <option value="">Select a party to view their ledger…</option>
            {parties.map((p) => <option key={p.party_id} value={p.party_id}>{p.party_name}</option>)}
          </select>
        </FormField>
        {selectedParty && balance !== null && (
          <div className="stat-grid" style={{ marginBottom: 0, marginTop: 6 }}>
            <div className="stat-card">
              <div className="label">Current balance</div>
              <div className="value" style={{ color: balance >= 0 ? 'var(--forest-500)' : 'var(--red-500)' }}>
                {formatMoney(balance)}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {partyId && (
        <DataTable
          loading={loading}
          rowKey="ledger_id"
          rows={rows}
          emptyMessage="No ledger entries for this party yet."
          columns={[
            { key: 'created_at', header: 'Date', render: (r) => formatDate(r.created_at) },
            { key: 'transaction_type', header: 'Reference', render: (r) => r.transaction_type || '—'},
            { key: 'credit', header: 'Credit', render: (r) => formatMoney(r.credit) },
            { key: 'debit', header: 'Debit', render: (r) => formatMoney(r.debit) },
            { key: 'balance', header: 'Running balance', render: (r) => formatMoney(r.balance) },
          ]}
        />
      )}
    </div>
  );
}
