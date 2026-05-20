import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { matching } from '../api/client';

export default function MatchWaitingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo } = useAuth();

  const matchType = location.state?.type || 'GENERAL'; // 'GENERAL' | 'RANK'
  const isRank = matchType === 'RANK';

  const [status, setStatus] = useState('entering'); // entering | waiting | matched | error
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const userId = userInfo?.userId;

  useEffect(() => {
    if (!userId) { setError('로그인 정보가 없습니다.'); return; }
    enterQueue();
    return () => { clearInterval(pollRef.current); clearInterval(timerRef.current); };
  }, [userId]);

  const enterQueue = async () => {
    try {
      const res = isRank
        ? await matching.enterRank(userId)
        : await matching.enterGeneral(userId);

      if (res?.matched) {
        // 즉시 매칭
        navigate('/match/success', { state: { match: res.match }, replace: true });
      } else {
        setStatus('waiting');
        startPolling();
        timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      }
    } catch (err) {
      setError(err.message || '매칭 대기열 등록에 실패했습니다.');
      setStatus('error');
    }
  };

  const startPolling = () => {
    pollRef.current = setInterval(async () => {
      try {
        const active = await matching.active(userId);
        if (active && active.length > 0) {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          navigate('/match/success', { state: { match: active[0] }, replace: true });
        }
      } catch {}
    }, 3000);
  };

  const handleCancel = async () => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
    try {
      if (isRank) await matching.cancelRank(userId);
      else        await matching.cancelGeneral(userId);
    } catch {}
    navigate('/home', { replace: true });
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={styles.wrap}>
      {/* 헤더 */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={handleCancel}>✕</button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>
          {isRank ? '🏆 랭크 매칭' : '🎲 일반 매칭'}
        </span>
        <span />
      </div>

      <div style={styles.body}>
        {status === 'entering' && (
          <>
            <div className="spinner" />
            <p style={styles.msg}>대기열 등록 중...</p>
          </>
        )}

        {status === 'waiting' && (
          <>
            <div style={styles.pulseWrap}>
              <div style={{ ...styles.pulse, animationDelay: '0s' }} />
              <div style={{ ...styles.pulse, animationDelay: '.5s' }} />
              <div style={{ ...styles.pulse, animationDelay: '1s' }} />
              <div style={styles.heartCenter}>💘</div>
            </div>
            <h2 style={styles.waitTitle}>상대를 찾는 중...</h2>
            <p style={styles.timer}>{fmt(seconds)}</p>
            <p style={styles.sub}>
              {isRank ? '내 랭크와 비슷한 상대를 탐색 중이에요' : '전체 학생 중 랜덤 매칭 중이에요'}
            </p>
            <button className="btn btn-ghost" onClick={handleCancel} style={{ marginTop: 32, maxWidth: 200 }}>
              매칭 취소
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 52, marginBottom: 16 }}>😢</div>
            <p style={styles.msg}>{error}</p>
            <button className="btn btn-primary" onClick={() => navigate('/home')} style={{ maxWidth: 200, marginTop: 16 }}>
              홈으로
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: 'var(--white)',
    borderBottom: '1px solid var(--border)',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    color: 'var(--sub)',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    textAlign: 'center',
  },
  pulseWrap: {
    position: 'relative',
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  pulse: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: 'var(--pink)',
    opacity: 0,
    animation: 'pulse-ring 2s ease-out infinite',
  },
  heartCenter: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 48,
  },
  waitTitle: { fontSize: 22, fontWeight: 800 },
  timer: { fontSize: 36, fontWeight: 800, color: 'var(--pink)', marginTop: 12 },
  sub: { fontSize: 14, color: 'var(--sub)', marginTop: 8 },
  msg: { fontSize: 16, color: 'var(--sub)', marginTop: 12 },
};
