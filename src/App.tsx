import { Routes, Route, Navigate } from 'react-router-dom';

// Class Pages
import ClassList from './pages/classes/ClassList';
import ClassDetail from './pages/classes/ClassDetail';

// Booking Pages
import BookingResult from './pages/booking/BookingResult';

// Package Pages
import Packages from './pages/packages/Packages';

// Reservation Pages
import MyReservations from './pages/reservations/MyReservations';

// Admin Pages
import ClassScheduler from './pages/admin/ClassScheduler';
import AdminReservations from './pages/admin/AdminReservations';
import CreditManagement from './pages/admin/CreditManagement';

export default function App() {
  return (
    <Routes>
      <Route
        path='/classes'
        element={<ClassList />}
      />
      <Route
        path='/classes/:classId'
        element={<ClassDetail />}
      />
      <Route
        path='/packages'
        element={<Packages />}
      />
      <Route
        path='/my-reservations'
        element={<MyReservations />}
      />
      <Route
        path='/booking/success'
        element={<BookingResult />}
      />
      <Route
        path='/booking/cancelled'
        element={<BookingResult />}
      />

      {/* Admin routes */}
      <Route
        path='/admin/schedule'
        element={<ClassScheduler />}
      />
      <Route
        path='/admin/reservations'
        element={<AdminReservations />}
      />
      <Route
        path='/admin/credits'
        element={<CreditManagement />}
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
