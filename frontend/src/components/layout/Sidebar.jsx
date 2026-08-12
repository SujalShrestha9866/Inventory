import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { section: 'Overview', links: [{ to: '/', label: 'Dashboard' }] },
  {
    section: 'Catalog',
    links: [
      { to: '/categories', label: 'Categories' },
      { to: '/products', label: 'Products' },
      { to: '/inventory', label: 'Inventory' },
    ],
  },
  {
    section: 'Transactions',
    links: [
      { to: '/sales', label: 'Sales' },
      { to: '/purchase', label: 'Purchases' },
      { to: '/payment', label: 'Payments' },
      { to: '/ledger', label: 'Ledger' },
    ],
  },
  {
    section: 'Operations',
    links: [
      { to: '/expenses', label: 'Expenses' },
      { to: '/staff', label: 'Staff', roles: ['Admin', 'Manager'] },
      { to: '/party', label: 'Parties' },
      { to: '/users', label: 'User accounts', roles: ['Admin'] },
    ],
  },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
      <aside className="sidebar">
        <div className="sidebar-brand">
          ISM <small>v1.0</small>
        </div>
        {NAV.map((group) => (
            <div key={group.section}>
              <div className="nav-section-label">{group.section}</div>
              {group.links.map((link) => {
                const restricted = link.roles && !link.roles.includes(user?.user_role);
                return (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === '/'}
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}${restricted ? ' disabled' : ''}`}
                        onClick={(e) => restricted && e.preventDefault()}
                    >
                      {link.label}
                      {restricted && <span className="tag">restricted</span>}
                    </NavLink>
                );
              })}
            </div>
        ))}
      </aside>
  );
}
