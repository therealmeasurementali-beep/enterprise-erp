import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import CustomerList from './pages/Customers/CustomerList';
import CustomerDetail from './pages/Customers/CustomerDetail';
import ProductList from './pages/Inventory/ProductList';
import StockMovementHistory from './pages/Inventory/StockMovementHistory';
import ChallanList from './pages/Sales/ChallanList';
import ChallanDetail from './pages/Sales/ChallanDetail';
import ChallanForm from './pages/Sales/ChallanForm';
import Dashboard from './pages/Dashboard/Dashboard';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Role Based Route Guard
const RoleRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const userStr = localStorage.getItem('user');
  let role = '';
  try {
    if (userStr) role = JSON.parse(userStr).role;
  } catch (e) {}

  if (!allowedRoles.includes(role) && role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/customers" element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Sales']}>
              <CustomerList />
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/customers/:id" element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Sales']}>
              <CustomerDetail />
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/products" element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Warehouse']}>
              <ProductList />
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/inventory/history" element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Warehouse']}>
              <StockMovementHistory />
            </RoleRoute>
          </ProtectedRoute>
        } />

        <Route path="/challans" element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Sales', 'Accounts']}>
              <ChallanList />
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/challans/new" element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Sales']}>
              <ChallanForm />
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/challans/:id/edit" element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Sales']}>
              <ChallanForm />
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/challans/:id" element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Sales', 'Accounts']}>
              <ChallanDetail />
            </RoleRoute>
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
