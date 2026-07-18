import './App.css';
import { ProfileProvider } from './context/ProfileContext';
import { AuthProvider } from './context/AuthContext';
import { ReactionProvider } from './context/ReactionContext';
import AppRouter from './Router';

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <ReactionProvider>
          <AppRouter />
        </ReactionProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
