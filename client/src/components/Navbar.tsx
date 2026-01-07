import { Link } from 'react-router-dom';

interface NavbarProps {
  onLogout: () => void;
}

function Navbar({ onLogout }: NavbarProps) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h1>🐧 Penguin Power Compliance</h1>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/nexus">Determine Nexus</Link></li>
          <li><Link to="/compliance">Compliance Submissions</Link></li>
          <li><Link to="/resources">Resources</Link></li>
        </ul>
        <div className="nav-user">
          <span>Welcome, {user.name || user.email}</span>
          <button className="btn btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
