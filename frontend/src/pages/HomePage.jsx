import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomTabBar from '../components/BottomTabBar';

const TIER_COLORS = {
  BRONZE: 'badge-bronze', SILVER: 'badge-silver',
  GOLD: 'badge-gold', PLATINUM: 'badge-platinum', DIAMOND: 'badge-diamond',
};
const TIER_EMOJI = {
  BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇', PLATINUM: '💎', DIAMOND: '✨',
};

export default function HomePage() {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const tier = userInfo?.rankTier || 'BRONZE';

  return (
    <div className="app-shell">
      <div className="page">
        {/* 상단 인사 */}
        <div style={styles.topBar}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--sub)' }}>안녕하세요 👋</p>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>
              {userInfo?.name || '사용자'}님
            </h2>
          </div>
          <span className={`badge ${TIER_COLORS[tier]}`}>
            {TIER_EMOJI[tier]} {tier}
          </span>
        </div>

        {/* 매칭 배너 */}
        <div style={styles.banner} onClick={() => navigate('/match')}>
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>지금 바로 시작하세요</p>
            <p style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>매칭 찾기 💘</p>
          </div>
          <span style={{ fontSize: 48 }}>🎯</span>
        </div>

        {/* 빠른 매칭 */}
        <p className="section-title">매칭 선택</p>

        <MatchCard
          icon="🎲"
          color="#FF6B9D"
          bgColor="#FFE8F0"
          title="일반 매칭"
          desc="전체 학생과 랜덤 매칭"
          onClick={() => navigate('/match/waiting', { state: { type: 'GENERAL' } })}
        />
        <MatchCard
          icon="🏆"
          color="#6C5CE7"
          bgColor="#EEE9FF"
          title="랭크 매칭"
          desc={`내 티어(${tier}) 근처 학생과 매칭`}
          onClick={() => navigate('/match/waiting', { state: { type: 'RANK' } })}
        />
        <MatchCard
          icon="☕"
          color="#00B894"
          bgColor="#D4F5EC"
          title="공강 친구 매칭"
          desc="공강 시간이 맞는 친구 찾기"
          badge="준비 중"
          disabled
        />

        {/* 최근 매칭 이력 링크 */}
        <p className="section-title" style={{ marginTop: 28 }}>활동</p>
        <div className="card" style={{ cursor: 'pointer' }}
          onClick={() => navigate('/match/history')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>📋</span>
              <span style={{ fontWeight: 600 }}>매칭 이력</span>
            </div>
            <span style={{ color: 'var(--sub)', fontSize: 18 }}>›</span>
          </div>
        </div>
      </div>
      <BottomTabBar />
    </div>
  );
}

function MatchCard({ icon, color, bgColor, title, desc, badge, disabled, onClick }) {
  return (
    <div
      className="match-option-card"
      onClick={disabled ? undefined : onClick}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'default' : 'pointer' }}
    >
      <div className="match-icon" style={{ background: bgColor, color }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          {badge && (
            <span style={{
              fontSize: 11, background: 'var(--border)', color: 'var(--sub)',
              padding: '2px 8px', borderRadius: 20, fontWeight: 600,
            }}>{badge}</span>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'var(--sub)', marginTop: 3 }}>{desc}</p>
      </div>
      <span style={{ color: 'var(--sub)', fontSize: 18 }}>›</span>
    </div>
  );
}

const styles = {
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  banner: {
    background: 'linear-gradient(135deg, #FF6B9D, #C44EFF)',
    borderRadius: 20,
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#fff',
    marginBottom: 8,
    cursor: 'pointer',
  },
};
