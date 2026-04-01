import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/login/Login';
import Dashboard from './pages/dashboard/Dashboard';
import CompanyList from './pages/companies/CompanyList';
import AppointmentsCalendar from './pages/appointments/AppointmentsCalendar';
import ChatIA from './pages/chat/ChatIA';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('gowin_auth') === '1',
  );

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout onLogout={() => { sessionStorage.removeItem('gowin_auth'); setIsAuthenticated(false); }} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/companies" element={<CompanyList />} />
          <Route path="/appointments" element={<AppointmentsCalendar />} />
          <Route path="/chat" element={<ChatIA />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
