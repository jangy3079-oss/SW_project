import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { user as userApi, photo as photoApi } from '../api/client';
import BottomTabBar from '../components/BottomTabBar';
import {
  Eye, Trophy,
  Settings, Camera, Sliders, UserSearch, LogOut,
} from 'lucide-react';

// ── 상수 ──────────────────────────────────────────────────────────────
const PRIMARY    = '#003087';
const PRIMARY_BG = '#EAF0FB';

const TIER_META = {
  BRONZE:   { label: 'BRONZE',   color: '#CD7F32', desc: '평균 2.0점 이상이면 실버 승급' },
  SILVER:   { label: 'SILVER',   color: '#A8A9AD', desc: '평균 3.0점 이상이면 골드 승급' },
  GOLD:     { label: 'GOLD',     color: '#FFD700', desc: '평균 4.0점 이상이면 플래티넘 승급' },
  PLATINUM: { label: 'PLATINUM', color: '#5AA9E6', desc: '평균 4.5점 이상이면 다이아 승급' },
  DIAMOND:  { label: 'DIAMOND',  color: '#B9F2FF', desc: '최고 티어입니다!' },
};

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────
export default function MyPage() {
  const navigate     = useNavigate();
  const { userInfo, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [profile,   setProfile]   = useState(null);
  const [photos,    setPhotos]    = useState([]);
  const [prefs,     setPrefs]     = useState({ sameDepExclude: false, pushEnabled: true });
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
  const name       = profile?.name || userInfo?.name || '이름 없음';
  const department = profile?.department || userInfo?.department || '';

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

  const handleToggle = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      await userApi.updatePreferences(uid, next);
    } catch {
      setPrefs(prefs);
    }
  };

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="app-shell">
      <div style={{ flex: 1, paddingBottom: 88, background: '#fff', overflowY: 'auto' }}>

        {/* ── 헤더 ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 34px 8px' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>{name}</h1>
          <button onClick={() => navigate('/settings')} style={s.iconBtn}>
            <Settings size={20} color={PRIMARY} strokeWidth={2} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* ── 원형 프로필 사진 ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 20px 4px' }}>
              <div
                style={{ position: 'relative', width: 110, height: 110, borderRadius: '50%', boxShadow: `0 0 0 4px ${PRIMARY_BG}, 0 0 0 6px ${PRIMARY}`, cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {primaryPhoto ? (
                  <img src={`/uploads/${primaryPhoto.fileName}`} alt="프로필"
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `linear-gradient(135deg, ${PRIMARY} 0%, #1a5aaa 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={30} color="rgba(255,255,255,0.8)" />
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: '50%', background: PRIMARY, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={13} color="#fff" strokeWidth={2.5} />
                </div>
              </div>
              {uploading && <p style={{ fontSize: 12, color: PRIMARY, marginTop: 8 }}>업로드 중...</p>}
              <p style={{ fontSize: 17, fontWeight: 700, color: '#111', marginTop: 12 }}>{name}</p>
              <p style={{ fontSize: 13, color: '#999', marginTop: 3 }}>
                동아대학교{department ? ` · ${department}` : ''}
              </p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />

            {/* ── My 활동 (가로선 구분) ── */}
            <div style={{ margin: '20px 0 0' }}>
              <HRule />
              {/* 스탯 3열 */}
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', padding: '18px 0' }}>
                <StatItem value={typeof score === 'number' ? Number(score).toFixed(2) : score} label="평균 점수" />
                <div style={{ width: 1, background: '#EBEBEB', alignSelf: 'stretch' }} />
                <StatItem value={evalCnt} label="받은 평가" />
                <div style={{ width: 1, background: '#EBEBEB', alignSelf: 'stretch' }} />
                <StatItem value={tier} label="티어" tierColor={tierInfo.color} />
              </div>

              {/* 티어 설명 칩 */}
              <div style={{ background: PRIMARY_BG, margin: '0 20px 16px', borderRadius: 10, padding: '9px 14px', fontSize: 13, color: PRIMARY, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trophy size={14} color={PRIMARY} />
                {tierInfo.desc}
              </div>

              <HRule />
            </div>

            {/* ── 프로필 관리 ── */}
            <SectionLabel>프로필 관리</SectionLabel>
            <HRule />
            <FlatMenuItem Icon={Camera}     label="프로필 편집"     onClick={() => navigate('/mypage/edit')} />
            <HRule />
            <FlatMenuItem Icon={Eye}        label="프로필 미리보기" onClick={() => navigate(`/partner/${uid}`)} />
            <HRule />
            <FlatMenuItem Icon={UserSearch} label="매칭 선호도 설정" onClick={() => navigate('/mypage/preferences')} />
            <HRule />
            <FlatMenuItem Icon={Sliders}    label="랭크 현황 상세"  onClick={() => navigate('/mypage/rank')} />
            <HRule />

            {/* ── 매칭 설정 ── */}
            <SectionLabel>매칭 설정</SectionLabel>
            <HRule />
            <FlatToggleItem label="같은 학과 매칭 제외" value={prefs.sameDepExclude} onToggle={() => handleToggle('sameDepExclude')} />
            <HRule />
            <FlatToggleItem label="푸시 알림" value={prefs.pushEnabled} onToggle={() => handleToggle('pushEnabled')} />
            <HRule />

            {/* ── 로그아웃 ── */}
            <div style={{ margin: '16px 20px 0' }}>
              <button onClick={handleLogout} style={s.logoutBtn}>
                <LogOut size={16} color="#e74c3c" strokeWidth={2} />
                로그아웃
              </button>
            </div>

            <div style={{ height: 24 }} />
          </>
        )}
      </div>
      <BottomTabBar />
    </div>
  );
}

