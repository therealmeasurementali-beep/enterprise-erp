const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let adminToken = '';
let warehouseToken = '';
let salesToken = '';

let productId = '';

async function runTests() {
  console.log('--- STARTING PHASE 3 INVENTORY TESTS ---');
  try {
    // 1. Get Tokens
    console.log('1. Authenticating test users...');
    const adminRes = await axios.post(`${API_URL}/auth/login`, { email: 'admin@fundsroom.com', password: 'password123' });
    adminToken = adminRes.data.token;
    
    const warehouseRes = await axios.post(`${API_URL}/auth/login`, { email: 'warehouse@fundsroom.com', password: 'password123' });
    warehouseToken = warehouseRes.data.token;
    
    const salesRes = await axios.post(`${API_URL}/auth/login`, { email: 'sales@fundsroom.com', password: 'password123' });
    salesToken = salesRes.data.token;
    console.log('✅ Tokens acquired');

    // 2. Product Tests
    console.log('\n2. Testing Product APIs');
    const createRes = await axios.post(`${API_URL}/products`, {
      name: 'Test Product ' + Date.now(),
      sku: 'SKU-' + Date.now(),
      category: 'Electronics',
      unitPrice: 500,
      currentStock: 10,
      minStockAlertQuantity: 5,
      location: 'A1'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    productId = createRes.data.id;
    console.log('✅ Create product successful (Admin)');

    const listRes = await axios.get(`${API_URL}/products`, { headers: { Authorization: `Bearer ${warehouseToken}` } });
    if (!listRes.data.products || listRes.data.products.length === 0) throw new Error('Product list empty');
    console.log('✅ Get product list successful (Warehouse)');

    // 3. Stock Movement Tests
    console.log('\n3. Testing Stock Movements & Validation');
    
    // IN movement
    const inRes = await axios.post(`${API_URL}/stock/movements`, {
      productId,
      quantity: 5,
      type: 'IN',
      reason: 'Restock'
    }, { headers: { Authorization: `Bearer ${warehouseToken}` } });
    if (inRes.data.currentStock !== 15) throw new Error('Stock IN did not increment correctly');
    console.log('✅ IN movement successful & stock increased');

    // OUT movement
    const outRes = await axios.post(`${API_URL}/stock/movements`, {
      productId,
      quantity: 3,
      type: 'OUT',
      reason: 'Damage'
    }, { headers: { Authorization: `Bearer ${warehouseToken}` } });
    if (outRes.data.currentStock !== 12) throw new Error('Stock OUT did not decrement correctly');
    console.log('✅ OUT movement successful & stock decreased');

    // OUT movement > current stock
    const beforeCountRes = await axios.get(`${API_URL}/stock/movements`, { headers: { Authorization: `Bearer ${warehouseToken}` } });
    const countBefore = beforeCountRes.data.movements.length;

    try {
      await axios.post(`${API_URL}/stock/movements`, {
        productId,
        quantity: 100, // exceeds 12
        type: 'OUT',
        reason: 'Large sale'
      }, { headers: { Authorization: `Bearer ${warehouseToken}` } });
      throw new Error('Should have rejected exceeding OUT movement');
    } catch (err) {
      if (err.response?.status === 400) console.log('✅ Correctly rejected OUT movement > current stock');
      else throw err;
    }

    const afterCountRes = await axios.get(`${API_URL}/stock/movements`, { headers: { Authorization: `Bearer ${warehouseToken}` } });
    const countAfter = afterCountRes.data.movements.length;
    
    if (countBefore !== countAfter) {
      throw new Error('Transaction leak! A record was created for a rejected movement.');
    }
    console.log('✅ Verified that rejected OUT movement did NOT create a database record.');

    // Negative quantity check
    try {
      await axios.post(`${API_URL}/stock/movements`, {
        productId,
        quantity: -5,
        type: 'IN'
      }, { headers: { Authorization: `Bearer ${warehouseToken}` } });
      throw new Error('Should have rejected negative quantity');
    } catch (err) {
      if (err.response?.status === 400) console.log('✅ Correctly rejected negative quantity');
      else throw err;
    }

    // Low stock
    const lowStockRes = await axios.get(`${API_URL}/stock/low-stock`, { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('✅ Low stock fetched successfully');

    // 4. RBAC Tests
    console.log('\n4. Testing RBAC');
    try {
      await axios.get(`${API_URL}/products`, { headers: { Authorization: `Bearer ${salesToken}` } });
      throw new Error('Sales should not access inventory in Phase 3');
    } catch (err) {
      if (err.response?.status === 403) console.log('✅ Sales role correctly blocked from Inventory API');
      else throw err;
    }

    // 5. Cleanup
    await axios.delete(`${API_URL}/products/${productId}`, { headers: { Authorization: `Bearer ${adminToken}` } }).catch(() => console.log('✅ Cannot delete product with movements (Expected constraint)'));

    console.log('\n✅ ALL PHASE 3 TESTS PASSED');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

runTests();
