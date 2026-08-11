import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Users, Package, FileText, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const userStr = localStorage.getItem('user');
  let role = '';
  try {
    if (userStr) role = JSON.parse(userStr).role;
  } catch (e) {}

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="navbar-container" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--surface-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
      <div className="navbar-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: 'var(--primary)', marginRight: '2rem' }}>Fundsroom ERP</h2>
        
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: isActive('/dashboard') ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: isActive('/dashboard') ? '600' : 'normal' }}>
          <LayoutDashboard size={18} /> Dashboard
        </Link>
        
        {(role === 'Admin' || role === 'Sales') && (
          <Link to="/customers" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: isActive('/customers') ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: isActive('/customers') ? '600' : 'normal' }}>
            <Users size={18} /> CRM
          </Link>
        )}
        
        {(role === 'Admin' || role === 'Warehouse') && (
          <Link to="/products" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: isActive('/products') ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: isActive('/products') ? '600' : 'normal' }}>
            <Package size={18} /> Inventory
          </Link>
        )}
        
        {(role === 'Admin' || role === 'Sales' || role === 'Accounts') && (
          <Link to="/challans" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: isActive('/challans') ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: isActive('/challans') ? '600' : 'normal' }}>
            <FileText size={18} /> Sales
          </Link>
        )}
      </div>
      <div>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}
