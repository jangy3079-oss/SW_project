import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { user as userApi } from '../api/client';
import BottomTabBar from '../components/BottomTabBar';

const TIER_STYLE = {
  BRONZE:   { badge: 'badge-bronze',   emoji: '🥉', next: 'SILVER',   desc: '평균 2.0점 이상이면 실버 승급' },
  SILVER:   { badge: 'badge-silver',   emoji: '🥈', next: 'GOLD',     desc: '평균 3.0점 이상이면 골드 승급' },
  GOLD:     { badge: 'badge-gold',     emoji: '🥇', next: 'PLATINUM', desc: '평균 4.0점 이상이면 플래티넘 승급' },
  PLATINUM: { badge: 'badge-platinum', emoji: '💎', next: 'DIAMOND',  desc: '평균 4.5점 이상이면 다이아 승급' },
  DIAMOND:  { badge: 'badge-diamond',  emoji: '✨', next: null,       desc: '최고 티어입니다!' },
};

export default function MyPage() {
  const navigate = useNavigate();
  const { userInfo, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userInfo?.userId) { setLoading(false); return; }
    userApi.get(userInfo.userId)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userInfo?.userId]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const tier = profile?.rankTier || userInfo?.rankTier || 'BRONZE';
  const tierInfo = TIER_STYLE[tier] || TIER_STYLE.BRONZE;
  const score = profile?.rankScore ?? '-';
  const evalCount = profile?.evalCount ?? 0;

  return (
    <div className="app-shell">
      <div className="page">
        <h2 className="page-header">마이페이지</h2>

        {loading && <div className="spinner" />}

        {!loading && (
          <>
            {/* 프로필 카드 */}
            <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6B9D, #C44EFF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, margin: '0 auto 12px',
              }}>
                👤
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>
                {profile?.name || userInfo?.name || '사용자'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--sub)', marginTop: 4 }}>
                {profile?.department || '-'} · {profile?.grade ? `${profile.grade}학년` : ''}
              </p>
              <div style={{ marginTop: 12 }}>
                <span className={`badge ${tierInfo.badge}`}>
                  {tierInfo.emoji} {tier}
                </span>
              </div>
            </div>

            {/* 랭크 정보 */}
            <p className="section-title">랭크 현황</p>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--pink)' }}>
                    {typeof score === 'number' ? score.toFixed(2) : '-'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--sub)' }}>평균 점수</p>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div>
                  <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--purple)' }}>{evalCount}</p>
                  <p style={{ fontSize: 12, color: 'var(--sub)' }}>받은 평가 수</p>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div>
                  <p style={{ fontSize: 28, fontWeight: 800 }}>{tierInfo.emoji}</p>
                  <p style={{ fontSize: 12, color: 'var(--sub)' }}>{tier}</p>
                </div>
              </div>
              <div className="alert alert-info" style={{ margin: 0, fontSize: 13 }}>
                💡 {tierInfo.desc}
              </div>
            </div>

            {/* 내 정보 */}
            <p className="section-title">내 정보</p>
            <div className="card">
              <InfoRow label="이메일" value={profile?.email || userInfo?.email || '-'} />
              <InfoRow label="학번" value={profile?.studentId || '-'} />
              <InfoRow label="학과" value={profile?.department || '-'} />
              <InfoRow label="학년" value={profile?.grade ? `${profile.grade}학년` : '-'} />
              <InfoRow label="성별" value={
                (profile?.gender || userInfo?.gender) === 'MALE' ? '남성' :
                (profile?.gender || userInfo?.gender) === 'FEMALE' ? '여성' : '-'
              } />
            </div>

            {/* 자기소개 */}
            <p className="section-title">자기소개</p>
            <div className="card">
              <p style={{ fontSize: 14, color: profile?.bio ? 'var(--text)' : 'var(--sub)', lineHeight: 1.6 }}>
                {profile?.bio || '아직 자기소개가 없습니다.'}
              </p>
              <button
                className="btn btn-outline"
                style={{ marginTop: 14 }}
                onClick={() => navigate('/mypage/edit')}
              >
                수정하기
              </button>
            </div>

            {/* 설정 */}
            <p className="section-title">설정</p>
            <div className="card">
              <button
                className="btn btn-danger"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </div>
          </>
        )}
      </div>
      <BottomTabBar />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="profile-row">
      <span className="profile-row-label">{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
