import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/home',   label: '홈',   icon: '🏠' },
  { path: '/match',  label: '매칭', icon: '💘' },
  { path: '/chat',   label: '채팅', icon: '💬' },
  { path: '/mypage', label: '마이', icon: '👤' },
];

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
            style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}
          >
            <span style={styles.icon}>{tab.icon}</span>
            <span style={{ ...styles.label, color: active ? 'var(--pink)' : 'var(--sub)' }}>
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
    height: 68,
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
    gap: 2,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 0',
  },
  tabActive: {},
  icon: { fontSize: 22 },
  label: { fontSize: 11, fontWeight: 600, fontFamily: 'inherit' },
};
