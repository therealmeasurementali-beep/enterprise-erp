const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
let adminToken = '';
let salesToken = '';
let warehouseToken = '';

let customerId = '';
let productA = '';
let productB = '';
let draftChallanId = '';
let atomicTestChallanId = '';

async function login(email, password) {
  const res = await axios.post(`${API_URL}/auth/login`, { email, password });
  return res.data.token;
}

async function runTests() {
  console.log('--- STARTING PHASE 4 CHALLAN TESTS ---');
  try {
    // 1. Auth
    console.log('\n1. Authenticating test users...');
    adminToken = await login('admin@fundsroom.com', 'password123');
    salesToken = await login('sales@fundsroom.com', 'password123');
    warehouseToken = await login('warehouse@fundsroom.com', 'password123');
    console.log('✅ Tokens acquired');

    // 2. Setup Data
    console.log('\n2. Setting up Customer and Products...');
    // Create Customer
    const custRes = await axios.post(`${API_URL}/customers`, {
      name: 'Challan Test Customer', mobile: '9876543210', email: 'challan@test.com',
      businessName: 'Challan Corp', type: 'Wholesale', address: 'Test St', status: 'Active'
    }, { headers: { Authorization: `Bearer ${salesToken}` } });
    customerId = custRes.data.id;

    // Create Products
    const prodARes = await axios.post(`${API_URL}/products`, {
      name: 'Challan Product A', sku: `CPA-${Date.now()}`, category: 'Hardware',
      unitPrice: 100, minStockAlert: 5, location: 'A1'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    productA = prodARes.data.id;

    const prodBRes = await axios.post(`${API_URL}/products`, {
      name: 'Challan Product B', sku: `CPB-${Date.now()}`, category: 'Software',
      unitPrice: 200, minStockAlert: 5, location: 'B1'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    productB = prodBRes.data.id;
    
    // Add stock
    await axios.post(`${API_URL}/stock/movements`, { productId: productA, quantity: 10, type: 'IN' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    await axios.post(`${API_URL}/stock/movements`, { productId: productB, quantity: 2, type: 'IN' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    
    console.log('✅ Setup complete. ProdA stock=10, ProdB stock=2');

    // 3. Draft Creation & Snapshot testing
    console.log('\n3. Testing Draft Creation & Snapshot...');
    const draftRes = await axios.post(`${API_URL}/challans`, {
      customerId,
      items: [
        { productId: productA, quantity: 5 },
        { productId: productB, quantity: 1 }
      ]
    }, { headers: { Authorization: `Bearer ${salesToken}` } });
    draftChallanId = draftRes.data.id;
    
    if (draftRes.data.status !== 'Draft' || draftRes.data.totalQuantity !== 6) {
      throw new Error('Draft creation failed constraints');
    }
    
    const draftCheck = await axios.get(`${API_URL}/challans/${draftChallanId}`, { headers: { Authorization: `Bearer ${salesToken}` } });
    if (draftCheck.data.items[0].productNameSnapshot !== 'Challan Product A') {
      throw new Error('Snapshot failed');
    }
    console.log('✅ Draft created successfully with snapshot');

    // 4. Update Draft
    console.log('\n4. Testing Draft Update...');
    await axios.put(`${API_URL}/challans/${draftChallanId}`, {
      customerId,
      items: [{ productId: productA, quantity: 4 }] // Remove ProdB, change ProdA qty to 4
    }, { headers: { Authorization: `Bearer ${salesToken}` } });
    
    const updatedDraft = await axios.get(`${API_URL}/challans/${draftChallanId}`, { headers: { Authorization: `Bearer ${salesToken}` } });
    if (updatedDraft.data.totalQuantity !== 4 || updatedDraft.data.items.length !== 1) {
       throw new Error('Draft update failed');
    }
    console.log('✅ Draft updated successfully');

    // 5. Successful Confirmation
    console.log('\n5. Testing Successful Confirmation...');
    await axios.post(`${API_URL}/challans/${draftChallanId}/confirm`, {}, { headers: { Authorization: `Bearer ${salesToken}` } });
    
    const confDraft = await axios.get(`${API_URL}/challans/${draftChallanId}`, { headers: { Authorization: `Bearer ${salesToken}` } });
    if (confDraft.data.status !== 'Confirmed') throw new Error('Status not Confirmed');
    
    const pACheck = await axios.get(`${API_URL}/products`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const pAData = pACheck.data.products.find(p => p.id === productA);
    if (pAData.currentStock !== 6) throw new Error(`Stock deduction failed! Expected 6, got ${pAData.currentStock}`);
    
    console.log('✅ Confirmed successfully & stock deducted');

    // 6. Confirmed Cannot Be Edited/Confirmed Again
    try {
      await axios.put(`${API_URL}/challans/${draftChallanId}`, { customerId, items: [{ productId: productA, quantity: 1 }] }, { headers: { Authorization: `Bearer ${salesToken}` } });
      throw new Error('Should not allow edit on Confirmed');
    } catch(err) { if (err.response?.status !== 400) throw err; }
    
    try {
      await axios.post(`${API_URL}/challans/${draftChallanId}/confirm`, {}, { headers: { Authorization: `Bearer ${salesToken}` } });
      throw new Error('Should not allow confirm on Confirmed');
    } catch(err) { if (err.response?.status !== 400) throw err; }
    console.log('✅ Confirmed challan protection works');

    // 7. CRITICAL ATOMIC TRANSACTION
    console.log('\n7. Testing CRITICAL Atomic Transaction...');
    
    // Create new products for a clean test
    const prodXRes = await axios.post(`${API_URL}/products`, {
      name: 'Challan Product X', sku: `CPX-${Date.now()}`, category: 'Hardware',
      unitPrice: 100, minStockAlert: 5, location: 'A2'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    const productX = prodXRes.data.id;

    const prodYRes = await axios.post(`${API_URL}/products`, {
      name: 'Challan Product Y', sku: `CPY-${Date.now()}`, category: 'Software',
      unitPrice: 200, minStockAlert: 5, location: 'B2'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    const productY = prodYRes.data.id;

    // Give X at least 7 stock, Y less than 23 (e.g. 5)
    await axios.post(`${API_URL}/stock/movements`, { productId: productX, quantity: 15, type: 'IN' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    await axios.post(`${API_URL}/stock/movements`, { productId: productY, quantity: 5, type: 'IN' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    
    // Create Challan with X = 7 (valid), Y = 23 (invalid)
    const atomicRes = await axios.post(`${API_URL}/challans`, {
      customerId,
      items: [
        { productId: productX, quantity: 7 }, // Valid (15 >= 7)
        { productId: productY, quantity: 23 } // INVALID (5 < 23)
      ]
    }, { headers: { Authorization: `Bearer ${salesToken}` } });
    atomicTestChallanId = atomicRes.data.id;

    const beforeMovementsCountRes = await axios.get(`${API_URL}/stock/movements`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const movementsCountBefore = beforeMovementsCountRes.data.movements.length;

    try {
      await axios.post(`${API_URL}/challans/${atomicTestChallanId}/confirm`, {}, { headers: { Authorization: `Bearer ${salesToken}` } });
      throw new Error('Atomic transaction allowed insufficient stock!');
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message.includes('Insufficient stock')) {
        console.log('✅ Confirmation correctly rejected due to insufficient stock');
      } else throw err;
    }

    // Verify absolutely nothing changed
    const pXCheck = await axios.get(`${API_URL}/products`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const pXData = pXCheck.data.products.find(p => p.id === productX);
    const pYData = pXCheck.data.products.find(p => p.id === productY);
    
    if (pXData.currentStock !== 15) throw new Error(`ATOMIC FAILURE: ProdX stock changed to ${pXData.currentStock}`);
    if (pYData.currentStock !== 5) throw new Error(`ATOMIC FAILURE: ProdY stock changed to ${pYData.currentStock}`);
    
    const atomicChallanState = await axios.get(`${API_URL}/challans/${atomicTestChallanId}`, { headers: { Authorization: `Bearer ${salesToken}` } });
    if (atomicChallanState.data.status !== 'Draft') throw new Error('ATOMIC FAILURE: Challan status changed!');
    
    const afterMovementsCountRes = await axios.get(`${API_URL}/stock/movements`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const movementsCountAfter = afterMovementsCountRes.data.movements.length;

    if (movementsCountBefore !== movementsCountAfter) {
       throw new Error('ATOMIC FAILURE: Partial stock movement was generated!');
    }

    console.log('✅ ATOMIC ROLLBACK VERIFIED: Product X and Y stocks are unchanged, no partial movements exist, status is Draft');

    // 8. Cancellation
    console.log('\n8. Testing Cancellation...');
    await axios.post(`${API_URL}/challans/${atomicTestChallanId}/cancel`, {}, { headers: { Authorization: `Bearer ${salesToken}` } });
    const cxDraft = await axios.get(`${API_URL}/challans/${atomicTestChallanId}`, { headers: { Authorization: `Bearer ${salesToken}` } });
    if (cxDraft.data.status !== 'Cancelled') throw new Error('Status not Cancelled');
    console.log('✅ Cancellation successful');

    console.log('\n✅ ALL PHASE 4 TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ TEST FAILED:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runTests();
