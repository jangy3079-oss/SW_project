import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { user as userApi, freeTime, matching, timetable, photo as photoApi, likes } from '../api/client';
import { useGems, GEM_COSTS } from '../contexts/GemsContext';
import { User, Calendar, Clock, Loader2, Trophy, Heart, ChevronRight, Sparkles, CreditCard, Wallet, Landmark, Smartphone, CheckCircle, Circle } from 'lucide-react';
import AuthImage from '../components/AuthImage';

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
// MyPage의 TIER_META와 동일한 색상값으로 통일
const TIER_COLOR = { UNRANKED:'#666666', BRONZE:'#CD7F32', SILVER:'#A8A9AD', GOLD:'#FFD700', PLATINUM:'#5AA9E6', DIAMOND:'#B9F2FF' };
const TIER_BG    = { UNRANKED:'#e8e8e8', BRONZE:'#f5e0c3', SILVER:'#e8e8e8', GOLD:'#fff0c0', PLATINUM:'#d0f0f0', DIAMOND:'#e0d4ff' };
const TIER_LABEL = { UNRANKED:'UNRANKED', BRONZE:'BRONZE', SILVER:'SILVER', GOLD:'GOLD', PLATINUM:'PLATINUM', DIAMOND:'DIAMOND' };

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
  const location    = useLocation();
  const { userInfo } = useAuth();
  const [tab,    setTab]    = useState(location.state?.goTab || 'gonggang');
  const [tabDir, setTabDir] = useState('none'); // 'right' | 'left' | 'none'
  const [pending,       setPending]       = useState([]);
  const [actives,       setActives]       = useState([]);
  const [ttReg,         setTtReg]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [chatPartnerMap, setChatPartnerMap] = useState({});     // active match partnerId → profile
  const [receivedLikes,  setReceivedLikes]  = useState([]);     // PENDING 받은 좋아요
  const [likeProfileMap, setLikeProfileMap] = useState({});     // senderId → profile

  const userId    = userInfo?.userId;
  const tier      = userInfo?.rankTier || 'BRONZE';
  const countdown = useMidnightCountdown();
  const { gems }  = useGems();

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

    const [p, a, s, lr] = await Promise.allSettled([
      freeTime.pending(userId),
      matching.active(userId),
      timetable.status(userId),
      likes.received(userId),
    ]);

    const pData  = p.status  === 'fulfilled' ? (p.value  || []) : [];
    const aData  = a.status  === 'fulfilled' ? (a.value  || []) : [];
    const lrData = lr.status === 'fulfilled' ? (lr.value || []) : [];
    setPending(pData);
    setActives(aData);
    setTtReg(s.status === 'fulfilled' ? (s.value?.registered ?? false) : false);
    setLoading(false);

    // ── PENDING 받은 좋아요 ──
    const pendingLikes = lrData.filter(l => l.status === 'PENDING');
    setReceivedLikes(pendingLikes);
    for (const like of pendingLikes) {
      const sid = like.senderId;
      try {
        const [photos, profile] = await Promise.all([
          photoApi.list(sid).catch(() => []),
          userApi.get(sid).catch(() => null),
        ]);
        const primary = (photos || []).sort((a, b) => {
          if (a.isPrimary) return -1; if (b.isPrimary) return 1;
          return (a.photoOrder || 0) - (b.photoOrder || 0);
        })[0];
        setLikeProfileMap(prev => ({
          ...prev,
          [sid]: {
            name:       profile?.name,
            photo:      primary?.fileName ? `/uploads/${primary.fileName}` : null,
            birthDate:  profile?.birthDate,
            department: profile?.department,
            grade:      profile?.grade,
            rankTier:   profile?.rankTier,
          },
        }));
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

  const switchToRank     = useCallback(() => { setTabDir('right'); setTab('rank'); }, []);
  const switchToGonggang = useCallback(() => { setTabDir('left');  setTab('gonggang'); }, []);

  const onLikeAccept = useCallback(async (likeId) => {
    await likes.accept(likeId);
    setReceivedLikes(prev => prev.filter(l => l.likeId !== likeId));
  }, []);

  const onLikeReject = useCallback(async (likeId) => {
    await likes.reject(likeId);
    setReceivedLikes(prev => prev.filter(l => l.likeId !== likeId));
  }, []);

  const [showShop, setShowShop] = useState(false);

  return (
    <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {showShop && <GemShopModal gems={gems} onClose={() => setShowShop(false)} />}
      <div style={{ flex: 1, paddingBottom: 80, overflowY: 'auto' }}>

        {/* ── 헤더 ── */}
        <header style={{ ...s.header, flexDirection: 'column', gap: 0 }}>
          {/* 타이틀(좌) + 재화·아이콘(우) — 한 행 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <button style={tab === 'gonggang' ? s.tabTitleOn : s.tabTitleOff} onClick={switchToGonggang}>
                공강매칭
              </button>
              <button style={tab === 'rank' ? s.tabTitleOn : s.tabTitleOff} onClick={switchToRank}>
                랭크매칭
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setShowShop(true)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: PRIMARY_BG, borderRadius: 20,
                padding: '5px 12px 5px 9px', border: 'none', cursor: 'pointer',
              }}>
                <Sparkles size={14} color={PRIMARY} strokeWidth={2.5} />
                <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>{gems}</span>
              </button>
              <button style={s.avatarBtn} onClick={() => navigate('/mypage')}><User size={18} color={PRIMARY} /></button>
            </div>
          </div>

          {/* 소개글 */}
          <span style={s.tabSubtitle}>
            {tab === 'gonggang' ? '공강 시간이 겹치는 상대를 소개해드려요.' : '나와 티어가 비슷한 상대를 소개해드려요.'}
          </span>
        </header>

        {/* ── 탭 콘텐츠 ── */}
        <div style={{ overflow: 'hidden' }}>
          {tab === 'gonggang' && (
            <div key="gonggang" className={tabDir === 'left' ? 'tab-slide-left' : 'tab-transition'}>
              <GonggangTab
                loading={loading}
                pending={pending}
                ttReg={ttReg}
                actives={actives}
                chatPartnerMap={chatPartnerMap}
                tier={tier}
                userId={userId}
                onRegister={() => navigate('/match/freetime')}
                onRankTab={switchToRank}
                countdown={countdown}
                navigate={navigate}
                receivedLikes={receivedLikes}
                likeProfileMap={likeProfileMap}
                onLikeAccept={onLikeAccept}
                onLikeReject={onLikeReject}
              />
            </div>
          )}

          {tab === 'rank' && (
            <div key="rank" className={tabDir === 'right' ? 'tab-slide-right' : 'tab-transition'}>
              <RankCardSection
                actives={actives}
                userId={userId}
                tier={tier}
                navigate={navigate}
                chatPartnerMap={chatPartnerMap}
                receivedLikes={receivedLikes}
                likeProfileMap={likeProfileMap}
                onLikeAccept={onLikeAccept}
                onLikeReject={onLikeReject}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 공강매칭 탭 ────────────────────────────────
function GonggangTab({ loading, pending, ttReg, actives, chatPartnerMap, onRegister, onRankTab, countdown, navigate,
                       receivedLikes, likeProfileMap, onLikeAccept, onLikeReject }) {
  const [showLikeDetails, setShowLikeDetails] = useState(false);

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
        {(receivedLikes || []).length > 0 && (
          <ReceivedLikesTeaserCard
            count={receivedLikes.length}
            onClick={() => setShowLikeDetails(v => !v)}
          />
        )}
        {showLikeDetails && (receivedLikes || []).length > 0 && (
          <ReceivedLikesSection
            likes={receivedLikes}
            profileMap={likeProfileMap}
            onAccept={onLikeAccept}
            onReject={onLikeReject}
          />
        )}
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
    // 티저 카드 하나만 — 클릭 시 /match/freetime/pick 으로 이동
    slides.push({ type: 'freetime-teaser', count: pending.length });
  }

  // 받은 좋아요 티저 슬라이드
  if (!loading && (receivedLikes || []).length > 0) {
    slides.push({ type: 'received-likes-teaser', count: receivedLikes.length });
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
        onRankTab={onRankTab}
        navigate={navigate}
        onReceivedLikesTap={() => setShowLikeDetails(v => !v)}
      />
      {showLikeDetails && (receivedLikes || []).length > 0 && (
        <ReceivedLikesSection
          likes={receivedLikes}
          profileMap={likeProfileMap}
          onAccept={onLikeAccept}
          onReject={onLikeReject}
        />
      )}
    </div>
  );
}

// ── 스와이프 캐러셀 ────────────────────────────
const PEEK = 20;  // 양쪽 미리보기 px
const GAP  = 14;  // 카드 간격 px

function SwipeCarousel({ slides, countdown, onRankTab, navigate, onReceivedLikesTap }) {
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
    <div ref={wrapRef} style={{ overflow: 'hidden', padding: '12px 0', margin: '-12px 0' }}>
      <div
        style={{
          display: 'flex',
          gap: GAP,
          padding: `12px ${sidePad}px`,
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
            {slide.type === 'freetime-teaser' && (
              <FreeTimeTeaserSlide
                count={slide.count}
                onClick={() => navigate('/match/freetime/pick')}
              />
            )}
            {slide.type === 'chat' && (
              <ChatProfileSlide
                info={slide.info}
                onClick={() => navigate(`/partner/${slide.partnerId}`, { state: { matchId: slide.matchId } })}
              />
            )}
            {slide.type === 'received-likes-teaser' && (
              <ReceivedLikesTeaserSlide count={slide.count} onClick={onReceivedLikesTap} />
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

// ── 슬라이드: 공강 매칭 티저 ─────────────────────
function FreeTimeTeaserSlide({ count, onClick }) {
  return (
    <div
      style={{
        ...s.slideBox,
        background: '#fff',
        cursor: 'pointer',
        gap: 0,
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '28px 24px 24px',
        boxSizing: 'border-box',
        textAlign: 'left',
      }}
      onClick={onClick}
    >
      {/* 뱃지 */}
      <span style={{
        fontSize: 12, fontWeight: 700, color: PRIMARY,
        background: PRIMARY_BG, borderRadius: 8,
        padding: '4px 10px', letterSpacing: 0.3,
      }}>
        공강 매칭
      </span>

      {/* 타이틀 */}
      <div>
        <p style={{ fontSize: 22, fontWeight: 900, color: '#111', lineHeight: 1.4, margin: '20px 0 0' }}>
          동아줄로 이어질<br />공강 상대가 도착했어요 ✨
        </p>
        <p style={{ fontSize: 14, color: PRIMARY, fontWeight: 600, margin: '10px 0 0' }}>
          {count}명이 기다리고 있어요
        </p>
      </div>

      {/* 풀너비 버튼 */}
      <button
        style={{
          width: '100%', padding: '14px 0', borderRadius: 12, marginTop: 28,
          background: PRIMARY, color: '#fff',
          border: 'none', cursor: 'pointer',
          fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        인연 확인하기
        <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ── 슬라이드: 채팅 중인 파트너 프로필 ──────────
function ChatProfileSlide({ info, onClick }) {
  const age  = calcAge(info.birthDate);
  const tier = info.rankTier;
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = info.photo && !photoFailed;

  return (
    <div style={{ ...s.cardSlide, cursor: 'pointer' }} onClick={onClick}>
      {/* 사진 (카드 상단 60%) */}
      <div style={s.profilePhotoWrap}>
        {showPhoto ? (
          <AuthImage src={info.photo} alt={info.name} style={s.cardPhoto}
            onError={() => setPhotoFailed(true)} />
        ) : null}
        <div style={{ ...s.cardPhotoFallback, display: showPhoto ? 'none' : 'flex' }}>
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
    <div style={{ ...s.slideBox, background: '#fff' }}>
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

// ── 랭크매칭: 카드 섹션 ────────────────────────
function RankCardSection({ actives, userId, tier, navigate, chatPartnerMap, receivedLikes, likeProfileMap, onLikeAccept, onLikeReject }) {
  const [showLikeDetails, setShowLikeDetails] = useState(false);
  const rankActives = (actives || []).filter(m => m.matchType === 'RANK');
  return (
    <div>
      {/* 메인 티저 카드 — 캐러셀과 같은 좌우 패딩 */}
      <div style={{ padding: '63px 34px 12px' }}>
        <RankTeaserCard tier={tier} userId={userId} />
        {/* 랭크 제도 안내 텍스트 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
          <button
            onClick={() => navigate('/mypage/rank')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: PRIMARY, fontWeight: 600, fontFamily: 'inherit',
              padding: '4px 0', textDecoration: 'none',
            }}
          >
            랭크 제도가 궁금하다면?
          </button>
        </div>

        {/* 받은 좋아요 티저 카드 */}
        {(receivedLikes || []).length > 0 && (
          <div style={{ marginTop: 14 }}>
            <ReceivedLikesTeaserCard
              count={receivedLikes.length}
              onClick={() => setShowLikeDetails(v => !v)}
            />
          </div>
        )}
        {showLikeDetails && (receivedLikes || []).length > 0 && (
          <ReceivedLikesSection
            likes={receivedLikes}
            profileMap={likeProfileMap}
            onAccept={onLikeAccept}
            onReject={onLikeReject}
          />
        )}
      </div>

      {/* 진행 중인 랭크 매칭 목록 */}
      {rankActives.length > 0 && (
        <div style={{ padding: '4px 34px 0' }}>
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
    </div>
  );
}

// ── 랭크 티저 카드 ──────────────────────────────
function RankTeaserCard({ tier, userId }) {
  const navigate = useNavigate();
  const [queuing, setQueuing] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const { gems, spendGems, canAfford } = useGems();
  const pollRef = useRef(null);

  // 마운트 시 대기열 상태 복원 (다른 화면 갔다 와도 유지)
  useEffect(() => {
    if (!userId) return;
    matching.rankQueueStatus(userId)
      .then(inQ => setInQueue(!!inQ))
      .catch(() => {});
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 대기 중일 때 3초마다 매칭 완료 여부 체크
  useEffect(() => {
    if (!inQueue || !userId) return;
    pollRef.current = setInterval(async () => {
      try {
        const active = await matching.active(userId);
        const rankMatch = (active || []).find(m => m.matchType === 'RANK');
        if (rankMatch) {
          clearInterval(pollRef.current);
          navigate('/match/success', { state: { match: rankMatch } });
        }
      } catch {}
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [inQueue, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = async () => {
    if (!canAfford(GEM_COSTS.RANK_MATCH)) {
      alert(`랭크 매칭에는 💎 ${GEM_COSTS.RANK_MATCH}개가 필요해요.\n현재 보유: ${gems}개`);
      return;
    }
    setQueuing(true);
    try {
      spendGems(GEM_COSTS.RANK_MATCH);
      const res = await matching.enterRank(userId);
      if (res?.matched) {
        navigate('/match/success', { state: { match: res.match } });
      } else {
        setInQueue(true);
      }
    } catch (e) {
      spendGems(-GEM_COSTS.RANK_MATCH); // API 실패 시 환불
      alert(e?.message || '대기열 등록에 실패했어요.');
    } finally { setQueuing(false); }
  };

  const handleCancel = async () => {
    setQueuing(true);
    try { await matching.cancelRank(userId); setInQueue(false); }
    catch (e) { alert(e?.message || '취소에 실패했어요.'); }
    finally { setQueuing(false); }
  };

  return (
    <div style={{
      height: CARD_H,
      background: '#fff',
      borderRadius: 20,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      padding: '28px 24px 24px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    }}>
      {/* 뱃지 */}
      <span style={{
        fontSize: 12, fontWeight: 700, color: PRIMARY,
        background: PRIMARY_BG, borderRadius: 8,
        padding: '4px 10px', letterSpacing: 0.3,
      }}>
        랭크 매칭
      </span>

      {/* 중앙: 타이틀 + 티어 칩 + 설명 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', gap: 16, padding: '20px 0' }}>
        <p style={{ fontSize: 22, fontWeight: 900, color: '#111', lineHeight: 1.4, margin: 0 }}>
          나와 비슷한 티어의<br />이성을 소개해드려요
        </p>

        {/* 티어 — 배경 없이 텍스트만 */}
        <div>
          <p style={{ fontSize: 34, fontWeight: 900, color: TIER_COLOR[tier] || '#CD7F32', letterSpacing: 1, margin: 0, lineHeight: 1 }}>
            {TIER_LABEL[tier] || tier}
          </p>
          <p style={{ fontSize: 12, color: '#bbb', margin: '4px 0 0', fontWeight: 500 }}>내 티어</p>
        </div>

      </div>

      {/* 하단: 대기 중 상태 or CTA 버튼 */}
      {inQueue ? (
        <div style={{
          width: '100%', background: '#F0FBF4', borderRadius: 14,
          border: '1.5px solid #B5EAC8', padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12, boxSizing: 'border-box',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: '#22C55E', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: 0 }}>매칭 대기 중이에요</p>
            <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>비슷한 상대를 찾고 있어요</p>
          </div>
          <button style={s.cancelBtn} disabled={queuing} onClick={handleCancel}>취소</button>
        </div>
      ) : (
        <button
          style={{
            width: '100%', padding: '14px 0', borderRadius: 12,
            background: PRIMARY, color: '#fff',
            border: 'none', cursor: queuing ? 'default' : 'pointer',
            fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: queuing ? 0.7 : 1,
          }}
          disabled={queuing}
          onClick={handleStart}
        >
          {queuing ? '처리 중...' : '랭크 매칭 시작하기'}
          {!queuing && (
            <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.25)', borderRadius: 10, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={12} color="#fff" strokeWidth={2.5} /> {GEM_COSTS.RANK_MATCH}
            </span>
          )}
        </button>
      )}
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
  tabTitleOn:  { background: 'none', border: 'none', padding: 0, fontSize: 26, fontWeight: 900, color: '#111', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: -0.5, transition: 'color 0.25s ease' },
  tabTitleOff: { background: 'none', border: 'none', padding: 0, fontSize: 26, fontWeight: 900, color: '#CCC', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: -0.5, transition: 'color 0.25s ease' },
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
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },

  // 카드 (사진 + 정보)
  cardSlide: {
    height: CARD_H,
    borderRadius: 20,
    overflow: 'hidden',
    background: '#fff',
    boxSizing: 'border-box',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
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
    height: INFO_H, background: '#fff',
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

// ── 💎 젬 상점 모달 ────────────────────────────
const GEM_PACKAGES = [
  { id: 1, gems: 10,  price: '1,200원',  label: '소량 충전',  badge: null },
  { id: 2, gems: 30,  price: '2,900원',  label: '인기',       badge: 'BEST' },
  { id: 3, gems: 70,  price: '5,900원',  label: '알뜰 충전',  badge: null },
  { id: 4, gems: 150, price: '9,900원',  label: '대용량',     badge: 'SALE' },
];

const PAYMENT_METHODS = [
  { id: 'card',  Icon: CreditCard, label: '신용 · 체크카드', color: '#4A90E2' },
  { id: 'kakao', Icon: Wallet,     label: '카카오페이',      color: '#FFCD00' },
  { id: 'bank',  Icon: Landmark,   label: '계좌이체',        color: '#00B894' },
  { id: 'phone', Icon: Smartphone, label: '휴대폰 결제',     color: '#6C5CE7' },
];

function GemShopModal({ gems, onClose }) {
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState('shop');          // 'shop' | 'payment' | 'done'
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [contentVisible, setContentVisible] = useState(true);
  const sheetRef = useRef(null);

  // 모든 스텝 전환에 공통으로 쓰는 함수
  const goToStep = (nextStep, onSwitch) => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    // ① 현재 높이 고정 (스냅 방지)
    const lockedH = sheet.offsetHeight;
    sheet.style.transition = 'none';
    sheet.style.height = `${lockedH}px`;
    sheet.style.overflow = 'hidden';

    setContentVisible(false);

    setTimeout(() => {
      onSwitch?.();
      setStep(nextStep);

      // ② 새 콘텐츠 DOM 반영 후: auto로 풀어서 실제 높이 측정 → lockedH에서 애니메이션
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          sheet.style.height = 'auto';                    // 실제 콘텐츠 높이로 해제
          const naturalH = Math.min(sheet.offsetHeight, window.innerHeight * 0.88);
          sheet.style.height = `${lockedH}px`;            // 시작점으로 복귀
          void sheet.offsetHeight;                        // reflow 강제
          sheet.style.transition = 'height 0.42s cubic-bezier(0.32, 0.72, 0, 1)';
          sheet.style.height = `${naturalH}px`;           // 목표 높이로 전환
        });
      });
    }, 180);

    setTimeout(() => setContentVisible(true), 340);

    // ③ done은 모달이 곧 닫히므로 cleanup 생략 (cleanup 시 auto 스냅 방지)
    if (nextStep !== 'done') {
      setTimeout(() => {
        if (sheetRef.current) {
          sheetRef.current.style.transition = '';
          sheetRef.current.style.height = '';
          sheetRef.current.style.overflow = '';
        }
      }, 760);
    }
  };

  const handleBuy = () => {
    if (!selected) return;
    goToStep('payment', () => setSelectedPayment(null));
  };

  const handlePaymentConfirm = () => {
    if (!selectedPayment) return;
    goToStep('done');
  };

  const [closing, setClosing] = useState(false);
  const pkg = GEM_PACKAGES.find(p => p.id === selected);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 320);
  };

  return (
    <div
      className={closing ? 'modal-overlay-out' : 'modal-overlay'}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={handleClose}
    >
      <div
        ref={sheetRef}
        className={closing ? 'modal-sheet-out' : 'modal-sheet'}
        style={{
          width: '100%', maxWidth: 430,
          background: '#fff', borderRadius: '24px 24px 0 0',
          padding: '28px 24px 40px',
          maxHeight: '88dvh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* 핸들 */}
        <div style={{ width: 40, height: 4, background: '#E0E0E0', borderRadius: 2, margin: '0 auto 20px' }} />

        {/* 콘텐츠 래퍼 — 스텝 전환 시 페이드 아웃/인 */}
        <div style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
        }}>

          {/* ── SHOP ── */}
          {step === 'shop' && (
            <>
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={22} color={PRIMARY} strokeWidth={2} />
                  젬 충전
                </p>
                <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                  현재 보유 <strong style={{ color: PRIMARY }}>{gems}개</strong>
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {GEM_PACKAGES.map(pkg => {
                  const isSelected = selected === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => setSelected(pkg.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 18px', borderRadius: 14,
                        border: `2px solid ${isSelected ? PRIMARY : '#EFEFEF'}`,
                        background: isSelected ? PRIMARY_BG : '#FAFAFA',
                        cursor: 'pointer', transition: 'border-color 0.2s ease, background 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: isSelected ? PRIMARY : '#E8EEFA',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.2s ease',
                        }}>
                          <Sparkles size={18} color={isSelected ? '#fff' : PRIMARY} strokeWidth={2} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: 0 }}>{pkg.gems}개</p>
                          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{pkg.label}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {pkg.badge && !isSelected && (
                          <span style={{
                            fontSize: 11, fontWeight: 800, color: '#fff',
                            background: pkg.badge === 'BEST' ? '#FF6B9D' : PRIMARY,
                            borderRadius: 6, padding: '2px 7px',
                          }}>{pkg.badge}</span>
                        )}
                        {isSelected
                          ? <CheckCircle size={22} color={PRIMARY} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                          : <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{pkg.price}</span>
                        }
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleBuy}
                disabled={!selected}
                style={{
                  width: '100%', padding: '15px', borderRadius: 14,
                  background: selected ? PRIMARY : '#E0E0E0',
                  color: '#fff', border: 'none',
                  cursor: selected ? 'pointer' : 'not-allowed',
                  fontSize: 16, fontWeight: 800, fontFamily: 'inherit',
                  transition: 'background 0.25s ease',
                }}
              >
                {selected
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Sparkles size={16} color="#fff" strokeWidth={2} />
                      {GEM_PACKAGES.find(p => p.id === selected)?.gems}개 구매하기
                    </span>
                  : '패키지를 선택해주세요'
                }
              </button>
            </>
          )}

          {/* ── PAYMENT ── */}
          {step === 'payment' && (
            <>
              <p style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: '0 0 20px' }}>결제 수단 선택</p>

              {/* 결제 요약 */}
              <div style={{
                background: PRIMARY_BG, borderRadius: 14, padding: '14px 18px',
                display: 'flex', justifyContent: 'space-between', marginBottom: 20,
              }}>
                <span style={{ fontSize: 14, color: '#555', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Sparkles size={14} color={PRIMARY} strokeWidth={2} />
                  {pkg?.gems}개
                </span>
                <span style={{ fontSize: 15, fontWeight: 800, color: PRIMARY }}>{pkg?.price}</span>
              </div>

              {/* 결제 수단 목록 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {PAYMENT_METHODS.map(m => {
                  const isActive = selectedPayment === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedPayment(m.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 18px', borderRadius: 12,
                        border: `1.5px solid ${isActive ? PRIMARY : '#EFEFEF'}`,
                        background: isActive ? PRIMARY_BG : '#FAFAFA',
                        cursor: 'pointer', fontFamily: 'inherit',
                        fontSize: 15, color: '#111',
                        transition: 'border-color 0.2s ease, background 0.2s ease',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: isActive ? `${m.color}30` : `${m.color}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s ease',
                      }}>
                        <m.Icon size={18} color={m.color} strokeWidth={2} />
                      </div>
                      <span style={{ flex: 1, textAlign: 'left' }}>{m.label}</span>
                      <div style={{
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? 'scale(1)' : 'scale(0.6)',
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                      }}>
                        <CheckCircle size={20} color={PRIMARY} strokeWidth={2.5} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 결제하기 버튼 */}
              <button
                onClick={handlePaymentConfirm}
                disabled={!selectedPayment}
                style={{
                  width: '100%', padding: '15px', borderRadius: 14,
                  background: selectedPayment ? PRIMARY : '#E0E0E0',
                  color: selectedPayment ? '#fff' : '#bbb',
                  border: 'none', cursor: selectedPayment ? 'pointer' : 'not-allowed',
                  fontSize: 16, fontWeight: 800, fontFamily: 'inherit',
                  transition: 'background 0.25s ease, color 0.25s ease',
                }}
              >
                {selectedPayment
                  ? `${pkg?.price} 결제하기`
                  : '결제 수단을 선택해주세요'
                }
              </button>
            </>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '24px 0 10px' }}>
              {/* 체크 아이콘 */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#EAF7F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <CheckCircle size={40} color="#00B894" strokeWidth={2} />
              </div>

              <p style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: 0 }}>결제 완료!</p>

              <p style={{ fontSize: 14, color: '#888', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Sparkles size={14} color={PRIMARY} strokeWidth={2} />
                {pkg?.gems}개가 충전되었어요
              </p>

              <button
                onClick={handleClose}
                style={{
                  marginTop: 28, width: '100%', padding: '15px',
                  borderRadius: 14, background: PRIMARY, color: '#fff',
                  border: 'none', cursor: 'pointer',
                  fontSize: 16, fontWeight: 800, fontFamily: 'inherit',
                }}
              >확인</button>
            </div>
          )}

        </div>{/* /콘텐츠 래퍼 */}
      </div>
    </div>
  );
}

// ── 슬라이드: 받은 좋아요 티저 (캐러셀용) ────────────
function ReceivedLikesTeaserSlide({ count, onClick }) {
  return (
    <div
      style={{
        height: 420,
        borderRadius: 20,
        overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '28px 24px 24px',
        boxSizing: 'border-box',
      }}
      onClick={onClick}
    >
      <span style={{
        fontSize: 12, fontWeight: 700, color: PRIMARY,
        background: PRIMARY_BG, borderRadius: 8,
        padding: '4px 10px', letterSpacing: 0.3,
      }}>
        받은 좋아요
      </span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
        <Heart size={44} color="#FF6B9D" strokeWidth={1.5} />
        <p style={{ fontSize: 22, fontWeight: 900, color: '#111', lineHeight: 1.4, margin: '8px 0 0' }}>
          나에게 좋아요를<br />보낸 상대가 있어요
        </p>
        <p style={{ fontSize: 14, color: '#FF6B9D', fontWeight: 600, margin: 0 }}>
          {count}명이 기다리고 있어요
        </p>
      </div>
      <button
        style={{
          width: '100%', padding: '14px 0', borderRadius: 12,
          background: '#FF6B9D', color: '#fff',
          border: 'none', cursor: 'pointer',
          fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        확인하기
        <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ── 카드: 받은 좋아요 티저 (시간표 미등록 / 랭크탭용) ──
function ReceivedLikesTeaserCard({ count, onClick }) {
  return (
    <div
      style={{
        background: '#fff', borderRadius: 20,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: '#FFF0F5', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Heart size={24} color="#FF6B9D" strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: '#111', margin: 0 }}>나에게 좋아요를 보낸 상대가 있어요</p>
        <p style={{ fontSize: 13, color: '#FF6B9D', fontWeight: 600, margin: '3px 0 0' }}>{count}명이 기다리고 있어요</p>
      </div>
      <ChevronRight size={18} color="#CCC" strokeWidth={2.5} />
    </div>
  );
}

// ── 받은 좋아요 상세 섹션 ────────────────────────────
function ReceivedLikesSection({ likes: likeList, profileMap, onAccept, onReject }) {
  if (!likeList || likeList.length === 0) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#FF6B9D', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Heart size={18} color="#FF6B9D" fill="#FF6B9D" />
        나를 좋아해요
        <span style={{ fontSize: 14, fontWeight: 700, color: '#FF6B9D' }}>
          {likeList.length}
        </span>
      </p>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {likeList.map(like => {
          const info = profileMap?.[like.senderId];
          const age  = info?.birthDate ? calcAge(info.birthDate) : null;
          return (
            <div key={like.likeId} style={{
              background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
              padding: '16px', display: 'flex', alignItems: 'center', gap: 14,
              border: '1.5px solid #FFE0ED',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
                background: PRIMARY_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {info?.photo
                  ? <img src={info.photo} alt={info.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                  : <User size={26} color={PRIMARY} strokeWidth={1.5} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>{info?.name || '---'}</span>
                  {age && <span style={{ fontSize: 13, color: '#888' }}>{age}세</span>}
                </div>
                {info?.department && (
                  <p style={{ fontSize: 13, color: '#666', margin: '2px 0 0' }}>
                    {info.department}{info?.grade ? ` ${info.grade}학년` : ''}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => onReject && onReject(like.likeId)}
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: '#F5F5F5', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>
                <button
                  onClick={() => onAccept && onAccept(like.likeId)}
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: '#FF6B9D', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                ><Heart size={18} color="#fff" fill="#fff" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
