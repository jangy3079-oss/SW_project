import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { matching } from '../api/client';
import { Trophy, Coffee, Inbox, ChevronRight } from 'lucide-react';

const PRIMARY = '#003087';
const PRIMARY_BG = '#EAF0FB';
const SUB     = '#888888';
const SHADOW  = '0 2px 12px rgba(0,0,0,0.07)';

export default function MatchPage() {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userInfo?.userId) { setLoading(false); return; }
    matching.history(userInfo.userId)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userInfo?.userId]);

  return (
    <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ flex: 1, paddingBottom: 88, overflowY: 'auto' }}>

        {/* 헤더 */}
        <div style={{ padding: '20px 34px 6px' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', letterSpacing: -0.5, margin: 0 }}>매칭</h1>
        </div>

        {/* 새 매칭 */}
        <div style={{ padding: '20px 20px 0' }}>
          <p style={s.sectionLabel}>새 매칭 시작</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <OptionCard
              Icon={Coffee}
              title="공강 친구 매칭"
              desc="공강 시간이 맞는 친구 찾기"
              onClick={() => navigate('/match/freetime/pick')}
            />
            <OptionCard
              Icon={Trophy}
              title="랭크 매칭"
              desc="내 티어 근처 상대와 정밀 매칭"
              onClick={() => navigate('/match/waiting', { state: { type: 'RANK' } })}
            />
          </div>
        </div>

        {/* 매칭 이력 */}
        <div style={{ padding: '28px 20px 0' }}>
          <p style={s.sectionLabel}>매칭 이력</p>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <div className="spinner" style={{ borderTopColor: PRIMARY }} />
            </div>
          )}

          {!loading && history.length === 0 && (
            <div style={s.emptyBox}>
              <Inbox size={32} color="#D0D5DD" strokeWidth={1.5} />
              <p style={{ fontSize: 14, color: SUB, marginTop: 10 }}>아직 매칭 이력이 없어요</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map(m => (
              <div key={m.matchId} style={s.historyCard}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
                      {m.partnerName || '상대방'}
                    </span>
                    <StatusBadge status={m.status} />
                  </div>
                  <p style={{ fontSize: 12, color: SUB }}>
                    {m.matchType === 'RANK' ? '랭크' : '일반'} ·{' '}
                    {m.matchedAt ? new Date(m.matchedAt).toLocaleDateString('ko-KR') : '-'}
                  </p>
                </div>
                {m.status === 'ACTIVE' && (
                  <button
                    style={s.evalBtn}
                    onClick={() => navigate(`/match/evaluate/${m.matchId}`, { state: { match: m } })}
                  >
                    평가
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function OptionCard({ Icon, title, desc, onClick }) {
  return (
    <div style={s.optionCard} onClick={onClick}>
      <div style={s.iconWrap}>
        <Icon size={20} color={PRIMARY} strokeWidth={2} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: 0 }}>{title}</p>
        <p style={{ fontSize: 13, color: SUB, marginTop: 2 }}>{desc}</p>
      </div>
      <ChevronRight size={16} color="#D0D5DD" strokeWidth={2.5} />
    </div>
  );
}

const STATUS_MAP = {
  ACTIVE:    { label: '진행 중',   bg: PRIMARY_BG, color: PRIMARY },
  EVALUATED: { label: '평가 완료', bg: '#F4F4F4',  color: SUB },
  EXPIRED:   { label: '만료됨',    bg: '#F4F4F4',  color: SUB },
};

function StatusBadge({ status }) {
  const st = STATUS_MAP[status] || STATUS_MAP.EXPIRED;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, padding: '2px 8px', borderRadius: 20 }}>
      {st.label}
    </span>
  );
}

const s = {
  sectionLabel: {
    fontSize: 12, fontWeight: 700, color: SUB,
    textTransform: 'uppercase', letterSpacing: 0.5,
    margin: '0 0 12px',
  },
  optionCard: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: '#fff', borderRadius: 16, padding: '16px 18px',
    boxShadow: SHADOW, cursor: 'pointer',
  },
  iconWrap: {
    width: 46, height: 46, borderRadius: 13,
    background: PRIMARY_BG,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  historyCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#fff', borderRadius: 14, padding: '14px 16px',
    boxShadow: SHADOW,
  },
  evalBtn: {
    padding: '7px 16px', borderRadius: 20,
    background: PRIMARY, color: '#fff',
    border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
    flexShrink: 0,
  },
  emptyBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '40px 20px', background: '#fff',
    borderRadius: 16, boxShadow: SHADOW,
  },
};
