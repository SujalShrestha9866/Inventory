import CrudPage from '../../components/ui/CrudPage';
import { ActiveBadge } from '../../components/ui/Badge';
import { staffApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { formatMoney, formatDate, toDateInputValue } from '../../utils/format';

const ROLES = ['Admin', 'Staff'];

export default function StaffPage() {
  const { user } = useAuth();
  const isAdmin = user?.user_role === 'Admin';

  return (
    <CrudPage
      title="Staff"
      description="Employees who can be assigned as sales, purchase, or expense owners."
      idKey="staff_id"
      api={{
        list: staffApi.list,
        // create requires all fields (backend has no partial-create path);
        // update sends only the mutable subset the backend accepts.
        create: (payload) => staffApi.create({
          staffName: payload.staffName,
          staffRoll: payload.staffRoll,
          staffEmail: payload.staffEmail,
          staffContact: payload.staffContact,
          staffSalary: payload.staffSalary,
          staffJoiningdate: payload.staffJoiningdate,
        }),
        update: (id, payload) => staffApi.update(id, {
          staffRole: payload.staffRoll,
          staffEmail: payload.staffEmail,
          staffContact: payload.staffContact,
          staffSalary: payload.staffSalary,
        }),
        remove: staffApi.remove,
      }}
      canCreate={isAdmin}
      canEdit={isAdmin}
      canDelete={isAdmin}
      emptyValues={{ staffName: '', staffRoll: 'Staff', staffEmail: '', staffContact: '', staffSalary: '', staffJoiningdate: '' }}
      fields={[
        { name: 'staffName', label: 'Full name', required: true, readOnlyOnEdit: true, fromRow: (r) => r.staff_name },
        { name: 'staffRoll', label: 'Role', type: 'select', required: true, options: ROLES.map((r) => ({ value: r, label: r })), fromRow: (r) => r.staff_role },
        { name: 'staffEmail', label: 'Email', type: 'email', fromRow: (r) => r.staff_email || '' },
        { name: 'staffContact', label: 'Contact number', required: true, fromRow: (r) => r.staff_contact },
        { name: 'staffSalary', label: 'Salary', type: 'number', required: true, fromRow: (r) => r.staff_salary },
        { name: 'staffJoiningdate', label: 'Joining date', type: 'date', required: true, readOnlyOnEdit: true, fromRow: (r) => toDateInputValue(r.staff_joining_date) },
      ]}
      columns={[
        { key: 'staff_name', header: 'Name' },
        { key: 'staff_role', header: 'Role' },
        { key: 'staff_contact', header: 'Contact' },
        { key: 'staff_salary', header: 'Salary', render: (r) => formatMoney(r.staff_salary) },
        { key: 'staff_joining_date', header: 'Joined', render: (r) => formatDate(r.staff_joining_date) },
        { key: 'is_active', header: 'Status', render: (r) => <ActiveBadge active={r.is_active} /> },
      ]}
    />
  );
}
