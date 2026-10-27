import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants';
import { capitalize } from '../utils/format';

const LINKS = {
  [ROLES.ORGANIZER]: [
    { to: '/organizer', label: 'Debates', end: true },
    { to: '/organizer/motions', label: 'Motions' },
  ],
  [ROLES.JUDGE]: [{ to: '/judge', label: 'My debates', end: true }],
  [ROLES.PARTICIPANT]: [
    { to: '/participant', label: 'My debates', end: true },
    { to: '/participant/profile', label: 'My profile' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to={`/${user.role}`} className="brand">
          Debate Judge
        </Link>
        <nav className="nav-links">
          {(LINKS[user.role] || []).map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-user">
          <span className="nav-name">
            {user.name} <span className="muted">({capitalize(user.role)})</span>
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
