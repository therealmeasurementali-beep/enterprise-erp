import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { Search, Plus, Package, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

export default function ProductList() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({ name: '', sku: '', category: '', unitPrice: '', minStockAlertQuantity: '10', location: '' });
  
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState({ quantity: '1', type: 'IN', reason: '' });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products?search=${search}`);
      setProducts(res.data.products);
      setError('');
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('You do not have permission to view inventory.');
      } else {
        setError(err.response?.data?.message || 'Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Product Actions
  const openAddModal = () => {
    setEditingId(null);
    setProductForm({ name: '', sku: '', category: '', unitPrice: '', minStockAlertQuantity: '10', location: '' });
    setShowProductModal(true);
  };

  const location = useLocation();
  useEffect(() => {
    if ((location.state as any)?.openNew) {
      openAddModal();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const openEditModal = (p: any) => {
    setEditingId(p.id);
    setProductForm({
      name: p.name, sku: p.sku, category: p.category || '', unitPrice: String(p.unitPrice),
      minStockAlertQuantity: String(p.minStockAlertQuantity), location: p.location || ''
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...productForm, unitPrice: parseFloat(productForm.unitPrice), minStockAlertQuantity: parseInt(productForm.minStockAlertQuantity, 10) };
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setShowProductModal(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  // Stock Movement Actions
  const openStockModal = (p: any) => {
    setSelectedProductId(p.id);
    setStockForm({ quantity: '1', type: 'IN', reason: '' });
    setShowStockModal(true);
  };

  const handleRecordStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/stock/movements', {
        productId: selectedProductId,
        quantity: parseInt(stockForm.quantity, 10),
        type: stockForm.type,
        reason: stockForm.reason
      });
      setShowStockModal(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record stock movement');
    }
  };

  return (
    <>

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>Inventory</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage products and stock movements</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/inventory/history" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <Clock size={16} /> View History
            </Link>
            <button className="btn" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search by product name, SKU, or category..." 
              style={{ paddingLeft: '3rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
        ) : loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading inventory...</div>
        ) : products.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No products found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Get started by adding your first product.</p>
          </div>
        ) : (
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '1rem' }}>Product Details</th>
                  <th style={{ padding: '1rem' }}>Pricing</th>
                  <th style={{ padding: '1rem' }}>Stock Level</th>
                  <th style={{ padding: '1rem' }}>Location</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const isLowStock = p.currentStock <= p.minStockAlertQuantity;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600' }}>{p.name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>SKU: {p.sku} {p.category && `| ${p.category}`}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>₹{p.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '600', fontSize: '1.125rem' }}>{p.currentStock}</span>
                          {isLowStock && <span className="badge badge-inactive" title="Low stock alert"><AlertTriangle size={12} style={{marginRight:'0.2rem'}}/>Low</span>}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.location || 'Unassigned'}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => openEditModal(p)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Edit</button>
                          <button onClick={() => openStockModal(p)} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}><TrendingUp size={14}/> Stock IN/OUT</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Product Modal */}
        {showProductModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-card" style={{ width: '500px', padding: '2rem', background: 'var(--bg-color)' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <form onSubmit={handleSaveProduct}>
                <div className="input-group">
                  <label>Product Name *</label>
                  <input className="input-field" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>SKU *</label>
                    <input className="input-field" required value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} disabled={!!editingId} />
                  </div>
                  <div className="input-group">
                    <label>Category</label>
                    <input className="input-field" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Unit Price *</label>
                    <input type="number" step="0.01" className="input-field" required value={productForm.unitPrice} onChange={e => setProductForm({...productForm, unitPrice: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Min Alert Quantity</label>
                    <input type="number" className="input-field" required value={productForm.minStockAlertQuantity} onChange={e => setProductForm({...productForm, minStockAlertQuantity: e.target.value})} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Warehouse Location</label>
                  <input className="input-field" value={productForm.location} onChange={e => setProductForm({...productForm, location: e.target.value})} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowProductModal(false)}>Cancel</button>
                  <button type="submit" className="btn" style={{ flex: 1 }}>Save Product</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stock Movement Modal */}
        {showStockModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-card" style={{ width: '400px', padding: '2rem', background: 'var(--bg-color)' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Record Stock Movement</h3>
              <form onSubmit={handleRecordStock}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Type *</label>
                    <select className="input-field" value={stockForm.type} onChange={e => setStockForm({...stockForm, type: e.target.value})}>
                      <option value="IN">IN (Add Stock)</option>
                      <option value="OUT">OUT (Remove Stock)</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Quantity *</label>
                    <input type="number" min="1" className="input-field" required value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Reason (Optional)</label>
                  <input className="input-field" value={stockForm.reason} onChange={e => setStockForm({...stockForm, reason: e.target.value})} placeholder="e.g. Restock, Damage, Correction" />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowStockModal(false)}>Cancel</button>
                  <button type="submit" className="btn" style={{ flex: 1, backgroundColor: stockForm.type === 'IN' ? 'var(--success)' : 'var(--danger)' }}>Confirm {stockForm.type}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
