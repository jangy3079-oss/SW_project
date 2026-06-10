import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GemsProvider } from './contexts/GemsContext';
import ProtectedRoute from './components/ProtectedRoute';
import BottomTabBar from './components/BottomTabBar';

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
import ProfileEditPage     from './pages/ProfileEditPage';
import ProfileSetupPage    from './pages/ProfileSetupPage';
import FreeTimeMatchingPage  from './pages/FreeTimeMatchingPage';
import FreeTimePickPage      from './pages/FreeTimePickPage';
import TimetableManagePage   from './pages/TimetableManagePage';
import PartnerProfilePage    from './pages/PartnerProfilePage';
import RankDetailPage        from './pages/RankDetailPage';

// BottomTabBar를 표시할 경로 목록
const BOTTOM_TAB_PATHS = new Set([
  '/home',
  '/match',
  '/match/history',
  '/chat',
  '/mypage',
  '/mypage/timetable',
]);

function PageTransition({ children }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}

function AppShell() {
  const { pathname } = useLocation();
  const showTabBar = BOTTOM_TAB_PATHS.has(pathname);

  return (
    <div style={{ width: '100%' }}>
      <PageTransition>
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
          <Route path="/mypage/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
          <Route path="/profile/setup" element={<ProtectedRoute><ProfileSetupPage /></ProtectedRoute>} />
          <Route path="/match/freetime" element={<Navigate to="/match/freetime/pick" replace />} />
          <Route path="/match/freetime/pick" element={<ProtectedRoute><FreeTimePickPage /></ProtectedRoute>} />
          <Route path="/mypage/timetable" element={<ProtectedRoute><TimetableManagePage /></ProtectedRoute>} />
          <Route path="/mypage/rank" element={<ProtectedRoute><RankDetailPage /></ProtectedRoute>} />
          <Route path="/partner/:partnerId" element={<ProtectedRoute><PartnerProfilePage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
      {showTabBar && <BottomTabBar />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GemsProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </GemsProvider>
    </AuthProvider>
  );
}
