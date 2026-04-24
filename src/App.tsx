import { Routes, Route, Navigate } from 'react-router-dom';

// Class Pages
import ClassList from './pages/classes/ClassList';
import ClassDetail from './pages/classes/ClassDetail';

// Booking Pages
import BookingResult from './pages/booking/BookingResult';

// Package Pages
import Packages from './pages/packages/Packages';

// Account Pages
import Account from './pages/account/Account';

// Admin Pages
import ClassScheduler from './pages/admin/ClassScheduler';
import AdminReservations from './pages/admin/AdminReservations';
import CreditManagement from './pages/admin/CreditManagement';
import Login from './pages/auth/Login';
import { RequireAdmin, RequireAuth } from './components/auth/RouteGuards';

export default function App() {
  return (
    <Routes>
      <Route
        path='/login'
        element={<Login />}
      />

      <Route
        path='/classes'
        element={
          <RequireAuth>
            <ClassList />
          </RequireAuth>
        }
      />
      <Route
        path='/classes/:classId'
        element={
          <RequireAuth>
            <ClassDetail />
          </RequireAuth>
        }
      />
      <Route
        path='/packages'
        element={
          <RequireAuth>
            <Packages />
          </RequireAuth>
        }
      />
      <Route
        path='/my-reservations'
        element={
          <Navigate
            to='/account'
            replace
          />
        }
      />
      <Route
        path='/account'
        element={
          <RequireAuth>
            <Account />
          </RequireAuth>
        }
      />
      <Route
        path='/booking/success'
        element={
          <RequireAuth>
            <BookingResult />
          </RequireAuth>
        }
      />
      <Route
        path='/booking/cancelled'
        element={
          <RequireAuth>
            <BookingResult />
          </RequireAuth>
        }
      />

      {/* Admin routes */}
      <Route
        path='/admin/schedule'
        element={
          <RequireAdmin>
            <ClassScheduler />
          </RequireAdmin>
        }
      />
      <Route
        path='/admin/reservations'
        element={
          <RequireAdmin>
            <AdminReservations />
          </RequireAdmin>
        }
      />
      <Route
        path='/admin/credits'
        element={
          <RequireAdmin>
            <CreditManagement />
          </RequireAdmin>
        }
      />
      <Route
        path='/admin'
        element={
          <Navigate
            to='/admin/schedule'
            replace
          />
        }
      />

      {/* Default redirect */}
      <Route
        path='/'
        element={
          <Navigate
            to='/classes'
            replace
          />
        }
      />

      {/* 404 fallback */}
      <Route
        path='*'
        element={
          <Navigate
            to='/classes'
            replace
          />
        }
      />
    </Routes>
  );
}
