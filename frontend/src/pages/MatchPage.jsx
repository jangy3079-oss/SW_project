import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { matching } from '../api/client';
import BottomTabBar from '../components/BottomTabBar';

export default function MatchPage() {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userInfo?.userId) { setLoading(false); return; }
    matching.history(userInfo.userId)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userInfo?.userId]);

  return (
    <div className="app-shell">
      <div className="page">
        <h2 className="page-header">매칭</h2>

        {/* 매칭 선택 */}
        <p className="section-title">새 매칭 시작</p>

        <OptionCard
          icon="🎲" bg="#FFE8F0" color="#FF6B9D"
          title="일반 매칭"
          desc="전체 학생과 랜덤 매칭 · 남녀 매칭 보장"
          onClick={() => navigate('/match/waiting', { state: { type: 'GENERAL' } })}
        />
        <OptionCard
          icon="🏆" bg="#EEE9FF" color="#6C5CE7"
          title="랭크 매칭"
          desc="내 티어 근처 상대와 정밀 매칭"
          onClick={() => navigate('/match/waiting', { state: { type: 'RANK' } })}
        />
        <OptionCard
          icon="☕" bg="#D4F5EC" color="#00B894"
          title="공강 친구 매칭"
          desc="공강 시간이 맞는 친구 찾기"
          badge="준비 중"
          disabled
        />

        {/* 매칭 이력 */}
        <p className="section-title" style={{ marginTop: 28 }}>매칭 이력</p>

        {loading && <div className="spinner" />}

        {!loading && history.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--sub)', padding: '32px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
            <p>아직 매칭 이력이 없어요</p>
          </div>
        )}

        {history.map(m => (
          <div key={m.matchId} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700 }}>{m.partnerName || '상대방'}</span>
                  <StatusBadge status={m.status} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--sub)' }}>
                  {m.matchType === 'RANK' ? '🏆 랭크' : '🎲 일반'} ·{' '}
                  {m.matchedAt ? new Date(m.matchedAt).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
              {m.status === 'ACTIVE' && (
                <button
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}
                  onClick={() => navigate(`/match/evaluate/${m.matchId}`, { state: { match: m } })}
                >
                  평가
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <BottomTabBar />
    </div>
  );
}

function OptionCard({ icon, bg, color, title, desc, badge, disabled, onClick }) {
  return (
    <div
      className="match-option-card"
      onClick={disabled ? undefined : onClick}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'default' : 'pointer' }}
    >
      <div className="match-icon" style={{ background: bg, color }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
          {badge && (
            <span style={{
              fontSize: 11, background: 'var(--border)', color: 'var(--sub)',
              padding: '2px 7px', borderRadius: 20, fontWeight: 600,
            }}>{badge}</span>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'var(--sub)', marginTop: 2 }}>{desc}</p>
      </div>
      <span style={{ color: 'var(--sub)', fontSize: 18 }}>›</span>
    </div>
  );
}

const STATUS_MAP = {
  ACTIVE:    { label: '진행 중', bg: '#E8F8F0', color: '#1a7a45' },
  EVALUATED: { label: '평가 완료', bg: 'var(--border)', color: 'var(--sub)' },
  EXPIRED:   { label: '만료됨', bg: '#FDECEA', color: '#B00020' },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.EXPIRED;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color,
      padding: '2px 8px', borderRadius: 20,
    }}>
      {s.label}
    </span>
  );
}
