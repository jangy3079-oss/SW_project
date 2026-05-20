import { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { evaluation } from '../api/client';

const SCORE_LABELS = ['', '별로였어요', '아쉬웠어요', '보통이에요', '좋았어요', '최고였어요!'];

export default function EvaluationPage() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const location = useLocation();
  const { userInfo } = useAuth();
  const match = location.state?.match;

  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const displayed = hover || score;

  const handleSubmit = async () => {
    if (!score) { setError('별점을 선택해주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      await evaluation.submit(matchId, userInfo.userId, score);
      setDone(true);
    } catch (err) {
      setError(err.message || '평가 제출에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div style={{ ...styles.wrap, justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🌟</div>
      <h2 style={{ fontSize: 24, fontWeight: 800 }}>평가 완료!</h2>
      <p style={{ fontSize: 14, color: 'var(--sub)', marginTop: 8, lineHeight: 1.6 }}>
        평가가 반영되었습니다.<br />상대방도 평가를 완료하면 랭크가 업데이트돼요.
      </p>
      <button
        className="btn btn-primary"
        onClick={() => navigate('/home', { replace: true })}
        style={{ marginTop: 32 }}
      >
        홈으로
      </button>
    </div>
  );

  return (
    <div style={styles.wrap}>
      {/* 헤더 */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={{ fontWeight: 700 }}>매칭 평가</span>
        <span />
      </div>

      <div style={{ padding: '32px 20px' }}>
        {/* 상대 정보 요약 */}
        <div className="card" style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
          <p style={{ fontWeight: 700, fontSize: 17 }}>{match?.partnerName || '상대방'}</p>
          <p style={{ fontSize: 13, color: 'var(--sub)' }}>{match?.partnerDepartment || ''}</p>
        </div>

        {/* 별점 선택 */}
        <div className="card">
          <h3 style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
            이번 매칭은 어떠셨나요?
          </h3>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--sub)', marginBottom: 20 }}>
            평가 점수는 상대방의 랭크에 반영돼요
          </p>

          <div className="stars">
            {[1, 2, 3, 4, 5].map(s => (
              <span
                key={s}
                className={`star ${s <= displayed ? 'active' : ''}`}
                onClick={() => setScore(s)}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
              >
                ⭐
              </span>
            ))}
          </div>

          {displayed > 0 && (
            <p style={{ textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'var(--pink)', marginTop: 4 }}>
              {SCORE_LABELS[displayed]}
            </p>
          )}

          {/* 점수 바 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0 8px' }}>
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                onClick={() => setScore(s)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  border: score === s ? '2px solid var(--pink)' : '1.5px solid var(--border)',
                  background: score === s ? 'var(--pink-light)' : 'var(--white)',
                  color: score === s ? 'var(--pink)' : 'var(--text)',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--sub)' }}>
            <span>별로</span><span>최고</span>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !score}
          style={{ marginTop: 20 }}
        >
          {loading ? '제출 중...' : '평가 제출'}
        </button>
        <button className="btn btn-ghost" onClick={() => navigate('/home')}>
          나중에 하기
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
    fontSize: 20,
    cursor: 'pointer',
    color: 'var(--sub)',
  },
};
