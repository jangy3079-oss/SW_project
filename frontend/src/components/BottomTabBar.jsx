import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Heart, MessageCircle, User } from 'lucide-react';

const TABS = [
  { path: '/home',   label: '홈',   Icon: Home },
  { path: '/match',  label: '매칭', Icon: Heart },
  { path: '/chat',   label: '채팅', Icon: MessageCircle },
  { path: '/mypage', label: '마이', Icon: User },
];

const PRIMARY = '#003087';

export default function BottomTabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav style={styles.nav}>
      {TABS.map(tab => {
        const active = pathname.startsWith(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              ...styles.tab,
              color: active ? PRIMARY : '#AAAAAA',
              transition: 'color 0.25s ease',
            }}
          >
            <tab.Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span style={styles.label}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 430,
    height: 80,
    background: '#fff',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    zIndex: 100,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  tab: {
    width: 96,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '10px 0',
  },
  label: { fontSize: 11, fontWeight: 600, fontFamily: 'inherit' },
};
