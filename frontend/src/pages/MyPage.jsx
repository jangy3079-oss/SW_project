import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { user as userApi, photo as photoApi } from '../api/client';
import BottomTabBar from '../components/BottomTabBar';

// ── 상수 ──────────────────────────────────────────────────────────────
const PRIMARY    = '#003087';   // Pantone 282C (동아대 포인트 컬러)
const PRIMARY_BG = '#EAF0FB';

const TIER_META = {
  BRONZE:   { emoji: '🥉', label: 'BRONZE',   desc: '평균 2.0점 이상이면 실버 승급' },
  SILVER:   { emoji: '🥈', label: 'SILVER',   desc: '평균 3.0점 이상이면 골드 승급' },
  GOLD:     { emoji: '🥇', label: 'GOLD',     desc: '평균 4.0점 이상이면 플래티넘 승급' },
  PLATINUM: { emoji: '💎', label: 'PLATINUM', desc: '평균 4.5점 이상이면 다이아 승급' },
  DIAMOND:  { emoji: '✨', label: 'DIAMOND',  desc: '최고 티어입니다!' },
};

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────
export default function MyPage() {
  const navigate    = useNavigate();
  const { userInfo, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [profile,   setProfile]   = useState(null);
  const [photos,    setPhotos]    = useState([]);
  const [prefs,     setPrefs]     = useState({ sameDepExclude: false, sameSchoolExclude: false, pushEnabled: true });
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);

  const uid = userInfo?.userId;

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    Promise.all([
      userApi.get(uid).catch(() => null),
      photoApi.list(uid).catch(() => []),
      userApi.getPreferences(uid).catch(() => null),
    ]).then(([p, ph, pr]) => {
      if (p)  setProfile(p);
      if (ph) setPhotos(ph);
      if (pr) setPrefs(prev => ({ ...prev, ...pr }));
    }).finally(() => setLoading(false));
  }, [uid]);

  const primaryPhoto = photos.find(p => p.isPrimary) || photos[0];
  const tier     = profile?.rankTier || userInfo?.rankTier || 'BRONZE';
  const tierInfo = TIER_META[tier] || TIER_META.BRONZE;
  const score    = profile?.rankScore ?? '-';
  const evalCnt  = profile?.evalCount ?? 0;

  // 사진 업로드
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    setUploading(true);
    try {
      const uploaded = await photoApi.upload(uid, file);
      setPhotos(prev => [...prev, uploaded]);
      if (!primaryPhoto) await photoApi.setPrimary(uid, uploaded.photoId);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // 토글 설정 변경
  const handleToggle = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      await userApi.updatePreferences(uid, next);
    } catch {
      setPrefs(prefs); // 실패 시 롤백
    }
  };

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="app-shell">
      <div style={{ flex: 1, paddingBottom: 88, background: '#F4F6FB', overflowY: 'auto' }}>

        {/* ── 헤더 ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 20px 14px' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>내 정보</h2>
            <p style={{ fontSize: 13, color: '#888', marginTop: 3 }}>내 정보와 활동을 한눈에 확인해요</p>
          </div>
          <button onClick={() => navigate('/settings')} style={s.iconBtn}>
            <SettingsIcon color={PRIMARY} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* ── 프로필 히어로 카드 ── */}
            <div style={{ margin: '0 16px', borderRadius: 20, overflow: 'hidden', position: 'relative', height: 220, cursor: 'pointer' }}
              onClick={() => fileInputRef.current?.click()}>
              {primaryPhoto ? (
                <img
                  src={`/uploads/profiles/${primaryPhoto.fileName}`}
                  alt="프로필"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, #1a5aaa 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 64, opacity: 0.5 }}>👤</span>
                </div>
              )}

              {/* 그라디언트 오버레이 */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.68) 0%, transparent 55%)' }} />

              {/* 랭크 배지 */}
              <div style={s.rankBadge}>
                <span style={{ fontSize: 15 }}>{tierInfo.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{evalCnt}개</span>
              </div>

              {/* 이름 / 학교 */}
              <div style={{ position: 'absolute', bottom: 16, left: 16, right: 70 }}>
                <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>
                  {profile?.name || userInfo?.name || '이름 없음'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>동아대학교</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>여기를 터치하여 내 프로필을 볼 수 있어요!</span>
                </div>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
            </div>

            {/* 업로딩 인디케이터 */}
            {uploading && (
              <p style={{ textAlign: 'center', fontSize: 12, color: PRIMARY, padding: '8px 0' }}>사진 업로드 중...</p>
            )}

            {/* ── 프로필 관리 메뉴 ── */}
            <Card style={{ margin: '12px 16px 0' }}>
              <MenuItem icon="📷" label="프로필 사진 변경"  sub="내 매력을 보여주세요"
                onClick={() => fileInputRef.current?.click()} />
              <Divider />
              <MenuItem icon="✏️" label="자기소개 수정"
                sub={profile?.bio ? profile.bio.slice(0, 22) + (profile.bio.length > 22 ? '…' : '') : '나를 소개해 보세요'}
                onClick={() => navigate('/mypage/edit-bio')} />
              <Divider />
              <MenuItem icon="🎯" label="매칭 선호도 설정"  sub="원하는 매칭 조건을 정해보세요"
                onClick={() => navigate('/mypage/preferences')} />
              <Divider />
              <MenuItem icon="🏆" label="랭크 현황 상세"
                sub={`현재 ${tier} · ${tierInfo.desc}`}
                onClick={() => navigate('/mypage/rank')} />
            </Card>

            {/* ── 매칭 토글 설정 ── */}
            <Card style={{ margin: '10px 16px 0' }}>
              <ToggleItem
                icon="🎓" label="같은 학과 매칭 제외" sub="같은 학과 학생과는 매칭되지 않아요"
                value={prefs.sameDepExclude}    onToggle={() => handleToggle('sameDepExclude')} />
              <Divider />
              <ToggleItem
                icon="🏛️" label="같은 학교 매칭 제외" sub="같은 학교 학생과는 매칭되지 않아요"
                value={prefs.sameSchoolExclude} onToggle={() => handleToggle('sameSchoolExclude')} />
              <Divider />
              <ToggleItem
                icon="🔔" label="푸시 알림" sub="매칭 결과, 메시지 등을 알려드려요"
                value={prefs.pushEnabled}       onToggle={() => handleToggle('pushEnabled')} />
            </Card>

            {/* ── My 활동 ── */}
            <p style={{ padding: '18px 20px 8px', fontSize: 16, fontWeight: 800, color: '#111' }}>My 활동</p>
            <Card style={{ margin: '0 16px' }}>
              {/* 랭크 요약 */}
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', padding: '16px 0 14px' }}>
                <StatItem value={typeof score === 'number' ? Number(score).toFixed(2) : '-'} label="평균 점수" />
                <div style={{ width: 1, background: '#EEF0F6' }} />
                <StatItem value={evalCnt} label="받은 평가" />
                <div style={{ width: 1, background: '#EEF0F6' }} />
                <StatItem value={tierInfo.emoji} label={tier} />
              </div>
              <div style={{ background: PRIMARY_BG, margin: '0 16px 16px', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: PRIMARY, fontWeight: 500 }}>
                💡 {tierInfo.desc}
              </div>

              <Divider />

              {/* 활동 아이콘 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <ActivityBtn icon="👁️" label="프로필 미리보기" onClick={() => navigate('/mypage/rank')} />
                <ActivityBtn icon="💘" label="매칭 횟수"       onClick={() => navigate('/mypage/rank')} />
                <ActivityBtn icon="💬" label="채팅"            onClick={() => navigate('/chat')} />
                <ActivityBtn icon="⭐" label="받은 평가"       onClick={() => navigate('/mypage/rank')} />
              </div>
            </Card>

            {/* ── 로그아웃 ── */}
            <Card style={{ margin: '10px 16px 0' }}>
              <button onClick={handleLogout} style={s.logoutBtn}>
                로그아웃
              </button>
            </Card>

            <div style={{ height: 20 }} />
          </>
        )}
      </div>
      <BottomTabBar />
    </div>
  );
}

