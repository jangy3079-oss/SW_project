import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGems, GEM_COSTS } from '../contexts/GemsContext';
import { freeTime, user as userApi, photo as photoApi } from '../api/client';
import { ChevronLeft, Shuffle, User, Calendar, Coffee, Sparkles, Lock } from 'lucide-react';

const PRIMARY    = '#003087';
const PRIMARY_BG = '#EAF0FB';
const FREE_REROLLS = 2;  // 무료 리롤 횟수

const TIER_COLOR = { BRONZE:'#8a5a1a', SILVER:'#555', GOLD:'#8a6a00', PLATINUM:'#0a7a7a', DIAMOND:'#4a1aaa' };
const TIER_BG    = { BRONZE:'#f5e0c3', SILVER:'#e8e8e8', GOLD:'#fff0c0', PLATINUM:'#d0f0f0', DIAMOND:'#e0d4ff' };

// 화(2), 수(3) 무료. 나머지는 gem 필요
const FREE_DAYS   = [2, 3];
const DAY_NAMES   = ['일', '월', '화', '수', '목', '금', '토'];
const TODAY_DOW   = new Date().getDay();
const IS_FREE_DAY = FREE_DAYS.includes(TODAY_DOW);

// 오늘 날짜 기준 세션 키
const PAID_KEY = `freetime_paid_${new Date().toDateString()}`;
// 이미 수락/거절한 requestId 목록 (PartnerProfilePage에서 기록)
const DONE_KEY = `freetime_done_${new Date().toDateString()}`;

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function calcAge(birthDate) {
  if (!birthDate) return null;
  const b = new Date(birthDate), t = new Date();
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

export default function FreeTimePickPage() {
  const navigate     = useNavigate();
  const { userInfo } = useAuth();
  const { gems, spendGems, canAfford } = useGems();
  const userId       = userInfo?.userId;

  // 게이트: 오늘 이미 결제했으면 false
  const [gateOpen,    setGateOpen]    = useState(!IS_FREE_DAY && !sessionStorage.getItem(PAID_KEY));
  const [loading,     setLoading]     = useState(true);
  const [allReqs,     setAllReqs]     = useState([]);
  const [pool,        setPool]        = useState([]);
  const [profileMap,  setProfileMap]  = useState({});
  const [rerollCount, setRerollCount] = useState(0);

  const visible = pool.slice(0, 2);

  useEffect(() => { if (userId && !gateOpen) load(); }, [userId, gateOpen]); // eslint-disable-line

  async function load() {
    setLoading(true);
    try {
      const list    = await freeTime.pending(userId);
      const doneIds = new Set(JSON.parse(sessionStorage.getItem(DONE_KEY) || '[]'));
      // 이미 수락/거절한 요청은 목록에서 제거
      const arr = (Array.isArray(list) ? list : []).filter(r => !doneIds.has(r.requestId));
      setAllReqs(arr);
      setPool(shuffle(arr));
      arr.forEach(req => fetchProfile(req));
    } catch {}
    finally { setLoading(false); }
  }

  async function fetchProfile(req) {
    const pid = req.partnerId;
    if (!pid) return;
    try {
      const [photos, profile, prefRes] = await Promise.all([
        photoApi.list(pid).catch(() => []),
        userApi.get(pid).catch(() => null),
        userApi.getPreferences(pid).catch(() => null),
      ]);
      const primary = (photos || []).sort((a, b) => {
        if (a.isPrimary) return -1; if (b.isPrimary) return 1;
        return (a.photoOrder || 0) - (b.photoOrder || 0);
      })[0];
      setProfileMap(prev => ({
        ...prev,
        [pid]: {
          photo:       primary?.fileName ? `/uploads/${primary.fileName}` : null,
          age:         calcAge(profile?.birthDate),
          department:  profile?.department,
          grade:       profile?.grade,
          mbti:        prefRes?.preferences?.mbti || null,
          tier:        profile?.rankTier,
        },
      }));
    } catch {}
  }

  // 요일 게이트 — gem 결제
  function handlePayGate() {
    if (!canAfford(GEM_COSTS.FREETIME_PREMIUM)) return;
    spendGems(GEM_COSTS.FREETIME_PREMIUM);
    sessionStorage.setItem(PAID_KEY, '1');
    setGateOpen(false);
  }

  // 리롤 — 무료 2회 이후 gem 차감
  function handleReroll() {
    const isFreeReroll = rerollCount < FREE_REROLLS;
    if (!isFreeReroll && !canAfford(GEM_COSTS.REROLL)) return;
    if (!isFreeReroll) spendGems(GEM_COSTS.REROLL);
    setPool(shuffle(allReqs));
    setRerollCount(c => c + 1);
  }

  const freeRerollsLeft = Math.max(0, FREE_REROLLS - rerollCount);
  const usedFreeRerolls = rerollCount >= FREE_REROLLS;

  function goProfile(req) {
    navigate(`/partner/${req.partnerId}`, {
      state: {
        requestId:    req.requestId,
        matchType:    'FREETIME',
        matchedDate:  req.matchedDate,
        overlapStart: req.overlapStart,
        overlapEnd:   req.overlapEnd,
      },
    });
  }

  // ── 요일 게이트 화면 ──────────────────────────
  if (gateOpen) {
    return (
      <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px 20px 10px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ChevronLeft size={24} color="#111" />
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px 80px' }}>
          <div style={{ width: 72, height: 72, borderRadius: 24, background: PRIMARY_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Lock size={32} color={PRIMARY} strokeWidth={2} />
          </div>

          <p style={{ fontSize: 24, fontWeight: 900, color: '#111', textAlign: 'center', lineHeight: 1.4, margin: 0 }}>
            오늘은 {DAY_NAMES[TODAY_DOW]}요일이에요
          </p>
          <p style={{ fontSize: 15, color: '#888', textAlign: 'center', marginTop: 12, lineHeight: 1.7 }}>
            공강 매칭 무료 이용일은{' '}
            <strong style={{ color: PRIMARY }}>화요일·수요일</strong>이에요.<br />
            오늘 이용하려면 재화가 필요해요.
          </p>

          {/* gem 비용 카드 */}
          <div style={{
            width: '100%', marginTop: 32,
            background: PRIMARY_BG, borderRadius: 20, padding: '20px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ fontSize: 13, color: PRIMARY, fontWeight: 700, margin: 0 }}>오늘 하루 이용권</p>
              <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>자정에 자동 만료</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={18} color={PRIMARY} strokeWidth={2.5} />
              <span style={{ fontSize: 24, fontWeight: 900, color: PRIMARY }}>{GEM_COSTS.FREETIME_PREMIUM}</span>
            </div>
          </div>

          <p style={{ fontSize: 13, color: '#aaa', marginTop: 14 }}>
            현재 보유: 💎 {gems}개
          </p>

          {canAfford(GEM_COSTS.FREETIME_PREMIUM) ? (
            <button
              onClick={handlePayGate}
              style={{
                marginTop: 20, width: '100%', padding: '16px',
                borderRadius: 16, background: PRIMARY, color: '#fff',
                border: 'none', cursor: 'pointer',
                fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
              }}
            >
              💎 {GEM_COSTS.FREETIME_PREMIUM} 사용하고 입장하기
            </button>
          ) : (
            <div style={{ marginTop: 20, width: '100%', textAlign: 'center' }}>
              <div style={{ padding: '16px', borderRadius: 16, background: '#F4F4F4', color: '#BBB', fontSize: 15, fontWeight: 700 }}>
                재화가 부족해요
              </div>
              <p style={{ fontSize: 13, color: '#aaa', marginTop: 10 }}>
                마이페이지 → 개발자 도구에서 재화를 충전하세요
              </p>
            </div>
          )}

          <button
            onClick={() => navigate(-1)}
            style={{ marginTop: 14, background: 'none', border: 'none', color: '#AAA', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ── 메인 콘텐츠 ──────────────────────────────
  return (
    <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 20px 10px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={24} color="#111" />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Coffee size={20} color={PRIMARY} strokeWidth={2} />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: 0 }}>오늘의 인연</h2>
          </div>
          <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>마음에 드는 상대를 골라보세요</p>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, padding: '12px 20px 40px', overflowY: 'auto' }}>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="spinner" style={{ borderTopColor: PRIMARY }} />
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <Coffee size={48} color="#DDD" strokeWidth={1.5} />
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111', marginTop: 16 }}>오늘은 인연이 없어요</p>
            <p style={{ fontSize: 14, color: '#888', marginTop: 8 }}>내일 자정에 새로운 인연이 소개될 거예요</p>
          </div>
        )}

        {/* 프로필 카드 2장 */}
        {!loading && visible.map((req, i) => (
          <ProfileCard
            key={req.requestId}
            req={req}
            info={profileMap[req.partnerId]}
            style={{ marginBottom: i === 0 ? 16 : 0 }}
            onClick={() => goProfile(req)}
          />
        ))}

        {/* 리롤 버튼 */}
        {!loading && allReqs.length > 0 && (
          <RerollButton
            freeLeft={freeRerollsLeft}
            usedFree={usedFreeRerolls}
            canAffordGem={canAfford(GEM_COSTS.REROLL)}
            onClick={handleReroll}
          />
        )}
      </div>
    </div>
  );
}

// ── 리롤 버튼 ──────────────────────────────────
function RerollButton({ freeLeft, usedFree, canAffordGem, onClick }) {
  const disabled = usedFree && !canAffordGem;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        marginTop: 20, width: '100%', padding: '14px',
        borderRadius: 14,
        border: `1.5px solid ${disabled ? '#DDD' : PRIMARY}`,
        background: '#fff',
        color: disabled ? '#BBB' : PRIMARY,
        fontSize: 15, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      <Shuffle size={16} />
      {!usedFree
        ? `다른 인연 보기 (무료 ${freeLeft}회 남음)`
        : disabled
          ? `재화 부족 (💎 ${GEM_COSTS.REROLL} 필요)`
          : `다른 인연 보기 (💎 ${GEM_COSTS.REROLL})`
      }
    </button>
  );
}

// ── 프로필 카드 ────────────────────────────────
const CARD_H  = 300;
const PHOTO_H = Math.round(CARD_H * 0.62);
const INFO_H  = CARD_H - PHOTO_H;

function ProfileCard({ req, info, style, onClick }) {
  const tier = info?.tier;
  return (
    <div
      onClick={onClick}
      style={{
        height: CARD_H, borderRadius: 20, overflow: 'hidden',
        background: '#fff', cursor: 'pointer',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        ...style,
      }}
    >
      {/* 사진 */}
      <div style={{ width: '100%', height: PHOTO_H, position: 'relative', background: PRIMARY_BG, overflow: 'hidden' }}>
        {info?.photo && (
          <img
            src={info.photo} alt={req.partnerName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}
        {!info?.photo && (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={64} color={PRIMARY} strokeWidth={1.2} />
          </div>
        )}
        {req.overlapStart && (
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            fontSize: 12, fontWeight: 600, padding: '5px 12px',
            borderRadius: 20, backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Calendar size={11} color="#fff" />
            {fmtTime(req.overlapStart)} ~ {fmtTime(req.overlapEnd)}
          </div>
        )}
      </div>

      {/* 정보 */}
      <div style={{ height: INFO_H, background: '#fff', padding: '13px 18px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: 0 }}>{req.partnerName}</p>
          {info?.age && <p style={{ fontSize: 14, color: '#666', margin: 0 }}>{info.age}세</p>}
        </div>
        <p style={{ fontSize: 13, color: '#888', marginTop: 3 }}>
          {info?.department || ''}{info?.grade ? ` · ${info.grade}학년` : ''}
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {info?.mbti && (
            <span style={{ padding: '3px 10px', borderRadius: 20, background: '#EAEFFF', color: PRIMARY, fontSize: 12, fontWeight: 600 }}>
              {info.mbti}
            </span>
          )}
          {tier && (
            <span style={{ padding: '3px 10px', borderRadius: 20, background: TIER_BG[tier] || '#f0f0f0', color: TIER_COLOR[tier] || '#555', fontSize: 12, fontWeight: 600 }}>
              {tier}
            </span>
          )}
          <span style={{ padding: '3px 10px', borderRadius: 20, background: '#E8F8F2', color: '#00876A', fontSize: 12, fontWeight: 600 }}>
            공강 매칭
          </span>
        </div>
      </div>
    </div>
  );
}
