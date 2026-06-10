import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { user as userApi, photo as photoApi, freeTime } from '../api/client';
import {
  GraduationCap, BookOpen, Trophy, Calendar, AlertTriangle,
  RefreshCw, Heart, MessageCircle, Frown, User, CheckCircle, Mail,
} from 'lucide-react';

// ── 디자인 토큰 ────────────────────────────────
const PRIMARY    = '#003087';
const PRIMARY_BG = '#EAF0FB';

const TIER_LABEL = { BRONZE: 'BRONZE', SILVER: 'SILVER', GOLD: 'GOLD', PLATINUM: 'PLATINUM', DIAMOND: 'DIAMOND' };

// Q&A 섹션
const EXTRA_QUESTIONS = [
  { id: 'q0', label: '내 성격의 가장 큰 장점은' },
  { id: 'q1', label: '연애할 때, 원하는 연락의 빈도는' },
  { id: 'q2', label: '게임하는 것에 대한 생각은' },
  { id: 'q3', label: '이상형의 외모는' },
];

// ── 유틸 ──────────────────────────────────────
function calcAge(birthDate) {
  if (!birthDate) return '';
  const b = new Date(birthDate);
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (
    t.getMonth() < b.getMonth() ||
    (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())
  ) a--;
  return a;
}

function fmtTime(str) {
  if (!str) return '';
  const [h, m] = str.split(':');
  const hr = parseInt(h, 10);
  return `${hr < 12 ? '오전' : '오후'} ${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m}`;
}

