import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { RealTimeProvider } from '@/contexts/RealTimeContext';
import { Toaster } from 'sonner';
import Navbar from '@/components/Navbar';
import './App.css';

// Home page
const HomePage = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
    <div className="max-w-7xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Welcome to LDCE Alumni Network</h1>
      <p className="text-xl text-gray-600">Connect, collaborate, and grow with alumni from LDCE</p>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-orange-600 mb-2">Directory</h3>
          <p className="text-gray-600">Find and connect with alumni</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-orange-600 mb-2">Opportunities</h3>
          <p className="text-gray-600">Explore job and startup opportunities</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-orange-600 mb-2">Events</h3>
          <p className="text-gray-600">Join alumni meetups and webinars</p>
        </div>
      </div>
    </div>
  </div>
);

// Placeholder for pages
const PagePlaceholder = ({ title }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">{title}</h1>
      <p className="text-gray-600">This page is coming soon...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RealTimeProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-gray-50">
              <Navbar />
              
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/directory" element={<PagePlaceholder title="Directory" />} />
                  <Route path="/feed" element={<PagePlaceholder title="Feed" />} />
                  <Route path="/opportunities" element={<PagePlaceholder title="Opportunities" />} />
                  <Route path="/challenges" element={<PagePlaceholder title="Challenges" />} />
                  <Route path="/events" element={<PagePlaceholder title="Events" />} />
                  <Route path="/innovation" element={<PagePlaceholder title="Innovation" />} />
                  <Route path="/notifications" element={<PagePlaceholder title="Notifications" />} />
                  <Route path="/chat" element={<PagePlaceholder title="Chat" />} />
                  <Route path="/profile/:id" element={<PagePlaceholder title="Profile" />} />
                  <Route path="/login" element={<PagePlaceholder title="Login" />} />
                  <Route path="*" element={<HomePage />} />
                </Routes>
              </main>
            </div>
            <Toaster position="top-right" richColors />
          </Router>
        </RealTimeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { RealTimeProvider } from '@/contexts/RealTimeContext';
import { Toaster } from 'sonner';
import Navbar from '@/components/Navbar';

// Home page component
const HomePage = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
    <div className="max-w-7xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Welcome to LDCE Alumni Network</h1>
      <p className="text-xl text-gray-600">Connect, collaborate, and grow with alumni from LDCE</p>
    </div>
  </div>
);

// Placeholder component for missing pages
const Placeholder = ({ name }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">{name}</h2>
      <p className="text-gray-600">Coming soon...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RealTimeProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-gray-50">
              <Navbar />
              
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/directory" element={<Placeholder name="Directory" />} />
                  <Route path="/feed" element={<Placeholder name="Feed" />} />
                  <Route path="/opportunities" element={<Placeholder name="Opportunities" />} />
                  <Route path="/challenges" element={<Placeholder name="Challenges" />} />
                  <Route path="/events" element={<Placeholder name="Events" />} />
                  <Route path="/innovation" element={<Placeholder name="Innovation" />} />
                  <Route path="/notifications" element={<Placeholder name="Notifications" />} />
                  <Route path="/chat" element={<Placeholder name="Chat" />} />
                  <Route path="/profile/:id" element={<Placeholder name="Profile" />} />
                  <Route path="*" element={<HomePage />} />
                </Routes>
              </main>
            </div>
            <Toaster />
          </Router>
        </RealTimeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { RealTimeProvider } from '@/contexts/RealTimeContext';
import Navbar from '@/components/Navbar';
import LoginModal from '@/components/LoginModal';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RealTimeProvider>
          <Router>
            <Navbar />
            <main className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/login" element={<LoginModal />} />
                <Route path="/" element={<div className="text-center py-20">Welcome to LDCE Alumni Network</div>} />
              </Routes>
            </main>
          </Router>
        </RealTimeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

// Pages
const Login = lazy(() => import('@/features/auth/Login'));
const SetPassword = lazy(() => import('@/features/auth/SetPassword'));
const VerifyTempPassword = lazy(() => import('@/features/auth/VerifyTempPassword'));
const SelfRegister = lazy(() => import('@/features/auth/SelfRegister'));
const CompleteProfile = lazy(() => import('@/features/profile/CompleteProfile'));
const ProfileModern = lazy(() => import('@/features/profile/ProfileModern'));
const MyConnections = lazy(() => import('@/features/profile/MyConnections'));
const MyActivity = lazy(() => import('@/features/profile/MyActivity'));
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage'));
const Startup = lazy(() => import('@/features/startup/Startup'));
const StartupDetails = lazy(() => import('@/features/startup/StartupDetails'));
const SignUp = lazy(() => import('@/features/auth/SignUp'));
const Directory = lazy(() => import('@/features/directory/DirectoryPolished'));
const HomeCommunity = lazy(() => import('@/features/home/HomeCommunity'));
const FeedClean = lazy(() => import('@/features/feed/FeedClean'));
const Opportunities = lazy(() => import('@/features/opportunities/Opportunities'));
const ChallengesList = lazy(() => import('@/features/challenges/ChallengesList'));
const PostChallenge = lazy(() => import('@/features/challenges/PostChallenge'));
const ChallengeDetails = lazy(() => import('@/features/challenges/ChallengeDetails'));
const Events = lazy(() => import('@/features/events/Events'));
const ChatRoom = lazy(() => import('@/features/chat/ChatRoom'));
const SearchPage = lazy(() => import('@/features/search/SearchPage'));

// Components
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Protected Route Wrapper
function ProtectedRoute({ children, isFirstLogin = false }) {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!auth.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // If user needs to set password but is trying to go somewhere else
  if (auth.alumni?.isFirstLogin && !isFirstLogin) {
    return <Navigate to="/set-password" replace />;
  }

  return children;
}

export default function App() {
  const auth = useAuth();

  const routeFallback = (
    <div className="min-h-[50vh] bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Initialising AluVerse...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />

          <main className="flex-1">
            <Suspense fallback={routeFallback}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/self-register" element={<SelfRegister />} />
                <Route path="/verify-temp-password" element={<VerifyTempPassword />} />
                <Route path="/" element={<><HomeCommunity /><Footer /></>} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/feed" element={<FeedClean />} />
                <Route path="/opportunities" element={<Opportunities />} />
                <Route path="/challenges" element={<ChallengesList />} />
                <Route path="/challenges/:id" element={<ChallengeDetails />} />
                <Route
                  path="/challenges/post"
                  element={
                    <ProtectedRoute>
                      <PostChallenge />
                    </ProtectedRoute>
                  }
                />
                <Route path="/events" element={<Events />} />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <SearchPage />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/set-password"
                  element={
                    <ProtectedRoute isFirstLogin={true}>
                      <SetPassword />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/complete-profile"
                  element={
                    <ProtectedRoute>
                      <CompleteProfile />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile/me"
                  element={
                    <ProtectedRoute>
                      <ProfileModern />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile/:id"
                  element={
                    <ProtectedRoute>
                      <ProfileModern />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/my-connections"
                  element={
                    <ProtectedRoute>
                      <MyConnections />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/my-activity"
                  element={
                    <ProtectedRoute>
                      <MyActivity />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatRoom />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/chat/:id"
                  element={
                    <ProtectedRoute>
                      <ChatRoom />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/innovation"
                  element={
                    <ProtectedRoute>
                      <Startup />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/innovation/:id"
                  element={
                    <ProtectedRoute>
                      <StartupDetails />
                    </ProtectedRoute>
                  }
                />

                {/* Fallbacks */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </>
  );
}
