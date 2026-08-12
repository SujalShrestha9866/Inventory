import CrudPage from '../../components/ui/CrudPage';
import { ActiveBadge } from '../../components/ui/Badge';
import { partyApi } from '../../api/endpoints';
import { formatDate } from '../../utils/format';

const ROLES = ['Customer', 'Supplier'];

export default function PartyPage() {
  return (
    <CrudPage
      title="Parties"
      description="Customers and suppliers you sell to, buy from, or exchange payments with."
      idKey="party_id"
      api={{
        list: partyApi.list,
        create: (payload) => partyApi.create({
          partyName: payload.partyName,
          partyAddress: payload.partyAddress,
          partyContact: payload.partyContact,
          partyRole: payload.partyRole,
        }),
        // Role is intentionally left out of edits — the backend's update
        // endpoint has a bug where changing the role errors out (see README).
        update: (id, payload) => partyApi.update(id, {
          partyName: payload.partyName,
          partyAddress: payload.partyAddress,
          partyContact: payload.partyContact,
        }),
        remove: partyApi.remove,
      }}
      emptyValues={{ partyName: '', partyAddress: '', partyContact: '', partyRole: 'Customer' }}
      fields={[
        { name: 'partyName', label: 'Name', required: true, fromRow: (r) => r.party_name },
        { name: 'partyAddress', label: 'Address', required: true, fromRow: (r) => r.party_address },
        { name: 'partyContact', label: 'Contact', required: true, fromRow: (r) => r.party_contact },
        {
          name: 'partyRole',
          label: 'Role',
          type: 'select',
          required: true,
          readOnlyOnEdit: true,
          hint: 'Role can only be set when the party is created.',
          options: ROLES.map((r) => ({ value: r, label: r })),
          fromRow: (r) => r.party_role?.[0]?.role || '',
        },
      ]}
      columns={[
        { key: 'party_name', header: 'Name' },
        { key: 'party_contact', header: 'Contact' },
        { key: 'party_address', header: 'Address' },
        { key: 'role', header: 'Role', render: (r) => r.party_role?.map((pr) => pr.role).join(', ') || '—' },
        { key: 'is_active', header: 'Status', render: (r) => <ActiveBadge active={r.is_active} /> },
        { key: 'updated_at', header: 'Updated', render: (r) => formatDate(r.updated_at) },
      ]}
    />
  );
}
