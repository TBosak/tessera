import { Routes, Route } from 'react-router-dom';
import { Toaster } from './components/Toaster';

// Import page components (will create these next)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import ElectionPage from './pages/ElectionPage';
import NewElectionPage from './pages/NewElectionPage';
import PublicElectionPage from './pages/PublicElectionPage';
import VotePage from './pages/VotePage';
import ResultsPage from './pages/ResultsPage';
import ReceiptsPage from './pages/ReceiptsPage';

function App() {
  return (
    <div className="min-h-screen bg-paper">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        
        {/* Public election routes */}
        <Route path="/e/:slug" element={<PublicElectionPage />} />
        <Route path="/e/:slug/vote" element={<VotePage />} />
        <Route path="/e/:slug/results" element={<ResultsPage />} />
        <Route path="/e/:slug/receipts" element={<ReceiptsPage />} />
        
        {/* Organizer routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/elections/new" element={<NewElectionPage />} />
        <Route path="/elections/:id" element={<ElectionPage />} />
      </Routes>
      
      <Toaster />
    </div>
  );
}

export default App;