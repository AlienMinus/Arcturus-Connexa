import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import NotFound from './NotFound';
import Home from './pages/HomePage/Home';
import Navbar from './components/Navbar/Navbar';
import ProfilePage from './components/Profile/ProfilePage';
import AuthPage from './pages/AuthPage/AuthPage';
import { ProfileProvider } from './context/ProfileContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
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
                    <Route path="/profile/*" element={<ProfilePage />} />
                    <Route path="/*" element={<NotFound />} />
                  </Routes>
                </>
              }
            />
          </Routes>
        </Router>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
