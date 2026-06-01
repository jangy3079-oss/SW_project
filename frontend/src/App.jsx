import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import SplashPage       from './pages/SplashPage';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import EmailVerifyPage  from './pages/EmailVerifyPage';
import HomePage         from './pages/HomePage';
import MatchPage        from './pages/MatchPage';
import MatchWaitingPage from './pages/MatchWaitingPage';
import MatchSuccessPage from './pages/MatchSuccessPage';
import EvaluationPage      from './pages/EvaluationPage';
import ChatRoomListPage    from './pages/ChatRoomListPage';
import ChatPage            from './pages/ChatPage';
import MyPage              from './pages/MyPage';
import FreeTimeMatchingPage from './pages/FreeTimeMatchingPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ width: '100%' }}>
          <Routes>
            {/* 공개 */}
            <Route path="/"        element={<SplashPage />} />
            <Route path="/login"   element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify"  element={<EmailVerifyPage />} />

            {/* 인증 필요 */}
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/match" element={<ProtectedRoute><MatchPage /></ProtectedRoute>} />
            <Route path="/match/waiting" element={<ProtectedRoute><MatchWaitingPage /></ProtectedRoute>} />
            <Route path="/match/success" element={<ProtectedRoute><MatchSuccessPage /></ProtectedRoute>} />
            <Route path="/match/history" element={<ProtectedRoute><MatchPage /></ProtectedRoute>} />
            <Route path="/match/evaluate/:matchId" element={<ProtectedRoute><EvaluationPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatRoomListPage /></ProtectedRoute>} />
            <Route path="/chat/:matchId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
            <Route path="/match/freetime" element={<ProtectedRoute><FreeTimeMatchingPage /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
