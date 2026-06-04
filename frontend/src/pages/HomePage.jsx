import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { freeTime, matching, timetable } from '../api/client';
import BottomTabBar from '../components/BottomTabBar';

// ── 티어 스타일 ────────────────────────────────
const TIER_COLOR = {
  BRONZE: '#8a5a1a', SILVER: '#555', GOLD: '#8a6a00',
  PLATINUM: '#0a7a7a', DIAMOND: '#4a1aaa',
};
const TIER_BG = {
  BRONZE: '#f5e0c3', SILVER: '#e8e8e8', GOLD: '#fff0c0',
  PLATINUM: '#d0f0f0', DIAMOND: '#e0d4ff',
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
  const navigate = useNavigate();
  const { userInfo } = useAuth();

  const [pending, setPending]     = useState([]);   // 공강 매칭 대기 요청
  const [actives, setActives]     = useState([]);   // 활성 매칭
  const [ttRegistered, setTtReg]  = useState(null); // 시간표 등록 여부 (null=로딩)
  const [loading, setLoading]     = useState(true);
  const [acting, setActing]       = useState({});   // { requestId: 'accept'|'reject' }

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

  const cur = pending[0] || null; // 현재 보여줄 공강 요청

  // ── 렌더 ─────────────────────────────────────
  return (
    <div className="app-shell">
      <div style={s.page}>

        {/* ── 헤더 ───────────────────────────── */}
        <header style={s.header}>
          <div style={s.logo}>
            <span style={s.logoText}>공강</span>
            <span style={{ fontSize: 22 }}>💕</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button style={s.iconBtn}>🔔</button>
            <div style={s.avatarBtn} onClick={() => navigate('/mypage')}>
              {userInfo?.gender === 'MALE' ? '🧑' : '👧'}
            </div>
          </div>
        </header>

        {/* ── 인사 + 티어 ────────────────────── */}
        <div style={s.greetRow}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--sub)' }}>안녕하세요 👋</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>
              {userInfo?.name || '사용자'}님
            </h2>
          </div>
          <span style={{
            ...s.tierTag,
            background: TIER_BG[tier],
            color: TIER_COLOR[tier],
          }}>
            {TIER_EMOJI[tier]} {tier}
          </span>
        </div>

        {/* ── 오늘의 공강 매칭 (히어로) ───────── */}
        <section style={{ marginBottom: 8 }}>
          <div style={s.secRow}>
            <h3 style={s.secTitle}>☕ 오늘의 공강 매칭</h3>
            {pending.length > 1 && (
              <span style={s.countTag}>{pending.length}건 대기 중</span>
            )}
          </div>

          {loading ? (
            <div style={s.centerCard}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>

          ) : ttRegistered === false ? (
            /* 시간표 미등록 → 등록 유도 */
            <div style={s.emptyCard} onClick={() => navigate('/match/freetime')}>
              <span style={{ fontSize: 44 }}>🗓️</span>
              <p style={{ fontWeight: 700, fontSize: 16, marginTop: 12 }}>
                에브리타임 시간표를 등록해보세요!
              </p>
              <p style={{ fontSize: 13, color: 'var(--sub)', marginTop: 6, lineHeight: 1.6 }}>
                공강 시간이 겹치는 이성과<br />자동으로 매칭돼요
              </p>
              <div style={s.emptyBtn}>시간표 등록하기 →</div>
            </div>

          ) : cur ? (
            /* 공강 요청 히어로 카드 */
            <div style={s.heroCard}>
              <div style={s.heroTop}>
                <div style={s.partnerAvatar}>
                  <span style={{ fontSize: 34 }}>
                    {cur.partnerGender === 'MALE' ? '🧑' : '👧'}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>새로운 공강 매칭</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 3 }}>
                    {cur.partnerName}
                  </p>
                </div>
                {pending.length > 1 && (
                  <div style={s.moreBadge}>+{pending.length - 1}</div>
                )}
              </div>

              {/* 공강 시간 표시 */}
              <div style={s.timeBox}>
                <span style={{ fontSize: 18 }}>📅</span>
                <div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 3 }}>
                    {cur.matchedDate} 공강시간
                  </p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                    {fmtTime(cur.overlapStart)} ~ {fmtTime(cur.overlapEnd)}
                  </p>
                </div>
              </div>

              {/* 수락 / 다음 버튼 */}
              <div style={s.btnRow}>
                <button
                  style={s.skipBtn}
                  disabled={!!acting[cur.requestId]}
                  onClick={() => handleReject(cur)}
                >
                  {acting[cur.requestId] === 'reject' ? '...' : '⟳ 다음'}
                </button>
                <button
                  style={s.likeBtn}
                  disabled={!!acting[cur.requestId]}
                  onClick={() => handleAccept(cur)}
                >
                  {acting[cur.requestId] === 'accept' ? '...' : '💬 수락'}
                </button>
              </div>
              <p style={s.hint}>수락하면 채팅으로 연결돼요</p>
            </div>

          ) : (
            /* 대기 중 */
            <div style={s.waitCard}>
              <span style={{ fontSize: 40 }}>⏳</span>
              <p style={{ fontWeight: 700, fontSize: 15, marginTop: 12 }}>공강 매칭 대기 중이에요</p>
              <p style={{ fontSize: 13, color: 'var(--sub)', marginTop: 6 }}>
                자정에 공강이 겹치는 이성과 자동으로 매칭돼요
              </p>
            </div>
          )}
        </section>

        {/* ── 진행 중인 매칭 ──────────────────── */}
        {actives.length > 0 && (
          <section style={{ marginBottom: 8 }}>
            <div style={s.secRow}>
              <h3 style={s.secTitle}>💘 진행 중인 매칭</h3>
              <span style={s.moreLink} onClick={() => navigate('/match/history')}>
                전체보기 ›
              </span>
            </div>
            {actives.slice(0, 2).map(m => (
              <div
                key={m.matchId}
                className="card"
                style={{ cursor: 'pointer', marginBottom: 10 }}
                onClick={() => navigate(`/chat/${m.matchId}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={s.activeAvatar}>
                    <span style={{ fontSize: 26 }}>
                      {m.partnerGender === 'MALE' ? '🧑' : '👧'}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{m.partnerName || '상대방'}</p>
                    <p style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>
                      {{ GENERAL: '일반 매칭', RANK: '랭크 매칭' }[m.matchType] || '공강 매칭'}
                    </p>
                  </div>
                  <span style={{ fontSize: 20 }}>💬</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── 빠른 매칭 선택 ─────────────────── */}
        <section style={{ marginBottom: 8 }}>
          <h3 style={{ ...s.secTitle, marginBottom: 10 }}>⚡ 지금 바로 매칭</h3>
          <div style={s.quickRow}>
            <QuickBtn
              icon="🎲" label="일반 매칭"
              color="#FF6B9D" bg="#FFE8F0"
              onClick={() => navigate('/match/waiting', { state: { type: 'GENERAL' } })}
            />
            <QuickBtn
              icon="🏆" label="랭크 매칭"
              color="#6C5CE7" bg="#EEE9FF"
              onClick={() => navigate('/match/waiting', { state: { type: 'RANK' } })}
            />
            <QuickBtn
              icon="☕" label="공강 매칭"
              color="#00B894" bg="#D4F5EC"
              onClick={() => navigate('/match/freetime')}
            />
          </div>
        </section>

        {/* ── 이전 매칭 이력 ─────────────────── */}
        <section>
          <h3 style={{ ...s.secTitle, marginBottom: 10 }}>📋 활동</h3>
          <div className="card" style={{ cursor: 'pointer' }}
            onClick={() => navigate('/match/history')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>💌</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>이전 매칭</p>
                  <p style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>
                    놓친 인연, 다시 만나보세요
                  </p>
                </div>
              </div>
              <span style={{ color: 'var(--sub)', fontSize: 18 }}>›</span>
            </div>
          </div>
        </section>

      </div>
      <BottomTabBar />
    </div>
  );
}

// ── 빠른 매칭 버튼 ────────────────────────────
function QuickBtn({ icon, label, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        flex: 1,
        background: '#fff',
        border: 'none',
        borderRadius: 16,
        padding: '18px 6px',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform .12s',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: 28 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{label}</span>
    </button>
  );
}

// ── 스타일 ────────────────────────────────────
const s = {
  page: {
    flex: 1,
    padding: '0 20px 88px',
    background: 'var(--bg)',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 14,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 4 },
  logoText: { fontSize: 26, fontWeight: 900, color: '#6C5CE7', letterSpacing: -0.5 },
  iconBtn: {
    background: '#fff', border: 'none',
    width: 40, height: 40, borderRadius: 12,
    fontSize: 20, cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 12,
    background: '#EEE9FF',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  greetRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 22,
  },
  tierTag: { padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 },
  secRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  secTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text)' },
  countTag: {
    fontSize: 11, background: '#6C5CE7', color: '#fff',
    padding: '3px 10px', borderRadius: 20, fontWeight: 600,
  },
  moreLink: { fontSize: 12, color: '#6C5CE7', fontWeight: 600, cursor: 'pointer' },

  /* 로딩 카드 */
  centerCard: {
    background: '#fff', borderRadius: 24,
    padding: '40px 24px', marginBottom: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  },

  /* 시간표 미등록 */
  emptyCard: {
    background: '#fff', borderRadius: 24, padding: '32px 24px',
    textAlign: 'center', cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    marginBottom: 16, border: '2px dashed #EEE9FF',
  },
  emptyBtn: {
    display: 'inline-block', marginTop: 18,
    background: '#6C5CE7', color: '#fff',
    padding: '10px 24px', borderRadius: 20,
    fontSize: 14, fontWeight: 700,
  },

  /* 공강 히어로 카드 */
  heroCard: {
    background: 'linear-gradient(145deg, #6C5CE7 0%, #a855f7 100%)',
    borderRadius: 24, padding: '22px 20px 16px', marginBottom: 16,
    boxShadow: '0 8px 28px rgba(108,92,231,0.32)',
  },
  heroTop: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 },
  partnerAvatar: {
    width: 60, height: 60, borderRadius: 18,
    background: 'rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  moreBadge: {
    background: '#FF6B9D', color: '#fff',
    padding: '4px 10px', borderRadius: 16,
    fontSize: 13, fontWeight: 700,
  },
  timeBox: {
    background: 'rgba(255,255,255,0.18)', borderRadius: 14,
    padding: '12px 16px', display: 'flex', alignItems: 'center',
    gap: 12, marginBottom: 16,
  },
  btnRow: { display: 'flex', gap: 10 },
  skipBtn: {
    flex: 1, padding: '14px', borderRadius: 14, border: 'none',
    background: 'rgba(255,255,255,0.2)', color: '#fff',
    fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  likeBtn: {
    flex: 2, padding: '14px', borderRadius: 14, border: 'none',
    background: '#FF6B9D', color: '#fff',
    fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  hint: { fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 12 },

  /* 대기 카드 */
  waitCard: {
    background: '#fff', borderRadius: 24, padding: '32px 24px',
    textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    marginBottom: 16,
  },

  /* 활성 매칭 아바타 */
  activeAvatar: {
    width: 48, height: 48, borderRadius: 14, background: '#EEE9FF',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  /* 빠른 매칭 */
  quickRow: { display: 'flex', gap: 10, marginBottom: 16 },
};
