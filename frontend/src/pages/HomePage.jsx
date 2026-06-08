import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { user as userApi, freeTime, matching, timetable } from '../api/client';
import BottomTabBar from '../components/BottomTabBar';

// ── 디자인 토큰 ───────────────────────────────
const PRIMARY    = '#003087';
const PRIMARY_BG = '#EAF0FB';

// ── 티어 스타일 ───────────────────────────────
const TIER_COLOR = {
  BRONZE:   '#8a5a1a', SILVER:  '#555',
  GOLD:     '#8a6a00', PLATINUM:'#0a7a7a', DIAMOND: '#4a1aaa',
};
const TIER_BG = {
  BRONZE:   '#f5e0c3', SILVER:  '#e8e8e8',
  GOLD:     '#fff0c0', PLATINUM:'#d0f0f0', DIAMOND: '#e0d4ff',
};
const TIER_EMOJI = {
  BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇', PLATINUM: '💎', DIAMOND: '✨',
};

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr < 12 ? '오전' : '오후';
  const display = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  return `${ampm} ${display}:${m}`;
}

// ── 메인 컴포넌트 ─────────────────────────────
export default function HomePage() {
  const navigate    = useNavigate();
  const { userInfo } = useAuth();

  const [pending,      setPending]  = useState([]);
  const [actives,      setActives]  = useState([]);
  const [ttRegistered, setTtReg]   = useState(null);
  const [loading,      setLoading]  = useState(true);
  const [acting,       setActing]   = useState({});

  const userId = userInfo?.userId;
  const tier   = userInfo?.rankTier || 'BRONZE';

  // ── 데이터 패치 ──────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [p, a, s] = await Promise.allSettled([
      freeTime.pending(userId),
      matching.active(userId),
      timetable.status(userId),
    ]);
    if (p.status === 'fulfilled') setPending(p.value || []);
    if (a.status === 'fulfilled') setActives(a.value || []);
    setTtReg(s.status === 'fulfilled' ? (s.value?.registered ?? false) : false);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // 첫 로그인 감지: bio 없으면 프로필 설정 화면으로 이동
  useEffect(() => {
    if (!userId) return;
    userApi.get(userId).then(p => {
      if (!p?.bio) navigate('/profile/setup', { replace: true });
    }).catch(() => {});
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 수락 / 거절 ──────────────────────────────
  const handleAccept = async (req) => {
    setActing(p => ({ ...p, [req.requestId]: 'accept' }));
    try {
      await freeTime.accept(req.requestId, userId);
      setPending(p => p.filter(r => r.requestId !== req.requestId));
    } catch (e) { alert(e.message); }
    finally { setActing(p => ({ ...p, [req.requestId]: null })); }
  };

  const handleReject = async (req) => {
    setActing(p => ({ ...p, [req.requestId]: 'reject' }));
    try {
      await freeTime.reject(req.requestId, userId);
      setPending(p => p.filter(r => r.requestId !== req.requestId));
    } catch (e) { alert(e.message); }
    finally { setActing(p => ({ ...p, [req.requestId]: null })); }
  };

  const cur = pending[0] || null;

  // ── 렌더 ─────────────────────────────────────
  return (
    <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={s.page}>

        {/* ── 헤더 ── */}
        <header style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={s.logoText}>공강</span>
            <span style={{ fontSize: 20 }}>💕</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button style={s.iconBtn}>🔔</button>
            <button style={s.avatarBtn} onClick={() => navigate('/mypage')}>
              {userInfo?.gender === 'MALE' ? '🧑' : '👧'}
            </button>
          </div>
        </header>

        {/* ── 인사 + 티어 ── */}
        <div style={s.greetRow}>
          <div>
            <p style={{ fontSize: 13, color: '#888' }}>안녕하세요 👋</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', marginTop: 3 }}>
              {userInfo?.name || '사용자'}님
            </h2>
          </div>
          <span style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
            background: TIER_BG[tier], color: TIER_COLOR[tier],
          }}>
            {TIER_EMOJI[tier]} {tier}
          </span>
        </div>

        {/* ────────────── 섹션 구분 ────────────── */}
        <div style={s.divider} />

        {/* ── 오늘의 공강 매칭 ── */}
        <section style={s.section}>
          <div style={s.secRow}>
            <h3 style={s.secTitle}>☕ 오늘의 공강 매칭</h3>
            {pending.length > 1 && (
              <span style={s.countTag}>{pending.length}건 대기</span>
            )}
          </div>

          {loading ? (
            /* 로딩 */
            <div style={s.stateCard}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>

          ) : ttRegistered === false ? (
            /* 시간표 미등록 */
            <div style={s.stateCard} onClick={() => navigate('/match/freetime')}>
              <span style={{ fontSize: 40 }}>🗓️</span>
              <p style={{ fontWeight: 700, fontSize: 16, color: '#111', marginTop: 12 }}>
                에브리타임 시간표를 등록해보세요!
              </p>
              <p style={{ fontSize: 13, color: '#888', marginTop: 6, lineHeight: 1.6 }}>
                공강 시간이 겹치는 이성과<br />자동으로 매칭돼요
              </p>
              <div style={s.outlineBtn}>시간표 등록하기 →</div>
            </div>

          ) : cur ? (
            /* 공강 요청 히어로 카드 */
            <div style={s.heroCard}>
              {/* 상단: 상대 정보 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={s.partnerAvatar}>
                  <span style={{ fontSize: 32 }}>
                    {cur.partnerGender === 'MALE' ? '🧑' : '👧'}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 3 }}>
                    새로운 공강 매칭
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                    {cur.partnerName}
                  </p>
                </div>
                {pending.length > 1 && (
                  <span style={s.moreBadge}>+{pending.length - 1}</span>
                )}
              </div>

              {/* 공강 시간 */}
              <div style={s.timeBox}>
                <span style={{ fontSize: 18 }}>📅</span>
                <div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 3 }}>
                    {cur.matchedDate} 공강시간
                  </p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                    {fmtTime(cur.overlapStart)} ~ {fmtTime(cur.overlapEnd)}
                  </p>
                </div>
              </div>

              {/* 버튼 */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  style={s.heroSkipBtn}
                  disabled={!!acting[cur.requestId]}
                  onClick={() => handleReject(cur)}
                >
                  {acting[cur.requestId] === 'reject' ? '...' : '⟳ 다음'}
                </button>
                <button
                  style={s.heroLikeBtn}
                  disabled={!!acting[cur.requestId]}
                  onClick={() => handleAccept(cur)}
                >
                  {acting[cur.requestId] === 'accept' ? '...' : '💬 수락'}
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 12 }}>
                수락하면 채팅으로 연결돼요
              </p>
            </div>

          ) : (
            /* 대기 중 */
            <div style={s.stateCard}>
              <span style={{ fontSize: 38 }}>⏳</span>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#111', marginTop: 12 }}>
                공강 매칭 대기 중이에요
              </p>
              <p style={{ fontSize: 13, color: '#888', marginTop: 6, lineHeight: 1.6 }}>
                자정에 공강이 겹치는 이성과<br />자동으로 매칭돼요
              </p>
            </div>
          )}
        </section>

        {/* ────────────── 섹션 구분 ────────────── */}
        {actives.length > 0 && <div style={s.divider} />}

        {/* ── 진행 중인 매칭 ── */}
        {actives.length > 0 && (
          <section style={s.section}>
            <div style={s.secRow}>
              <h3 style={s.secTitle}>💘 진행 중인 매칭</h3>
              <button
                style={s.moreLink}
                onClick={() => navigate('/match/history')}
              >
                전체보기 ›
              </button>
            </div>
            {actives.slice(0, 2).map(m => (
              <button
                key={m.matchId}
                style={s.matchRow}
                onClick={() => navigate(`/chat/${m.matchId}`)}
              >
                <div style={s.activeAvatar}>
                  <span style={{ fontSize: 24 }}>
                    {m.partnerGender === 'MALE' ? '🧑' : '👧'}
                  </span>
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>
                    {m.partnerName || '상대방'}
                  </p>
                  <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    {{ GENERAL: '공강 매칭', RANK: '랭크 매칭' }[m.matchType] || m.matchType}
                  </p>
                </div>
                <span style={{ fontSize: 16, color: '#CCC' }}>›</span>
              </button>
            ))}
          </section>
        )}

        {/* ────────────── 섹션 구분 ────────────── */}
        <div style={s.divider} />

        {/* ── 지금 바로 매칭 ── */}
        <section style={s.section}>
          <h3 style={{ ...s.secTitle, marginBottom: 12 }}>⚡ 지금 바로 매칭</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <QuickCard
              icon="🏆"
              label="랭크 매칭"
              desc="점수 기반 매칭"
              accentColor={PRIMARY}
              accentBg={PRIMARY_BG}
              onClick={() => navigate('/match/waiting', { state: { type: 'RANK' } })}
            />
            <QuickCard
              icon="☕"
              label="공강 매칭"
              desc="시간표 기반 매칭"
              accentColor="#00836B"
              accentBg="#D4F5EC"
              onClick={() => navigate('/match/freetime')}
            />
          </div>
        </section>

        {/* ────────────── 섹션 구분 ────────────── */}
        <div style={s.divider} />

        {/* ── 활동 ── */}
        <section style={s.section}>
          <h3 style={{ ...s.secTitle, marginBottom: 12 }}>📋 활동</h3>
          <button style={s.activityRow} onClick={() => navigate('/match/history')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
              <div style={{ ...s.activeAvatar, background: '#FFF0F5' }}>
                <span style={{ fontSize: 22 }}>💌</span>
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>이전 매칭</p>
                <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  놓친 인연, 다시 만나보세요
                </p>
              </div>
            </div>
            <span style={{ fontSize: 16, color: '#CCC' }}>›</span>
          </button>
        </section>

      </div>
      <BottomTabBar />
    </div>
  );
}

