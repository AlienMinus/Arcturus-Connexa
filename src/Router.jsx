import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NotFound from './NotFound';
import Home from './pages/HomePage/Home';
import Navbar from './components/Navbar/Navbar';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import ProfileEditPage from './pages/ProfileEditPage/ProfileEditPage';
import ActivityPage from './pages/ActivityPage/ActivityPage';
import PostPage from './pages/PostPage/PostPage';
import AuthPage from './pages/AuthPage/AuthPage';
import MessegingPage from './pages/MessegingPage/MessegingPage';
import NetworkPage from './pages/NetworkPage/NetworkPage';
import NotificationsPage from './pages/NotificationsPage/NotificationsPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import HelpPage from './pages/HelpPage/HelpPage';
import JobsPage from './pages/JobsPage/JobsPage';
import JobPostingPage from './pages/JobPostingPage/JobPostingPage';
import UnderConstruction from './components/UnderConstruction/UnderConstruction';

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
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/jobs/manage" element={<JobPostingPage />} />
                <Route path="/jobs/post" element={<JobPostingPage />} />
                <Route path="/learning" element={<UnderConstruction title="Learning Hub is Under Construction" featureName="Courses & Certifications" />} />
                <Route path="/advertise" element={<UnderConstruction title="Ad Platform is Under Construction" featureName="Campaigns & Ads" />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/privacy" element={<SettingsPage />} />
                <Route path="/settings/language" element={<SettingsPage />} />
                <Route path="/settings/security" element={<SettingsPage />} />
                <Route path="/settings/notifications" element={<SettingsPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/help-support" element={<HelpPage />} />
                <Route path="/profile/edit" element={<ProfileEditPage />} />
                <Route path="/profile/:username/edit" element={<ProfileEditPage />} />
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
