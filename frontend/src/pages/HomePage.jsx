import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { user as userApi, freeTime, matching, timetable, photo as photoApi } from '../api/client';
import BottomTabBar from '../components/BottomTabBar';
import { Bell, User, Calendar, Clock, Loader2, Trophy, Heart, ChevronRight } from 'lucide-react';

// ── 자정 카운트다운 훅 ─────────────────────────
function useMidnightCountdown() {
  const calc = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.max(0, midnight - now);
    const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const sv = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    return `${h}:${m}:${sv}`;
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ── 디자인 토큰 ────────────────────────────────
const PRIMARY    = '#003087';
const PRIMARY_BG = '#EAF0FB';

// ── 티어 ───────────────────────────────────────
const TIER_COLOR = { BRONZE:'#8a5a1a', SILVER:'#555', GOLD:'#8a6a00', PLATINUM:'#0a7a7a', DIAMOND:'#4a1aaa' };
const TIER_BG    = { BRONZE:'#f5e0c3', SILVER:'#e8e8e8', GOLD:'#fff0c0', PLATINUM:'#d0f0f0', DIAMOND:'#e0d4ff' };
const TIER_LABEL = { BRONZE:'BRONZE', SILVER:'SILVER', GOLD:'GOLD', PLATINUM:'PLATINUM', DIAMOND:'DIAMOND' };

function calcAge(birthDate) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
}

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr < 12 ? '오전' : '오후'} ${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m}`;
}

// ── 메인 컴포넌트 ──────────────────────────────
export default function HomePage() {
  const navigate    = useNavigate();
  const { userInfo } = useAuth();
  const [tab,           setTab]           = useState('gonggang');
  const [pending,       setPending]       = useState([]);
  const [actives,       setActives]       = useState([]);
  const [ttReg,         setTtReg]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [photoMap,      setPhotoMap]      = useState({});       // freetime partnerId → URL
  const [chatPartnerMap, setChatPartnerMap] = useState({});     // active match partnerId → profile

  const userId    = userInfo?.userId;
  const tier      = userInfo?.rankTier || 'BRONZE';
  const countdown = useMidnightCountdown();

  // 첫 로그인: bio 없으면 프로필 설정으로
  useEffect(() => {
    if (!userId) return;
    userApi.get(userId).then(p => {
      if (!p?.bio) navigate('/profile/setup', { replace: true });
    }).catch(() => {});
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [p, a, s] = await Promise.allSettled([
      freeTime.pending(userId),
      matching.active(userId),
      timetable.status(userId),
    ]);

    const pData = p.status === 'fulfilled' ? (p.value || []) : [];
    const aData = a.status === 'fulfilled' ? (a.value || []) : [];
    setPending(pData);
    setActives(aData);
    setTtReg(s.status === 'fulfilled' ? (s.value?.registered ?? false) : false);
    setLoading(false);

    // ── 공강 대기 파트너 대표 사진 ──
    for (const req of pData) {
      if (!req.partnerId) continue;
      try {
        const photos = await photoApi.list(req.partnerId);
        const primary = (photos || []).sort((a, b) => {
          if (a.isPrimary) return -1; if (b.isPrimary) return 1;
          return (a.photoOrder || 0) - (b.photoOrder || 0);
        })[0];
        if (primary?.fileName)
          setPhotoMap(prev => ({ ...prev, [req.partnerId]: `/uploads/${primary.fileName}` }));
      } catch {}
    }

    // ── 활성 매칭(채팅 중) 파트너 프로필 + 사진 ──
    for (const match of aData) {
      const pId = match.partnerId;
      if (!pId) continue;
      try {
        const [photos, profile, prefRes] = await Promise.all([
          photoApi.list(pId).catch(() => []),
          userApi.get(pId).catch(() => null),
          userApi.getPreferences(pId).catch(() => null),
        ]);
        const primary = (photos || []).sort((a, b) => {
          if (a.isPrimary) return -1; if (b.isPrimary) return 1;
          return (a.photoOrder || 0) - (b.photoOrder || 0);
        })[0];
        const mbti = prefRes?.preferences?.mbti || null;
        setChatPartnerMap(prev => ({
          ...prev,
          [pId]: {
            matchId:    match.matchId,
            name:       match.partnerName,
            photo:      primary?.fileName ? `/uploads/${primary.fileName}` : null,
            birthDate:  profile?.birthDate,
            department: profile?.department,
            grade:      profile?.grade,
            mbti,
            rankTier:   profile?.rankTier,
          },
        }));
      } catch {}
    }
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const goProfile = (req) =>
    navigate(`/partner/${req.partnerId}`, {
      state: {
        requestId:    req.requestId,
        matchType:    'FREETIME',
        matchedDate:  req.matchedDate,
        overlapStart: req.overlapStart,
        overlapEnd:   req.overlapEnd,
      },
    });

  return (
    <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ flex: 1, paddingBottom: 80, overflowY: 'auto' }}>

        {/* ── 헤더 ── */}
        <header style={s.header}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <button style={tab === 'gonggang' ? s.tabTitleOn : s.tabTitleOff} onClick={() => setTab('gonggang')}>
                공강매칭
              </button>
              <button style={tab === 'rank' ? s.tabTitleOn : s.tabTitleOff} onClick={() => setTab('rank')}>
                랭크매칭
              </button>
            </div>
            <span style={s.tabSubtitle}>
              {tab === 'gonggang' ? '공강 시간이 겹치는 상대를 소개해드려요.' : '나와 티어가 비슷한 상대를 소개해드려요.'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button style={s.iconBtn}><Bell size={18} color="#555" /></button>
            <button style={s.avatarBtn} onClick={() => navigate('/mypage')}><User size={18} color={PRIMARY} /></button>
          </div>
        </header>

        {/* ── 탭 콘텐츠 ── */}
        {tab === 'gonggang' && (
          <div key="gonggang" className="tab-transition">
          <GonggangTab
            loading={loading}
            pending={pending}
            ttReg={ttReg}
            photoMap={photoMap}
            actives={actives}
            chatPartnerMap={chatPartnerMap}
            tier={tier}
            userId={userId}
            onCardClick={goProfile}
            onRegister={() => navigate('/match/freetime')}
            onRankTab={() => setTab('rank')}
            countdown={countdown}
            navigate={navigate}
          />
          </div>
        )}

        {tab === 'rank' && (
          <div key="rank" className="tab-transition">
          <RankTab
            actives={actives}
            loading={loading}
            userId={userId}
            tier={tier}
            navigate={navigate}
          />
          </div>
        )}
      </div>
      <BottomTabBar />
    </div>
  );
}

// ── 공강매칭 탭 ────────────────────────────────
function GonggangTab({ loading, pending, ttReg, photoMap, actives, chatPartnerMap, onCardClick, onRegister, onRankTab, countdown, navigate }) {

  // 시간표 미등록: 캐러셀 없이 안내 카드만
  if (!loading && ttReg === false) {
    return (
      <div>
        <p style={s.sectionLabel}>오늘의 인연</p>
        <div style={s.stateBox}>
          <Calendar size={54} color={PRIMARY} strokeWidth={1.5} />
          <p style={{ fontSize: 18, fontWeight: 800, color: '#111', marginTop: 14 }}>에브리타임 시간표를 등록해보세요</p>
          <p style={{ fontSize: 14, color: '#888', marginTop: 8, lineHeight: 1.7, textAlign: 'center' }}>
            공강 시간이 겹치는 이성과<br />매일 자정 자동으로 매칭돼요
          </p>
          <button style={s.ctaBtn} onClick={onRegister}>시간표 등록하기 →</button>
        </div>
      </div>
    );
  }

  // 슬라이드 목록 구성
  const slides = [];

  if (loading) {
    slides.push({ type: 'loading' });
  } else if (pending.length === 0) {
    slides.push({ type: 'empty' });
  } else {
    pending.forEach(req => slides.push({ type: 'freetime', req }));
  }

  // 채팅 중인 파트너 카드
  actives.forEach(match => {
    const info = chatPartnerMap[match.partnerId];
    if (info) slides.push({ type: 'chat', info, matchId: match.matchId, partnerId: match.partnerId });
  });

  // 끝 카드
  if (!loading) slides.push({ type: 'end' });

  return (
    <div>
      <p style={s.sectionLabel}>오늘의 인연</p>
      <SwipeCarousel
        slides={slides}
        countdown={countdown}
        photoMap={photoMap}
        onFreeTimeClick={onCardClick}
        onRankTab={onRankTab}
        navigate={navigate}
      />
    </div>
  );
}

// ── 스와이프 캐러셀 ────────────────────────────
const PEEK = 20;  // 양쪽 미리보기 px
const GAP  = 14;  // 카드 간격 px

function SwipeCarousel({ slides, countdown, photoMap, onFreeTimeClick, onRankTab, navigate }) {
  const wrapRef  = useRef(null);
  const [cardW,   setCardW]   = useState('');
  const [sidePad, setSidePad] = useState(PEEK + GAP); // 34px fallback

  useEffect(() => {
    if (!wrapRef.current) return;
    const cw = wrapRef.current.clientWidth;
    // cardWidth = 컨테이너 - 양쪽(peek + gap) * 2
    setCardW(`${cw - 2 * (PEEK + GAP)}px`);
    setSidePad(PEEK + GAP); // = 34px
  }, []);

  return (
    <div ref={wrapRef} style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          gap: GAP,
          padding: `0 ${sidePad}px 4px`,
          overflowX: 'scroll',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {slides.map((slide, i) => (
          <div key={i} style={{ flexShrink: 0, width: cardW || `calc(100% - ${2*(PEEK+GAP)}px)`, scrollSnapAlign: 'center' }}>
            {slide.type === 'loading'  && <LoadingSlide />}
            {slide.type === 'empty'    && <EmptySlide countdown={countdown} />}
            {slide.type === 'freetime' && (
              <FreeTimeSlide
                req={slide.req}
                photoUrl={photoMap?.[slide.req.partnerId] || null}
                onClick={() => onFreeTimeClick(slide.req)}
              />
            )}
            {slide.type === 'chat' && (
              <ChatProfileSlide
                info={slide.info}
                onClick={() => navigate(`/partner/${slide.partnerId}`, { state: { matchId: slide.matchId } })}
              />
            )}
            {slide.type === 'end' && <EndSlide onRankTab={onRankTab} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 슬라이드: 로딩 ─────────────────────────────
function LoadingSlide() {
  return (
    <div style={{ ...s.slideBox, justifyContent: 'center' }}>
      <Loader2 size={36} color="#CCC" />
    </div>
  );
}

// ── 슬라이드: 오늘 매칭 없음 ───────────────────
function EmptySlide({ countdown }) {
  return (
    <div style={s.slideBox}>
      <Clock size={48} color="#CCC" strokeWidth={1.5} />
      <p style={{ fontSize: 20, fontWeight: 800, color: '#111', marginTop: 16 }}>오늘은 매칭이 없어요</p>
      <p style={{ fontSize: 13, color: '#bbb', marginTop: 6 }}>내일 자정 새로운 인연이 소개될 거예요</p>
      <div style={{ marginTop: 20, padding: '14px 28px', background: PRIMARY_BG, borderRadius: 16, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>매칭까지 남은 시간</p>
        <p style={{ fontSize: 34, fontWeight: 900, color: PRIMARY, letterSpacing: 2, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>
          {countdown}
        </p>
      </div>
    </div>
  );
}

// ── 슬라이드: 공강 파트너 (기존 스타일 유지) ────
function FreeTimeSlide({ req, photoUrl, onClick }) {
  return (
    <div style={{ ...s.cardSlide, cursor: 'pointer' }} onClick={onClick}>
      {/* 사진 */}
      <div style={s.cardPhotoWrap}>
        {photoUrl ? (
          <img src={photoUrl} alt={req.partnerName} style={s.cardPhoto}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
        ) : null}
        <div style={{ ...s.cardPhotoFallback, display: photoUrl ? 'none' : 'flex' }}>
          <User size={72} color={PRIMARY} strokeWidth={1.2} />
        </div>
        {req.matchedDate && (
          <div style={s.timeOverlay}>
            <Calendar size={12} color="#fff" />
            <span>{req.matchedDate} · {fmtTime(req.overlapStart)} ~ {fmtTime(req.overlapEnd)}</span>
          </div>
        )}
      </div>
      {/* 정보 */}
      <div style={s.cardInfo}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={s.cardName}>{req.partnerName}</p>
            <p style={s.cardSub}>공강 매칭 · 프로필 보기 →</p>
          </div>
          <ChevronRight size={18} color="#CCC" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

// ── 슬라이드: 채팅 중인 파트너 프로필 ──────────
function ChatProfileSlide({ info, onClick }) {
  const age  = calcAge(info.birthDate);
  const tier = info.rankTier;

  return (
    <div style={{ ...s.cardSlide, cursor: 'pointer' }} onClick={onClick}>
      {/* 사진 (카드 상단 60%) */}
      <div style={s.profilePhotoWrap}>
        {info.photo ? (
          <img src={info.photo} alt={info.name} style={s.cardPhoto}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
        ) : null}
        <div style={{ ...s.cardPhotoFallback, display: info.photo ? 'none' : 'flex' }}>
          <User size={72} color={PRIMARY} strokeWidth={1.2} />
        </div>

        {/* 채팅 중 배지 */}
        <div style={s.chatBadge}>
          <div style={s.chatBadgeDot} />
          <span>대화 중</span>
        </div>
      </div>

      {/* 정보 (카드 하단 40%) — 흰 배경 */}
      <div style={s.profileInfo}>
        {/* 이름 + 나이 */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: 0 }}>{info.name}</p>
          {age && <p style={{ fontSize: 15, color: '#666', margin: 0 }}>{age}세</p>}
        </div>

        {/* 학과 */}
        <p style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
          {info.department || '학과 정보 없음'}
          {info.grade ? ` · ${info.grade}학년` : ''}
        </p>

        {/* MBTI + 티어 칩 */}
        <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={s.chipGray}>
            {info.mbti || '미입력'}
          </span>
          {tier && (
            <span style={{ ...s.chipGray, background: TIER_BG[tier] || '#f0f0f0', color: TIER_COLOR[tier] || '#555' }}>
              {TIER_LABEL[tier] || tier}
            </span>
          )}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10 }}>
          <p style={{ fontSize: 13, color: PRIMARY, fontWeight: 600, margin: 0 }}>프로필 자세히 보기</p>
          <ChevronRight size={14} color={PRIMARY} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

// ── 슬라이드: 끝 카드 ─────────────────────────
function EndSlide({ onRankTab }) {
  return (
    <div style={s.slideBox}>
      <Trophy size={40} color="#003087" strokeWidth={1.5} style={{ marginBottom: 8 }} />
      <p style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>오늘의 카드 끝!</p>
      <p style={{ fontSize: 13, color: '#aaa', marginTop: 6, lineHeight: 1.6, textAlign: 'center' }}>
        공강 매칭 외에도<br />랭크 매칭으로 더 많은 인연을 만나보세요
      </p>
      <button
        style={{ ...s.ctaBtn, marginTop: 22, display: 'flex', alignItems: 'center', gap: 8 }}
        onClick={onRankTab}
      >
        <Trophy size={16} color="#fff" />
        랭크 매칭 바로가기
      </button>
    </div>
  );
}

// ── 랭크매칭 탭 ────────────────────────────────
function RankTab({ actives, loading, userId, tier, navigate }) {
  const [queuing, setQueuing] = useState(false);
  const [inQueue, setInQueue] = useState(false);

  const handleEnterQueue = async () => {
    setQueuing(true);
    try { await matching.enterRank(userId); setInQueue(true); }
    catch (e) { alert(e?.message || '대기열 등록에 실패했어요.'); }
    finally { setQueuing(false); }
  };

  const handleCancelQueue = async () => {
    setQueuing(true);
    try { await matching.cancelRank(userId); setInQueue(false); }
    catch (e) { alert(e?.message || '취소에 실패했어요.'); }
    finally { setQueuing(false); }
  };

  const rankActives = (actives || []).filter(m => m.matchType === 'RANK');

  return (
    <div>
      <p style={s.subtitle}>rankScore 기반으로 나와 맞는 이성을 찾아요</p>

      {/* 내 티어 카드 */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ ...s.tierCard, background: TIER_BG[tier] || '#f0f0f0' }}>
          <div>
            <p style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 4 }}>내 티어</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: TIER_COLOR[tier] || '#333' }}>
              {TIER_LABEL[tier] || tier}
            </p>
          </div>
          <Trophy size={40} color={TIER_COLOR[tier] || '#888'} strokeWidth={1.5} />
        </div>
      </div>

      {/* 진행 중 랭크 매칭 */}
      {rankActives.length > 0 && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 10 }}>
            <Heart size={15} color="#FF6B9D" fill="#FF6B9D" />
            진행 중인 랭크 매칭
          </div>
          {rankActives.map(m => (
            <button key={m.matchId} style={s.activeRow}
              onClick={() => navigate(`/partner/${m.partnerId}`, { state: { matchId: m.matchId, matchType: 'RANK' } })}>
              <div style={s.activeAvatar}><User size={24} color={PRIMARY} /></div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{m.partnerName || '상대방'}</p>
                <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>채팅하러 가기</p>
              </div>
              <ChevronRight size={16} color="#CCC" strokeWidth={2.5} />
            </button>
          ))}
        </div>
      )}

      {/* 대기 중 or CTA */}
      <div style={{ padding: '0 20px' }}>
        {inQueue ? (
          <div style={s.queueCard}>
            <div style={s.queueDot} />
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>매칭 대기 중이에요</p>
              <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>rankScore가 비슷한 이성을 찾고 있어요</p>
            </div>
            <button style={{ ...s.cancelBtn, marginLeft: 'auto' }} disabled={queuing} onClick={handleCancelQueue}>취소</button>
          </div>
        ) : (
          <button style={s.ctaBtnFull} disabled={queuing} onClick={handleEnterQueue}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Trophy size={16} color="#fff" />
              {queuing ? '처리 중...' : '랭크 매칭 시작하기'}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

// ── 스타일 ─────────────────────────────────────
const CARD_H     = 460; // 카드 전체 높이 (px)
const PHOTO_H    = Math.round(CARD_H * 0.60); // 60% 사진
const INFO_H     = CARD_H - PHOTO_H;          // 40% 정보

const s = {
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px 34px 14px',
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    background: '#F4F6FB', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 12,
    background: PRIMARY_BG, border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  tabTitleOn:  { background: 'none', border: 'none', padding: 0, fontSize: 26, fontWeight: 900, color: '#111', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: -0.5 },
  tabTitleOff: { background: 'none', border: 'none', padding: 0, fontSize: 26, fontWeight: 900, color: '#CCC', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: -0.5 },
  tabSubtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  subtitle:    { fontSize: 13, color: '#888', padding: '12px 20px 16px', lineHeight: 1.5 },
  sectionLabel: { fontSize: 18, fontWeight: 800, color: '#111', padding: '12px 34px 14px', margin: 0 },

  // 공통 슬라이드 박스 (빈 상태 / 끝 카드)
  slideBox: {
    height: CARD_H,
    background: '#F8F9FB',
    borderRadius: 20,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '32px 28px',
    textAlign: 'center',
    boxSizing: 'border-box',
  },

  // 카드 (사진 + 정보)
  cardSlide: {
    height: CARD_H,
    borderRadius: 20,
    overflow: 'hidden',
    background: '#fff',
    boxSizing: 'border-box',
  },

  // 공강 매칭 사진 영역
  cardPhotoWrap: {
    width: '100%', height: PHOTO_H, position: 'relative',
    background: '#EAF0FB', overflow: 'hidden',
  },
  // 채팅 파트너 프로필 사진 영역 (동일 높이)
  profilePhotoWrap: {
    width: '100%', height: PHOTO_H, position: 'relative',
    background: '#EAF0FB', overflow: 'hidden',
  },
  cardPhoto: {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
  },
  cardPhotoFallback: {
    width: '100%', height: '100%',
    background: '#EAF0FB',
    alignItems: 'center', justifyContent: 'center',
  },
  timeOverlay: {
    position: 'absolute', bottom: 12, left: 12,
    background: 'rgba(0,0,0,0.55)', color: '#fff',
    fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 20,
    display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(4px)',
  },
  chatBadge: {
    position: 'absolute', top: 12, right: 12,
    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
    color: '#fff', fontSize: 11, fontWeight: 700,
    padding: '5px 10px', borderRadius: 20,
    display: 'flex', alignItems: 'center', gap: 5,
  },
  chatBadgeDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#34C759',
  },

  // 공강 카드 정보 영역
  cardInfo: {
    padding: '16px 18px', height: INFO_H, boxSizing: 'border-box',
    background: '#F4F6FA',
  },
  cardName: { fontSize: 20, fontWeight: 800, color: '#111' },
  cardSub:  { fontSize: 13, color: PRIMARY, marginTop: 4, fontWeight: 600 },

  // 프로필 카드 정보 영역
  profileInfo: {
    height: INFO_H, background: '#F4F6FA',
    padding: '16px 18px', boxSizing: 'border-box',
  },

  // 칩
  chipGray: {
    display: 'inline-block',
    padding: '4px 10px', borderRadius: 20,
    background: '#F4F6FA', color: '#555',
    fontSize: 12, fontWeight: 600,
  },

  // 상태 박스
  stateBox: {
    margin: '0 20px',
    background: '#F8F9FB', borderRadius: 20,
    border: '1.5px solid #EFEFEF',
    padding: '40px 24px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  ctaBtn: {
    marginTop: 20, padding: '12px 28px', borderRadius: 24,
    background: PRIMARY, color: '#fff',
    border: 'none', cursor: 'pointer',
    fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
  },

  // 랭크탭
  tierCard: {
    borderRadius: 16, padding: '18px 20px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  activeRow: {
    width: '100%', background: '#F8F9FB',
    border: '1.5px solid #EFEFEF', borderRadius: 14,
    padding: '14px 16px', marginBottom: 8,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
    fontFamily: 'inherit', boxSizing: 'border-box',
  },
  activeAvatar: {
    width: 46, height: 46, borderRadius: 12,
    background: PRIMARY_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  queueCard: {
    background: '#F0FBF4', borderRadius: 16, border: '1.5px solid #B5EAC8',
    padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
  },
  queueDot: {
    width: 12, height: 12, borderRadius: 6,
    background: '#22C55E', boxShadow: '0 0 0 4px #B5EAC820', flexShrink: 0,
  },
  cancelBtn: {
    padding: '6px 14px', borderRadius: 20,
    border: '1.5px solid #CCC', background: '#fff',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#555',
  },
  ctaBtnFull: {
    width: '100%', padding: '16px', borderRadius: 16,
    background: PRIMARY, color: '#fff',
    border: 'none', cursor: 'pointer',
    fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
  },
};