// ── 빠른 매칭 카드 ────────────────────────────
function QuickCard({ icon, label, desc, accentColor, accentBg, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        flex: 1,
        background: '#F8F9FB',
        border: `1.5px solid #EFEFEF`,
        borderRadius: 16,
        padding: '18px 14px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 0.12s',
        fontFamily: 'inherit',
        textAlign: 'left',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: accentBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{label}</p>
        <p style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{desc}</p>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: accentColor, background: accentBg,
        padding: '3px 10px', borderRadius: 20,
      }}>
        시작하기 →
      </span>
    </button>
  );
}

// ── 스타일 ────────────────────────────────────
const s = {
  page: {
    flex: 1,
    padding: '0 0 88px',
    background: '#fff',
    overflowY: 'auto',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 20px 14px',
  },
  logoText: {
    fontSize: 26, fontWeight: 900, color: PRIMARY, letterSpacing: -0.5,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    background: '#F4F6FB', border: 'none',
    fontSize: 18, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 12,
    background: PRIMARY_BG, border: 'none',
    fontSize: 20, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  greetRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '4px 20px 20px',
  },
  divider: {
    height: 8, background: '#F4F6FB',
  },
  section: {
    padding: '22px 20px 20px',
  },
  secRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  secTitle: {
    fontSize: 16, fontWeight: 800, color: '#111',
  },
  countTag: {
    fontSize: 11, background: PRIMARY, color: '#fff',
    padding: '3px 10px', borderRadius: 20, fontWeight: 700,
  },
  moreLink: {
    fontSize: 12, color: PRIMARY, fontWeight: 600,
    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  },

  /* 상태 카드 (로딩/대기/미등록) */
  stateCard: {
    background: '#F8F9FB', borderRadius: 20,
    border: '1.5px solid #EFEFEF',
    padding: '32px 24px', textAlign: 'center', cursor: 'pointer',
  },
  outlineBtn: {
    display: 'inline-block', marginTop: 18,
    border: `1.5px solid ${PRIMARY}`, color: PRIMARY,
    padding: '10px 24px', borderRadius: 20,
    fontSize: 14, fontWeight: 700,
  },

  /* 히어로 카드 */
  heroCard: {
    background: `linear-gradient(145deg, ${PRIMARY} 0%, #0050c8 100%)`,
    borderRadius: 20, padding: '22px 20px 16px',
  },
  partnerAvatar: {
    width: 58, height: 58, borderRadius: 16,
    background: 'rgba(255,255,255,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  moreBadge: {
    background: 'rgba(255,255,255,0.25)', color: '#fff',
    padding: '4px 10px', borderRadius: 16,
    fontSize: 13, fontWeight: 700,
  },
  timeBox: {
    background: 'rgba(255,255,255,0.15)', borderRadius: 14,
    padding: '12px 16px', display: 'flex', alignItems: 'center',
    gap: 12, marginBottom: 16,
  },
  heroSkipBtn: {
    flex: 1, height: 48, borderRadius: 12, border: 'none',
    background: 'rgba(255,255,255,0.2)', color: '#fff',
    fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  heroLikeBtn: {
    flex: 2, height: 48, borderRadius: 12, border: 'none',
    background: '#FF6B9D', color: '#fff',
    fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },

  /* 진행 중인 매칭 행 */
  matchRow: {
    width: '100%', background: '#F8F9FB',
    border: '1.5px solid #EFEFEF', borderRadius: 14,
    padding: '14px 16px', marginBottom: 8,
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', gap: 14, fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  activeAvatar: {
    width: 46, height: 46, borderRadius: 12,
    background: PRIMARY_BG,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  /* 활동 행 */
  activityRow: {
    width: '100%', background: '#F8F9FB',
    border: '1.5px solid #EFEFEF', borderRadius: 14,
    padding: '14px 16px', cursor: 'pointer',
    display: 'flex', alignItems: 'center',
    fontFamily: 'inherit', boxSizing: 'border-box',
  },
};
