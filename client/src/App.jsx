import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { ROLES } from './constants';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import Motions from './pages/organizer/Motions';
import DebateForm from './pages/organizer/DebateForm';
import OrganizerDebateDetail from './pages/organizer/OrganizerDebateDetail';
import JudgeDashboard from './pages/judge/JudgeDashboard';
import ScoreDebate from './pages/judge/ScoreDebate';
import ParticipantDashboard from './pages/participant/ParticipantDashboard';
import Profile from './pages/participant/Profile';

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeRedirect />} />

          <Route element={<ProtectedRoute roles={[ROLES.ORGANIZER]} />}>
            <Route path="/organizer" element={<OrganizerDashboard />} />
            <Route path="/organizer/motions" element={<Motions />} />
            <Route path="/organizer/debates/new" element={<DebateForm />} />
            <Route path="/organizer/debates/:id" element={<OrganizerDebateDetail />} />
            <Route path="/organizer/debates/:id/edit" element={<DebateForm />} />
          </Route>

          <Route element={<ProtectedRoute roles={[ROLES.JUDGE]} />}>
            <Route path="/judge" element={<JudgeDashboard />} />
            <Route path="/judge/debates/:id" element={<ScoreDebate />} />
          </Route>

          <Route element={<ProtectedRoute roles={[ROLES.PARTICIPANT]} />}>
            <Route path="/participant" element={<ParticipantDashboard />} />
            <Route path="/participant/profile" element={<Profile />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
