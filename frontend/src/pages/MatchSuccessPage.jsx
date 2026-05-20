import { useNavigate, useLocation } from 'react-router-dom';

export default function MatchSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const match = location.state?.match;

  if (!match) {
    return (
      <div style={styles.wrap}>
        <p style={{ color: 'var(--sub)' }}>매칭 정보가 없습니다.</p>
        <button className="btn btn-primary" onClick={() => navigate('/home')} style={{ maxWidth: 200, marginTop: 16 }}>
          홈으로
        </button>
      </div>
    );
  }

  const expires = match.expiresAt ? new Date(match.expiresAt).toLocaleString('ko-KR') : '-';
  const isRank = match.matchType === 'RANK';

  return (
    <div style={styles.wrap}>
      {/* 성공 배너 */}
      <div style={styles.banner}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>매칭 성공!</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>
          {isRank ? '🏆 랭크 매칭' : '🎲 일반 매칭'}
        </p>
      </div>

      {/* 상대 정보 */}
      <div style={{ padding: '0 20px', marginTop: -24 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>상대방 프로필</h3>

          <div className="profile-row">
            <span className="profile-row-label">이름</span>
            <span>{match.partnerName || '상대방'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-row-label">학과</span>
            <span>{match.partnerDepartment || '-'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-row-label">학년</span>
            <span>{match.partnerGrade ? `${match.partnerGrade}학년` : '-'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-row-label">매칭 만료</span>
            <span style={{ fontSize: 13, color: 'var(--sub)' }}>{expires}</span>
          </div>
        </div>

        {/* 안내 */}
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          📅 매칭 기간 내에 서로를 평가해야 합니다. 만료 전에 평가를 완료해주세요.
        </div>

        {/* 액션 버튼 */}
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/chat/${match.matchId}`, {
            state: { room: { matchId: match.matchId, opponentName: match.partnerName } },
          })}
        >
          채팅하기 💬
        </button>
        <button
          className="btn btn-outline"
          onClick={() => navigate(`/match/evaluate/${match.matchId}`, {
            state: { match },
          })}
        >
          상대 평가하기 ⭐
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/home', { replace: true })}
        >
          나중에
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    background: 'var(--bg)',
    maxWidth: 600,
    width: '100%',
  },
  banner: {
    background: 'linear-gradient(135deg, #FF6B9D, #C44EFF)',
    padding: '60px 24px 48px',
    textAlign: 'center',
  },
};
