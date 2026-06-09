import { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { evaluation } from '../api/client';
import { Star, User, ChevronLeft, CheckCircle } from 'lucide-react';

const PRIMARY    = '#003087';
const PRIMARY_BG = '#EAF0FB';
const SUB        = '#888888';
const BORDER     = '#E8E8E8';
const SHADOW     = '0 2px 12px rgba(0,0,0,0.07)';

const SCORE_LABELS  = ['', '별로였어요', '아쉬웠어요', '보통이에요', '좋았어요', '최고였어요!'];
const MANNER_LABELS = ['', '많이 불편했어요', '조금 아쉬웠어요', '보통이에요', '매너가 좋았어요', '최고의 매너!'];

/** 최종 점수: 두 점수 평균을 반올림, 범위 1~5 고정 */
function calcFinal(s, m) {
  return Math.min(5, Math.max(1, Math.round((s + m) / 2)));
}

export default function EvaluationPage() {
  const navigate   = useNavigate();
  const { matchId } = useParams();
  const location   = useLocation();
  const { userInfo } = useAuth();
  const match      = location.state?.match;

  const [score,        setScore]        = useState(0);
  const [hover,        setHover]        = useState(0);
  const [mannerScore,  setMannerScore]  = useState(0);
  const [mannerHover,  setMannerHover]  = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [done,         setDone]         = useState(false);

  const displayed       = hover       || score;
  const mannerDisplayed = mannerHover || mannerScore;

  const handleSubmit = async () => {
    if (!score)       { setError('매칭 별점을 선택해주세요.'); return; }
    if (!mannerScore) { setError('매너 별점을 선택해주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      const finalScore = calcFinal(score, mannerScore);
      await evaluation.submit(matchId, userInfo.userId, finalScore);
      setDone(true);
    } catch (err) {
      setError(err.message || '평가 제출에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /* 완료 화면 */
  if (done) return (
    <div style={{ ...s.wrap, alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ background: PRIMARY_BG, borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <CheckCircle size={40} color={PRIMARY} strokeWidth={1.8} />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>평가 완료!</h2>
      <p style={{ fontSize: 14, color: SUB, marginTop: 8, lineHeight: 1.7 }}>
        평가가 반영되었습니다.<br />상대방도 평가를 완료하면 랭크가 업데이트돼요.
      </p>
      <button style={s.submitBtn} onClick={() => navigate('/home', { replace: true })}>
        홈으로
      </button>
    </div>
  );

  return (
    <div style={s.wrap}>

      {/* 헤더 */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={22} color="#111" strokeWidth={2} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>매칭 평가</span>
        <span style={{ width: 36 }} />
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* 상대 프로필 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 4px' }}>
          <div style={s.avatarWrap}>
            <User size={32} color={PRIMARY} strokeWidth={1.8} />
          </div>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#111', marginTop: 12 }}>
            {match?.partnerName || '상대방'}
          </p>
          {match?.partnerDepartment && (
            <p style={{ fontSize: 13, color: SUB, marginTop: 3 }}>{match.partnerDepartment}</p>
          )}
        </div>

        {/* 매칭 별점 */}
        <StarCard
          title="이번 매칭은 어떠셨나요?"
          sub="전반적인 만남의 만족도를 평가해주세요"
          labels={SCORE_LABELS}
          score={score}
          hover={hover}
          setScore={setScore}
          setHover={setHover}
        />

        {/* 매너 별점 */}
        <StarCard
          title="상대방의 매너는 어땠나요?"
          sub="대화 태도, 존중, 예의 등을 평가해주세요"
          labels={MANNER_LABELS}
          score={mannerScore}
          hover={mannerHover}
          setScore={setMannerScore}
          setHover={setMannerHover}
        />

        {/* 최종 점수 미리보기 */}
        {score > 0 && mannerScore > 0 && (
          <div style={{ background: PRIMARY_BG, borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: PRIMARY, fontWeight: 600 }}>최종 점수 (두 점수 평균)</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: PRIMARY }}>
              {'★'.repeat(calcFinal(score, mannerScore))}{'☆'.repeat(5 - calcFinal(score, mannerScore))}
              {' '}
              {calcFinal(score, mannerScore)}점
            </span>
          </div>
        )}

        {error && (
          <p style={{ fontSize: 13, color: '#B00020', textAlign: 'center' }}>{error}</p>
        )}

      </div>

      {/* 하단 고정 버튼 */}
      <div style={s.bottomBar}>
        <button
          style={{ ...s.submitBtn, opacity: (!score || !mannerScore || loading) ? 0.4 : 1 }}
          onClick={handleSubmit}
          disabled={loading || !score || !mannerScore}
        >
          {loading ? '제출 중...' : '평가 제출'}
        </button>
        <button style={s.ghostBtn} onClick={() => navigate('/home')}>
          나중에 하기
        </button>
      </div>
    </div>
  );
}

function StarCard({ title, sub, labels, score, hover, setScore, setHover }) {
  const displayed = hover || score;
  return (
    <div style={s.card}>
      <p style={{ fontSize: 16, fontWeight: 800, color: '#111', textAlign: 'center' }}>{title}</p>
      <p style={{ fontSize: 13, color: SUB, marginTop: 4, textAlign: 'center' }}>{sub}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '20px 0 4px' }}>
        {[1, 2, 3, 4, 5].map(sv => (
          <button
            key={sv}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            onClick={() => setScore(sv)}
            onMouseEnter={() => setHover(sv)}
            onMouseLeave={() => setHover(0)}
          >
            <Star size={32} color={PRIMARY} fill={sv <= displayed ? PRIMARY : 'none'} strokeWidth={1.5} />
          </button>
        ))}
      </div>
      <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: displayed ? PRIMARY : 'transparent', minHeight: 20, marginBottom: 4 }}>
        {labels[displayed] || '·'}
      </p>
    </div>
  );
}

const s = {
  wrap: {
    display: 'flex', flexDirection: 'column',
    minHeight: '100dvh', background: '#fff',
    maxWidth: 430, width: '100%', margin: '0 auto',
    paddingBottom: 120,
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 20px',
    borderBottom: `1px solid ${BORDER}`,
  },
  backBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 36, height: 36, borderRadius: 10,
    padding: 0,
  },
  card: {
    background: '#fff', borderRadius: 16, padding: '20px',
    boxShadow: SHADOW, display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  avatarWrap: {
    width: 64, height: 64, borderRadius: '50%',
    background: PRIMARY_BG,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  submitBtn: {
    width: '100%', padding: '15px',
    background: PRIMARY, color: '#fff',
    border: 'none', borderRadius: 14,
    fontSize: 16, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'opacity 0.15s',
    marginTop: 4,
  },
  ghostBtn: {
    width: '100%', padding: '12px',
    background: 'none', color: SUB,
    border: 'none', borderRadius: 14,
    fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'fixed', bottom: 0, left: '50%',
    transform: 'translateX(-50%)',
    width: '100%', maxWidth: 430,
    padding: '12px 20px 28px',
    background: '#fff',
    borderTop: `1px solid ${BORDER}`,
  },
};
