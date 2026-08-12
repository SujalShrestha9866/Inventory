import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

export default function Topbar({ title }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const initials = (user?.name || 'U')
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="topbar">

            <div className="topbar-left">

                <div className="topbar-page-title">
                    {title}
                </div>

                <span className="topbar-divider">
          /
        </span>

                <span className="topbar-location">
          Business Manager
        </span>

            </div>


            <div className="topbar-right">

                <div className="topbar-status">
                    <span className="status-dot" />
                    System online
                </div>


                <div className="topbar-user">

                    <div className="topbar-avatar">
                        {initials}
                    </div>

                    <div className="topbar-user-info">

                        <strong>
                            {user?.name || 'User'}
                        </strong>

                        <span>
              {user?.user_role || 'Staff'}
            </span>

                    </div>

                </div>


                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="logout-button"
                >
                    Log out
                </Button>

            </div>

        </header>
    );
}