// ── 서브 컴포넌트 ──────────────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px rgba(0,48,135,0.07)', overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: '#F0F2F8', margin: '0 16px' }} />;
}

function MenuItem({ icon, label, sub, onClick }) {
  return (
    <button onClick={onClick} style={s.menuItem}>
      <span style={s.menuIcon}>{icon}</span>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{label}</p>
        <p style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{sub}</p>
      </div>
      <ChevronIcon />
    </button>
  );
}

function ToggleItem({ icon, label, sub, value, onToggle }) {
  return (
    <div style={{ ...s.menuItem, cursor: 'default' }}>
      <span style={s.menuIcon}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{label}</p>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
            color: value ? PRIMARY : '#aaa',
            background: value ? PRIMARY_BG : '#F0F0F0',
          }}>
            {value ? 'ON' : 'OFF'}
          </span>
        </div>
        <p style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{sub}</p>
      </div>
      <Toggle value={value} onToggle={onToggle} />
    </div>
  );
}

function Toggle({ value, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
      background: value ? PRIMARY : '#D8DCE6',
      position: 'relative', transition: 'background .2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, width: 22, height: 22, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        left: value ? 23 : 3, transition: 'left .2s',
      }} />
    </button>
  );
}

function StatItem({ value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 24, fontWeight: 800, color: PRIMARY }}>{value}</p>
      <p style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{label}</p>
    </div>
  );
}

function ActivityBtn({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '14px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <span style={{ fontSize: 22, color: PRIMARY }}>{icon}</span>
      <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>{label}</span>
    </button>
  );
}

// ── 아이콘 ────────────────────────────────────────────────────────────
function SettingsIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0C4D0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────
const s = {
  iconBtn: {
    background: PRIMARY_BG, border: 'none', cursor: 'pointer',
    width: 40, height: 40, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  rankBadge: {
    position: 'absolute', top: 14, right: 14,
    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
    borderRadius: 20, padding: '5px 12px',
    display: 'flex', alignItems: 'center', gap: 5,
  },
  menuItem: {
    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px',
  },
  menuIcon: { fontSize: 22, width: 30, textAlign: 'center', flexShrink: 0 },
  logoutBtn: {
    width: '100%', padding: '14px 16px', background: 'none',
    border: 'none', cursor: 'pointer', color: '#e74c3c',
    fontSize: 15, fontWeight: 600, textAlign: 'left',
  },
};
