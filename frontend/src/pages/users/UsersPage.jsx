import { useEffect, useState, useCallback } from 'react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { ActiveBadge } from '../../components/ui/Badge';
import { usersApi, staffApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/format';

const ROLES = ['Admin', 'Staff'];

export default function UsersPage() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ staffId: '', username: '', email: '', password: '', userRole: 'Staff' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [userList, staffList] = await Promise.all([usersApi.list(), staffApi.list()]);
      setRows(Array.isArray(userList) ? userList : []);
      setStaff(Array.isArray(staffList) ? staffList : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Staff who don't already have a login — that's who a new account can be created for.
  const staffWithoutAccount = staff.filter(
    (s) => !rows.some((r) => r.staff?.staff_id === s.staff_id)
  );

  const openCreate = () => {
    setForm({ staffId: staffWithoutAccount[0]?.staff_id || '', username: '', email: '', password: '', userRole: 'Staff' });
    setFormError('');
    setModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.staffId) { setFormError('Choose a staff member.'); return; }
    setSaving(true);
    try {
      await usersApi.create(form);
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = async (row, userRole) => {
    try {
      await usersApi.update(row.system_user_id, { userRole });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetting(true);
    try {
      await usersApi.update(resetTarget.system_user_id, { password: resetPassword });
      setResetTarget(null);
      setResetPassword('');
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetting(false);
    }
  };

  const confirmDeactivate = async () => {
    setDeactivating(true);
    try {
      await usersApi.remove(deactivateTarget.system_user_id);
      setDeactivateTarget(null);
      await load();
    } catch (err) {
      setError(err.message);
      setDeactivateTarget(null);
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>User accounts</h1>
          <p>Logins for staff members. Only Admins can see this page or create accounts.</p>
        </div>
        <Button variant="primary" onClick={openCreate} disabled={staffWithoutAccount.length === 0}>+ New Account</Button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {staffWithoutAccount.length === 0 && !loading && (
        <div className="error-banner" style={{ background: 'var(--paper-inset)', borderColor: 'var(--rule)', color: 'var(--ink-700)' }}>
          Every staff member already has a login. Add a new staff record first if you need another account.
        </div>
      )}

      <DataTable
        loading={loading}
        rowKey="system_user_id"
        rows={rows}
        columns={[
          { key: 'system_user_name', header: 'Username' },
          { key: 'staff', header: 'Staff member', render: (r) => r.staff?.staff_name || '—' },
          { key: 'system_user_email', header: 'Email', render: (r) => r.system_user_email || '—' },
          {
            key: 'user_role', header: 'Role', render: (r) => (
              <select
                value={r.user_role}
                onChange={(e) => toggleRole(r, e.target.value)}
                disabled={r.system_user_id === me.user_id}
                style={{ background: 'transparent', border: '1px solid var(--rule)', borderRadius: 4, padding: '3px 6px' }}
              >
                {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            ),
          },
          { key: 'is_active', header: 'Status', render: (r) => <ActiveBadge active={r.is_active} /> },
          { key: 'created_at', header: 'Created', render: (r) => formatDate(r.created_at) },
          {
            key: '__actions', header: '', render: (r) => (
              <div className="row-actions">
                <Button size="sm" variant="ghost" onClick={() => { setResetTarget(r); setResetPassword(''); setResetError(''); }}>Reset password</Button>
                {r.system_user_id !== me.user_id && (
                  <Button size="sm" variant="danger" onClick={() => setDeactivateTarget(r)}>Deactivate</Button>
                )}
              </div>
            ),
          },
        ]}
      />

      <Modal open={modalOpen} title="New user account" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate}>
          {formError && <div className="error-banner">{formError}</div>}
          <FormField label="Staff member" hint="Only staff without an existing login are listed.">
            <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} required>
              <option value="" disabled>Select…</option>
              {staffWithoutAccount.map((s) => <option key={s.staff_id} value={s.staff_id}>{s.staff_name}</option>)}
            </select>
          </FormField>
          <FormField label="Username">
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </FormField>
          <FormField label="Email (optional)">
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <div className="form-grid">
            <FormField label="Temporary password" hint="At least 8 characters.">
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
            </FormField>
            <FormField label="Role">
              <select value={form.userRole} onChange={(e) => setForm({ ...form, userRole: e.target.value })} required>
                {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </FormField>
          </div>
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Creating…' : 'Create account'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!resetTarget} title={`Reset password — ${resetTarget?.system_user_name || ''}`} onClose={() => setResetTarget(null)}>
        <form onSubmit={submitReset}>
          {resetError && <div className="error-banner">{resetError}</div>}
          <FormField label="New password" hint="At least 8 characters. Share it with them securely.">
            <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} minLength={8} required autoFocus />
          </FormField>
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={resetting}>{resetting ? 'Saving…' : 'Reset password'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate this account?"
        message="They'll no longer be able to log in. This doesn't affect their staff record or past transactions."
        confirmLabel="Deactivate"
        danger
        loading={deactivating}
        onConfirm={confirmDeactivate}
        onClose={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