// ── 메인 컴포넌트 ──────────────────────────────
export default function PartnerProfilePage() {
  const { partnerId } = useParams();
  const { state }     = useLocation();
  const navigate      = useNavigate();
  const { userInfo }  = useAuth();

  const [profile,      setProfile]      = useState(null);
  const [photos,       setPhotos]       = useState([]);
  const [prefs,        setPrefs]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [acting,       setActing]       = useState(null);
  const [toast,        setToast]        = useState('');

  const userId    = userInfo?.userId;
  const requestId = state?.requestId;
  const matchType = state?.matchType;
  const matchId   = state?.matchId;

  useEffect(() => {
    if (!partnerId) return;
    setLoading(true);
    Promise.allSettled([
      userApi.get(partnerId),
      photoApi.list(partnerId),
      userApi.getPreferences(partnerId),
    ]).then(([p, ph, pr]) => {
      if (p.status  === 'fulfilled') setProfile(p.value);
      if (ph.status === 'fulfilled') {
        const sorted = (ph.value || []).sort((a, b) => {
          if (a.isPrimary) return -1;
          if (b.isPrimary) return 1;
          return (a.photoOrder || 0) - (b.photoOrder || 0);
        });
        setPhotos(sorted);
      }
      if (pr.status === 'fulfilled') setPrefs(pr.value);
      setLoading(false);
    });
  }, [partnerId]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const handleAccept = async () => {
    setActing('accept');
    try {
      if (matchType === 'FREETIME' && requestId) {
        await freeTime.accept(requestId, userId);
        showToast('좋아요를 보냈어요! 상대방도 수락하면 채팅이 열려요');
        setTimeout(() => navigate(-1), 1800);
      } else if (matchId) {
        navigate(`/chat/${matchId}`);
      }
    } catch (e) {
      showToast(e.message || '오류가 발생했어요');
    } finally {
      setActing(null);
    }
  };

  const handleReroll = async () => {
    setActing('reroll');
    try {
      if (matchType === 'FREETIME' && requestId) {
        await freeTime.reject(requestId, userId);
      }
    } catch {}
    finally {
      setActing(null);
      navigate(-1);
    }
  };

  const handleChat = () => {
    if (matchId) {
      navigate(`/chat/${matchId}`);
    } else {
      showToast('채팅은 매칭 수락 후 이용 가능해요');
    }
  };

  if (loading) {
    return (
      <div style={s.center}>
        <div style={s.spinner} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={s.center}>
        <Frown size={48} color="#aaa" strokeWidth={1.5} />
        <p style={{ marginTop: 12, color: '#888' }}>프로필을 불러올 수 없어요</p>
        <button style={s.backBtn} onClick={() => navigate(-1)}>돌아가기</button>
      </div>
    );
  }

  const age          = calcAge(profile.birthDate);
  const mbti         = prefs?.mbti;
  const extraAnswers = prefs?.extraAnswers || {};
  const hasQA        = EXTRA_QUESTIONS.some(q => extraAnswers[q.id]);

  return (
    <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: '#fff', position: 'relative' }}>

      {/* ── 상단 고정 헤더 ── */}
      <div style={s.stickyHeader}>
        <button style={s.iconBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>{profile.name}</span>
        <button style={s.iconBtn} onClick={() => showToast('신고 기능은 준비 중이에요')}>
          <AlertTriangle size={18} color="var(--sub)" />
        </button>
      </div>

      <div style={{ paddingBottom: 110 }}>

        {/* ── 대표 사진 ── */}
        <div style={s.heroWrap}>
          {photos.length > 0 ? (
            <>
              <img
                src={`/uploads/${photos[currentPhoto]?.fileName}`}
                alt={profile.name}
                style={s.heroImg}
              />
              {photos.length > 1 && (
                <div style={s.dotRow}>
                  {photos.slice(0, 6).map((_, i) => (
                    <button
                      key={i}
                      style={{ ...s.dot, background: i === currentPhoto ? '#fff' : 'rgba(255,255,255,0.45)' }}
                      onClick={() => setCurrentPhoto(i)}
                    />
                  ))}
                </div>
              )}
              <div style={s.tapLeft}  onClick={() => setCurrentPhoto(p => Math.max(0, p - 1))} />
              <div style={s.tapRight} onClick={() => setCurrentPhoto(p => Math.min(photos.length - 1, p + 1))} />
            </>
          ) : (
            <div style={s.photoFallback}>
              <User size={80} color={PRIMARY} strokeWidth={1.2} />
            </div>
          )}
        </div>

        {/* ── 이름 / MBTI ── */}
        <div style={s.nameSect}>
          <h1 style={s.nameText}>{profile.name}, {age}세</h1>
          {mbti && <p style={s.mbtiText}>{mbti}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <span style={s.badgePrimary}>
              <CheckCircle size={12} color={PRIMARY} style={{ display: 'inline', marginRight: 4 }} />
              나이·성별 인증
            </span>
            {profile.emailVerified && (
              <span style={s.badgePrimary}>
                <Mail size={12} color={PRIMARY} style={{ display: 'inline', marginRight: 4 }} />
                이메일 인증
              </span>
            )}
          </div>
        </div>

        {/* ── 공강 시간 (FREETIME only) ── */}
        {matchType === 'FREETIME' && state?.matchedDate && (
          <>
            <div style={s.divider} />
            <div style={s.sect}>
              <p style={{ ...s.sectLabel, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="#888" /> 오늘의 공강 시간
              </p>
              <p style={s.gongTime}>
                {state.matchedDate} · {fmtTime(state.overlapStart)} ~ {fmtTime(state.overlapEnd)}
              </p>
            </div>
          </>
        )}

        <div style={s.divider} />

        {/* ── 기본 정보 행 ── */}
        <div style={s.sect}>
          <InfoRow Icon={GraduationCap} text={`학부 (대학생) · ${profile.department || '미입력'}`} />
          <InfoRow Icon={BookOpen}      text={`${profile.grade ? profile.grade + '학년' : '학년 미입력'}`} />
          {profile.rankTier && (
            <InfoRow
              Icon={Trophy}
              text={`${TIER_LABEL[profile.rankTier] || profile.rankTier}`}
              last
            />
          )}
        </div>

        {/* ── 한 마디 (bio) ── */}
        {profile.bio && (
          <>
            <div style={s.divider} />
            <div style={s.sect}>
              <h2 style={s.qaQuestion}>한 마디로 소개하면</h2>
              <p style={s.qaAnswer}>{profile.bio}</p>
            </div>
          </>
        )}

        {/* ── Q&A 섹션 ── */}
        {hasQA && EXTRA_QUESTIONS.map((q, i) => {
          const answer  = extraAnswers[q.id];
          if (!answer) return null;
          const midPhoto = photos[i + 1];
          return (
            <div key={q.id}>
              <div style={s.divider} />
              <div style={s.sect}>
                <h2 style={s.qaQuestion}>{q.label}</h2>
                <p style={s.qaAnswer}>{answer}</p>
              </div>
              {midPhoto && (
                <img src={`/uploads/${midPhoto.fileName}`} alt="" style={s.midPhoto} />
              )}
            </div>
          );
        })}

        <div style={{ height: 20 }} />
      </div>

      {/* ── 하단 고정 액션 버튼 ── */}
      <div style={s.bottomBar}>
        <ActionBtn
          Icon={RefreshCw}
          label="다음"
          btnStyle={s.btnGray}
          iconColor="#555"
          disabled={!!acting}
          loading={acting === 'reroll'}
          onClick={handleReroll}
        />
        <ActionBtn
          Icon={Heart}
          label="수락"
          btnStyle={s.btnPink}
          iconColor="#fff"
          fill
          disabled={!!acting}
          loading={acting === 'accept'}
          onClick={handleAccept}
        />
        <ActionBtn
          Icon={MessageCircle}
          label="채팅"
          btnStyle={s.btnDark}
          iconColor="#fff"
          disabled={!!acting}
          loading={acting === 'chat'}
          onClick={handleChat}
        />
      </div>

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  );
}

// ── 서브 컴포넌트 ──────────────────────────────
function InfoRow({ Icon, text, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 0',
      borderBottom: last ? 'none' : '1px solid #F4F6FB',
    }}>
      <Icon size={20} color={PRIMARY} strokeWidth={1.8} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 15, color: '#333' }}>{text}</span>
    </div>
  );
}

