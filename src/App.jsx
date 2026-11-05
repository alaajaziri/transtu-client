import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Trips from './pages/Trips';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Booking from './pages/Booking';
import Confirmation from './pages/Confirmation';
import Reservations from './pages/Reservations';
import ReservationDetail from './pages/ReservationDetail';
import Profile from './pages/Profile';
import DriverHome from './pages/DriverHome';
import DriverTrip from './pages/DriverTrip';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="trips" element={<Trips />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="trips/:id/book" element={<Booking />} />
          <Route path="confirmation/:id" element={<Confirmation />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="reservations/:id" element={<ReservationDetail />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        {/* Interface chauffeur : réservée au rôle "driver" */}
        <Route element={<ProtectedRoute roles={['driver']} />}>
          <Route path="driver" element={<DriverHome />} />
          <Route path="driver/trips/:id" element={<DriverTrip />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
