import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { user as userApi } from '../api/client';

const PRIMARY = '#003087';

const TIERS = [
  { key: 'BRONZE',   label: '브론즈',    color: '#CD7F32', min: 0.00, max: 1.99 },
  { key: 'SILVER',   label: '실버',      color: '#A8A9AD', min: 2.00, max: 2.99 },
  { key: 'GOLD',     label: '골드',      color: '#FFD700', min: 3.00, max: 3.99 },
  { key: 'PLATINUM', label: '플래티넘',  color: '#5AA9E6', min: 4.00, max: 4.49 },
  { key: 'DIAMOND',  label: '다이아몬드',color: '#89CFF0', min: 4.50, max: 5.00 },
];

const UNRANKED_META = { label: 'UNRANKED', color: '#666666' };

function getTierIndex(tierKey) {
  return TIERS.findIndex(t => t.key === tierKey);
}

export default function RankDetailPage() {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    userApi.get(userInfo?.userId).then(res => setProfile(res.data?.data ?? res.data)).catch(() => {});
  }, [userInfo]);

  const tierKey   = profile?.rankTier ?? 'UNRANKED';
  const isUnranked = tierKey === 'UNRANKED';
  const evalCnt   = profile?.evalCount ?? 0;
  const score     = parseFloat(profile?.rankScore ?? 0);
  const tierIdx   = getTierIndex(tierKey);
  const current   = isUnranked ? null : TIERS[tierIdx];
  const next      = isUnranked ? TIERS[0] : (TIERS[tierIdx + 1] ?? null);

  // 현재 티어 내 진행도 (0~1)
  const range    = current ? ((current.max - current.min) + 0.01) : 1;
  const progress = current ? Math.min(((score - current.min) / range), 1) : 0;

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: '#fff', fontFamily: 'inherit' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 12px', borderBottom: '1px solid #f0f0f0' }}>
        <button onClick={() => navigate('/mypage')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginRight: 8 }}>
          <ChevronLeft size={22} color="#222" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700 }}>랭크 현황</span>
      </div>

      <div style={{ padding: '32px 24px 48px' }}>
        {/* 현재 티어 */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: isUnranked ? '#f0f0f0' : `${current?.color}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <Trophy size={32} color={isUnranked ? '#bbb' : current?.color} strokeWidth={2} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: isUnranked ? '#bbb' : current?.color, letterSpacing: 1 }}>
            {isUnranked ? 'UNRANKED' : current?.label?.toUpperCase()}
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#111', marginTop: 6 }}>
            {isUnranked ? '–' : (isNaN(score) ? '–' : score.toFixed(2))}
            {!isUnranked && <span style={{ fontSize: 14, fontWeight: 500, color: '#999', marginLeft: 4 }}>/ 5.00</span>}
          </div>
          <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>
            {isUnranked ? `평가 ${evalCnt}회 · 브론즈까지 ${3 - evalCnt}회 남음` : `평가 ${evalCnt}회`}
          </div>
        </div>

        {/* 프로그레스 바 */}
        {isUnranked ? (
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#aaa', marginBottom: 8 }}>
              <span>UNRANKED</span>
              <span style={{ color: TIERS[0].color, fontWeight: 600 }}>브론즈까지 {3 - evalCnt}회 남음</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: '#f0f0f0', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: '#ddd',
                width: `${(evalCnt / 3) * 100}%`,
                transition: 'width 0.6s cubic-bezier(0.32, 0.72, 0, 1)',
              }} />
            </div>
          </div>
        ) : next ? (
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#aaa', marginBottom: 8 }}>
              <span>{current?.label}</span>
              <span style={{ color: next.color, fontWeight: 600 }}>{next.label}까지 {Math.max(0, next.min - score).toFixed(2)}점</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: '#f0f0f0', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: `linear-gradient(90deg, ${current?.color}, ${next.color})`,
                width: `${progress * 100}%`,
                transition: 'width 0.6s cubic-bezier(0.32, 0.72, 0, 1)',
              }} />
            </div>
          </div>
        ) : null}

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid #f0f0f0', marginBottom: 24 }} />

        {/* 티어 기준표 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TIERS.map((t, i) => {
            const isMe = t.key === tierKey;
            return (
              <div key={t.key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 12,
                background: isMe ? `${t.color}18` : 'transparent',
                border: isMe ? `1.5px solid ${t.color}44` : '1.5px solid transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: isMe ? 700 : 500, color: isMe ? t.color : '#555' }}>
                    {t.label}
                  </span>
                  {isMe && <span style={{ fontSize: 11, color: t.color, fontWeight: 700 }}>● 현재</span>}
                </div>
                <span style={{ fontSize: 13, color: '#aaa' }}>
                  {t.max >= 5 ? `${t.min.toFixed(2)} 이상` : `${t.min.toFixed(2)} – ${t.max.toFixed(2)}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid #f0f0f0', margin: '32px 0 28px' }} />

        {/* 랭크 제도 소개 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          <InfoBlock title="랭크란 무엇인가요?">
            랭크는 매칭 상대방이 남긴 평가 점수를 바탕으로 산정되는 나의 인기도 지표예요.
            평가가 쌓일수록 더 정확하게 계산되며, 비슷한 랭크의 상대와 매칭될 확률이 높아져요.
          </InfoBlock>

          <InfoBlock title="점수는 어떻게 매겨지나요?">
            매칭 상대방은 채팅이 끝난 후 만남 만족도와 매너 점수를 1~5점으로 평가해요.
            내 랭크 점수는 두 항목 평균값의 누적 평균이고, 평가가 추가될 때마다 실시간으로 반영돼요.
            점수는 상대방에게 공개되지 않고 나만 확인할 수 있어요.
          </InfoBlock>

          <InfoBlock title="티어 산정 기준">
            평가 횟수가 3회 미만이면 UNRANKED 상태가 돼요.{'\n'}
            3회 이상 평가가 쌓이면 평균 점수에 따라 자동으로 티어가 결정돼요.{'\n\n'}
            • 브론즈 — 평균 2.00점 미만{'\n'}
            • 실버 — 평균 2.00 ~ 2.99점{'\n'}
            • 골드 — 평균 3.00 ~ 3.99점{'\n'}
            • 플래티넘 — 평균 4.00 ~ 4.49점{'\n'}
            • 다이아몬드 — 평균 4.50점 이상
          </InfoBlock>

          <InfoBlock title="랭크를 올리려면?">
            매칭에 자주 참여하고 상대방에게 좋은 인상을 남기는 것이 핵심이에요.
            프로필을 성실하게 작성하고, 채팅에서 진심 어린 대화를 나눠보세요.
            티어가 높을수록 비슷한 수준의 상대와 매칭될 기회가 늘어나요.
          </InfoBlock>

          <div style={{ background: '#f8f9fb', borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ fontSize: 12, color: '#aaa', lineHeight: 1.8, margin: 0 }}>
              💡 랭크 점수와 티어는 상대방에게 공개되지 않아요. 오직 본인만 확인할 수 있어요.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 16px', textAlign: 'center' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: '#EAF0FB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Trophy size={26} color={PRIMARY} strokeWidth={1.8} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>
              랭크를 올리고 싶다면?
            </p>
            <p style={{ fontSize: 13, color: '#aaa', margin: '0 0 20px', lineHeight: 1.6 }}>
              매칭에 참여할수록 평가가 쌓이고 티어가 올라요
            </p>
            <button
              onClick={() => navigate('/home')}
              style={{
                padding: '13px 48px', borderRadius: 24,
                background: PRIMARY, color: '#fff',
                border: 'none', cursor: 'pointer',
                fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
              }}
            >
              매칭 참여하기
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function InfoBlock({ title, children }) {
  return (
    <div>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>{title}</p>
      <p style={{ fontSize: 13, color: '#777', lineHeight: 1.9, margin: 0, whiteSpace: 'pre-line' }}>{children}</p>
    </div>
  );
}