function ActionBtn({ Icon, label, btnStyle, iconColor, fill, disabled, loading, onClick }) {
  return (
    <div style={s.actionGroup}>
      <button
        style={{ ...s.actionBtn, ...btnStyle, opacity: disabled ? 0.5 : 1 }}
        disabled={disabled}
        onClick={onClick}
      >
        {loading
          ? <span style={s.spinnerSmall} />
          : <Icon size={24} color={iconColor} fill={fill ? iconColor : 'none'} strokeWidth={fill ? 0 : 2} />
        }
      </button>
      <span style={s.actionLabel}>{label}</span>
    </div>
  );
}

// ── 스타일 ─────────────────────────────────────
const s = {
  center: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100dvh', gap: 12, background: '#fff',
  },
  spinner: {
    width: 36, height: 36, borderRadius: 18,
    border: `3px solid ${PRIMARY_BG}`,
    borderTopColor: PRIMARY,
    animation: 'spin 0.8s linear infinite',
  },
  spinnerSmall: {
    display: 'inline-block',
    width: 20, height: 20, borderRadius: 10,
    border: '2.5px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff',
    animation: 'spin 0.8s linear infinite',
  },
  backBtn: {
    padding: '10px 24px', borderRadius: 12,
    background: PRIMARY, color: '#fff',
    border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
  },
  stickyHeader: {
    position: 'sticky', top: 0, zIndex: 50,
    background: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid #F4F6FB',
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    background: '#F8F9FB', border: 'none',
    fontSize: 18, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'inherit',
  },
  headerTitle: { fontSize: 16, fontWeight: 700, color: '#111' },
  heroWrap: {
    position: 'relative', width: '100%', height: 420,
    background: '#EAF0FB', overflow: 'hidden',
  },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  photoFallback: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#EAF0FB',
  },
  dotRow: {
    position: 'absolute', bottom: 14, left: 0, right: 0,
    display: 'flex', justifyContent: 'center', gap: 6, pointerEvents: 'none',
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    border: 'none', cursor: 'pointer', padding: 0,
    pointerEvents: 'auto',
  },
  tapLeft:  { position: 'absolute', left: 0,  top: 0, width: '40%', height: '100%', cursor: 'pointer' },
  tapRight: { position: 'absolute', right: 0, top: 0, width: '40%', height: '100%', cursor: 'pointer' },
  nameSect: { padding: '22px 24px 18px' },
  nameText: { fontSize: 28, fontWeight: 800, color: '#111', margin: 0 },
  mbtiText: { fontSize: 18, fontWeight: 700, color: '#555', marginTop: 6 },
  badgePrimary: {
    fontSize: 12, color: PRIMARY, fontWeight: 600,
    background: PRIMARY_BG, padding: '4px 12px', borderRadius: 20,
    display: 'inline-flex', alignItems: 'center',
  },
  divider: { height: 8, background: '#F4F6FB' },
  sect: { padding: '16px 24px' },
  sectLabel: { fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 6 },
  gongTime: { fontSize: 18, fontWeight: 800, color: '#111' },
  qaQuestion: { fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 12 },
  qaAnswer: { fontSize: 15, color: '#555', lineHeight: 1.8, whiteSpace: 'pre-wrap' },
  midPhoto: { width: '100%', maxHeight: 360, objectFit: 'cover' },
  bottomBar: {
    position: 'fixed', bottom: 0,
    left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 430,
    background: '#fff',
    padding: '16px 40px 28px',
    display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    borderTop: '1px solid #F4F6FB',
    boxSizing: 'border-box',
    zIndex: 40,
  },
  actionGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  actionBtn: {
    width: 62, height: 62, borderRadius: 31,
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.12s',
  },
  btnGray: { background: '#F4F6FB', color: '#555' },
  btnPink: { background: '#FF6B9D', color: '#fff' },
  btnDark: { background: '#111', color: '#fff' },
  actionLabel: { fontSize: 12, color: '#888', fontWeight: 600 },
  toast: {
    position: 'fixed', bottom: 120,
    left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(17,17,17,0.88)',
    color: '#fff', fontSize: 13, fontWeight: 600,
    padding: '10px 20px', borderRadius: 24,
    whiteSpace: 'nowrap', zIndex: 100,
    backdropFilter: 'blur(6px)',
  },
};

if (typeof document !== 'undefined' && !document.getElementById('spin-style')) {
  const el = document.createElement('style');
  el.id = 'spin-style';
  el.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(el);
}
