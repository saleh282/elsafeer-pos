import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ShiftProvider } from './context/ShiftContext';
import PrivateRoute from './components/PrivateRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import OpenShift from './pages/OpenShift';
import Invoice from './pages/Invoice';
import SalesHistory from './pages/SalesHistory';
import Reports from './pages/Reports';
import ShiftClose from './pages/ShiftClose';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ShiftProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/open-shift"
              element={
                <PrivateRoute cashierOnly>
                  <OpenShift />
                </PrivateRoute>
              }
            />
            <Route
              path="/pos"
              element={
                <PrivateRoute cashierOnly>
                  <POS />
                </PrivateRoute>
              }
            />
            <Route
              path="/invoice/:id"
              element={
                <PrivateRoute>
                  <Invoice />
                </PrivateRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <PrivateRoute>
                  <SalesHistory />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              }
            />
            <Route
              path="/close-shift"
              element={
                <PrivateRoute cashierOnly>
                  <ShiftClose />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ShiftProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