// ── 공통 가로선 ────────────────────────────────────────────────────────
function HRule() {
  return <div style={{ height: 1, background: '#F0F2F5' }} />;
}

// ── 섹션 레이블 ──────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p style={{ padding: '20px 20px 6px', fontSize: 12, fontWeight: 700, color: '#999', letterSpacing: 0.5, textTransform: 'uppercase' }}>
      {children}
    </p>
  );
}

// ── 플랫 메뉴 아이템 (아이콘 우측, 메인 컬러) ─────────────────────────
function FlatMenuItem({ Icon, label, onClick }) {
  return (
    <button onClick={onClick} style={s.flatRow}>
      <p style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#111', margin: 0, textAlign: 'left' }}>{label}</p>
      <Icon size={20} color={PRIMARY} strokeWidth={2} style={{ flexShrink: 0, display: 'block' }} />
    </button>
  );
}

// ── 플랫 토글 아이템 ──────────────────────────────────────────────────
function FlatToggleItem({ label, value, onToggle }) {
  return (
    <div style={{ ...s.flatRow, cursor: 'default' }}>
      <p style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#111', margin: 0 }}>{label}</p>
      <Toggle value={value} onToggle={onToggle} />
    </div>
  );
}

function Toggle({ value, onToggle }) {
  return (
    <button onClick={onToggle} style={{ width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', background: value ? PRIMARY : '#D8DCE6', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)', left: value ? 23 : 3, transition: 'left .2s' }} />
    </button>
  );
}

function StatItem({ value, label, tierColor }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <p style={{ fontSize: 22, fontWeight: 800, color: tierColor || PRIMARY }}>{value}</p>
      <p style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>{label}</p>
    </div>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────
const s = {
  iconBtn: {
    background: PRIMARY_BG, border: 'none', cursor: 'pointer',
    width: 38, height: 38, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  flatRow: {
    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '13px 20px',
  },
  logoutBtn: {
    width: '100%', padding: '14px 16px',
    background: '#FFF5F5', border: '1px solid #FFE0E0',
    borderRadius: 14, cursor: 'pointer',
    color: '#e74c3c', fontSize: 15, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
};
