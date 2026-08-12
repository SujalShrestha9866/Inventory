import CrudPage from '../../components/ui/CrudPage';
import { ActiveBadge } from '../../components/ui/Badge';
import { categoryApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/format';

export default function CategoriesPage() {
  const { user } = useAuth();
  const canWrite = ['Admin', 'Manager'].includes(user?.user_role);
  const canDelete = user?.user_role === 'Admin';

  return (
    <CrudPage
      title="Categories"
      description="Product categories used to organise the catalog."
      idKey="category_id"
      api={{
        list: categoryApi.list,
        create: (payload) => categoryApi.create({ categoryName: payload.categoryName }),
        update: (id, payload) => categoryApi.update(id, { categoryName: payload.categoryName }),
        remove: categoryApi.remove,
      }}
      canCreate={canWrite}
      canEdit={canWrite}
      canDelete={canDelete}
      emptyValues={{ categoryName: '' }}
      fields={[
        { name: 'categoryName', label: 'Category name', required: true, fromRow: (r) => r.category_name },
      ]}
      columns={[
        { key: 'category_name', header: 'Name' },
        { key: 'is_active', header: 'Status', render: (r) => <ActiveBadge active={r.is_active} /> },
        { key: 'updated_at', header: 'Updated', render: (r) => formatDate(r.updated_at) },
      ]}
    />
  );
}
