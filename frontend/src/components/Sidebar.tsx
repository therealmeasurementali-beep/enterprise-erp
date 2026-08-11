import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Users, Package, FileText, LayoutDashboard, History, UserCircle, Menu, X } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  let user: any = null;
  const userStr = localStorage.getItem('user');
  try {
    if (userStr) user = JSON.parse(userStr);
  } catch (e) {}

  const role = user?.role || '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const NavItem = ({ path, icon: Icon, label }: { path: string, icon: any, label: string }) => {
    const active = isActive(path);
    return (
      <Link 
        to={path} 
        style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          textDecoration: 'none', 
          color: active ? 'white' : 'var(--text-muted)', 
          background: active ? 'var(--primary)' : 'transparent',
          fontWeight: active ? '600' : '500',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          transition: 'all 0.2s',
          marginBottom: '0.5rem'
        }}
        onClick={() => setMobileOpen(false)}
      >
        <Icon size={20} />
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div style={{ display: 'none' }} className="mobile-toggle">
        <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={`sidebar ${mobileOpen ? 'open' : ''}`} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
            <LayoutDashboard size={24} color="white" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', letterSpacing: '0.5px' }}>
            Fundsroom
          </h2>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '1rem', marginTop: '1rem', fontWeight: 600 }}>
            {role} MENU
          </div>
          
          {/* Dashboard is available to all roles */}
          <NavItem path="/dashboard" icon={LayoutDashboard} label={`${role === 'Sales' || role === 'Warehouse' || role === 'Accounts' ? role + ' ' : ''}Dashboard`} />

          {/* CRM / Customers (Admin, Sales, Accounts) */}
          {(role === 'Admin' || role === 'Sales' || role === 'Accounts') && (
             <NavItem path="/customers" icon={Users} label="Customers / CRM" />
          )}

          {/* Inventory / Products (Admin, Warehouse) */}
          {(role === 'Admin' || role === 'Warehouse') && (
            <>
              <NavItem path="/products" icon={Package} label="Inventory & Products" />
              <NavItem path="/inventory/history" icon={History} label="Stock History" />
            </>
          )}

          {/* Sales Challans (Admin, Sales, Accounts) */}
          {(role === 'Admin' || role === 'Sales' || role === 'Accounts') && (
            <NavItem path="/challans" icon={FileText} label="Sales Challans" />
          )}
        </nav>

        {/* User Profile Footer */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }} ref={dropdownRef}>
          <button 
            style={{ 
              width: '100%', 
              background: 'rgba(0,0,0,0.2)', 
              border: '1px solid var(--surface-border)', 
              color: 'var(--text-main)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '0.75rem', 
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onClick={() => setShowProfile(!showProfile)}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
              <UserCircle size={32} color="var(--primary)" />
              <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Account'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{role}</div>
              </div>
            </div>
          </button>

          {showProfile && (
            <div style={{ 
              background: 'var(--bg-color)', 
              border: '1px solid var(--surface-border)', 
              borderRadius: '8px', 
              padding: '0.5rem',
              marginTop: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--surface-border)', marginBottom: '0.5rem' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              <button 
                className="btn btn-danger" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem' }}
                onClick={handleLogout}
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .mobile-toggle {
            display: block !important;
            padding: 1rem;
            background: var(--surface);
            border-bottom: 1px solid var(--surface-border);
          }
          .sidebar {
            display: none !important;
          }
          .sidebar.open {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
