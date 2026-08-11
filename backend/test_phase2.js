const fs = require('fs');

async function testPhase2() {
  const BASE_URL = 'http://localhost:5000/api';

  console.log('--- TESTING PHASE 2 ---');

  // 1. Login as Admin
  console.log('Logging in as Admin...');
  let res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@fundsroom.com', password: 'password123' })
  });
  let data = await res.json();
  const adminToken = data.token;
  if (!adminToken) throw new Error('Failed to get admin token');
  console.log('Admin login successful.');

  // 2. Create customer with invalid email (should fail)
  console.log('Testing invalid email validation...');
  res = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Test Customer', mobile: '1234567890', email: 'invalidemail' })
  });
  data = await res.json();
  if (res.status !== 400 || !data.errors) throw new Error('Validation for invalid email failed');
  console.log('Invalid email validation works.');

  // 3. Create a valid customer
  console.log('Creating a valid customer...');
  res = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'John Doe', mobile: '9876543210', email: 'john@example.com', businessName: 'JD Corp', type: 'Wholesale' })
  });
  const customer = await res.json();
  if (res.status !== 201 || !customer.id) throw new Error('Failed to create customer');
  console.log('Customer created:', customer.id);

  // 4. Get customer list
  console.log('Fetching customer list...');
  res = await fetch(`${BASE_URL}/customers`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  data = await res.json();
  if (!data.customers || data.customers.length === 0) throw new Error('Customer list fetch failed');
  console.log(`Customer list fetched. Total: ${data.pagination.total}`);

  // 5. Update customer
  console.log('Updating customer...');
  res = await fetch(`${BASE_URL}/customers/${customer.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'Active' })
  });
  const updated = await res.json();
  if (updated.status !== 'Active') throw new Error('Failed to update customer');
  console.log('Customer updated to Active.');

  // 6. Add follow-up
  console.log('Adding follow-up...');
  res = await fetch(`${BASE_URL}/customers/${customer.id}/followups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ notes: 'Initial call done', date: new Date().toISOString() })
  });
  const followUp = await res.json();
  if (!followUp.id) throw new Error('Failed to add follow-up');
  console.log('Follow-up added:', followUp.id);

  // 7. Test RBAC: Login as Warehouse
  console.log('Logging in as Warehouse to test RBAC...');
  res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'warehouse@fundsroom.com', password: 'password123' })
  });
  data = await res.json();
  const warehouseToken = data.token;
  
  console.log('Fetching customers as Warehouse (should be 403)...');
  res = await fetch(`${BASE_URL}/customers`, {
    headers: { 'Authorization': `Bearer ${warehouseToken}` }
  });
  if (res.status !== 403) throw new Error(`RBAC failed: Expected 403, got ${res.status}`);
  console.log('RBAC works (Warehouse blocked).');

  console.log('--- ALL BACKEND TESTS PASSED ---');
}

testPhase2().catch(e => {
  console.error('TEST FAILED:', e);
  process.exit(1);
});
