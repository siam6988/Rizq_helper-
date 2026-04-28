import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PTCProvider } from './context/PTCContext';
import { VpnBlocker } from './components/VpnBlocker';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PtcEngineModal } from './components/PtcEngineModal';

import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Earn } from './pages/Earn';
import { Withdraw } from './pages/Withdraw';
import { Profile } from './pages/Profile';
import { Refer } from './pages/Refer';
import { Leaderboard } from './pages/Leaderboard';
import { Advertiser } from './pages/Advertiser';
import { Offerwalls } from './pages/Offerwalls';
import { About } from './pages/About';
import { Privacy } from './pages/Privacy';
import { Contact } from './pages/Contact';

// Layout wrapper for authenticated routes mapping
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <>{children}</> : <Navigate to="/" />;
};

const LayoutContainer = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(false)} />
      <main className="max-w-6xl mx-auto p-5 py-10 relative z-10">
        {children}
      </main>
      <PtcEngineModal />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PTCProvider>
        <VpnBlocker>
          <BrowserRouter>
            {/* 3D Decorative Background Objects */}
            <div className="obj-3d cube-1 pointer-events-none"></div>
            <div className="obj-3d sphere-1 pointer-events-none"></div>
            <div className="obj-3d pyramid-1 pointer-events-none"></div>

            <Toaster theme="dark" position="top-right" richColors />

            <LayoutContainer>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/contact" element={<Contact />} />
                
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/earn" element={<PrivateRoute><Earn /></PrivateRoute>} />
                <Route path="/withdraw" element={<PrivateRoute><Withdraw /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/refer" element={<PrivateRoute><Refer /></PrivateRoute>} />
                <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
                <Route path="/advertiser" element={<PrivateRoute><Advertiser /></PrivateRoute>} />
                <Route path="/offerwalls" element={<PrivateRoute><Offerwalls /></PrivateRoute>} />
              </Routes>
            </LayoutContainer>
          </BrowserRouter>
        </VpnBlocker>
      </PTCProvider>
    </AuthProvider>
  );
}

