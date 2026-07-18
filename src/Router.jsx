import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NotFound from './NotFound';
import Home from './pages/HomePage/Home';
import Navbar from './components/Navbar/Navbar';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import ActivityPage from './pages/ActivityPage/ActivityPage';
import PostPage from './pages/PostPage/PostPage';
import AuthPage from './pages/AuthPage/AuthPage';
import MessegingPage from './pages/MessegingPage/MessegingPage';
import NetworkPage from './pages/NetworkPage/NetworkPage';
import NotificationsPage from './pages/NotificationsPage/NotificationsPage';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/forgot-password" element={<AuthPage mode="forgot-password" />} />
        <Route path="/reset-password" element={<AuthPage mode="reset-password" />} />
        <Route
          path="/*"
          element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/profile/activity" element={<ActivityPage />} />
                <Route path="/profile/:username/activity" element={<ActivityPage />} />
                <Route path="/profile/:username" element={<ProfilePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/network" element={<NetworkPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/:username/posts/:postId" element={<PostPage />} />
                <Route path="/messaging" element={<MessegingPage />} />
                <Route path="/*" element={<NotFound />} />
              </Routes>
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default AppRouter;
