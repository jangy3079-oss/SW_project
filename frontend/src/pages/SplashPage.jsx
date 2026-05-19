import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SplashPage() {
  const navigate = useNavigate();
  const { isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      navigate(isLoggedIn ? '/home' : '/login', { replace: true });
    }, 1800);
    return () => clearTimeout(timer);
  }, [isLoggedIn, loading, navigate]);

  return (
    <div style={styles.wrap}>
      <div style={styles.logoWrap}>
        <div style={styles.logo}>💕</div>
        <h1 style={styles.title}>동아대 데이팅</h1>
        <p style={styles.sub}>동아대학교 학생 전용 매칭 서비스</p>
      </div>
      <div style={styles.dot}>
        <span style={{ ...styles.dotItem, animationDelay: '0s' }} />
        <span style={{ ...styles.dotItem, animationDelay: '.2s' }} />
        <span style={{ ...styles.dotItem, animationDelay: '.4s' }} />
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100dvh',
    background: 'linear-gradient(145deg, #FF6B9D 0%, #C44EFF 100%)',
    gap: 40,
  },
  logoWrap: { textAlign: 'center' },
  logo: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.5 },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  dot: { display: 'flex', gap: 8 },
  dotItem: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.8)',
    animation: 'bounce 1.4s infinite ease-in-out',
  },
};
