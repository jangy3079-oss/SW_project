import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chat } from '../api/client';
import BottomTabBar from '../components/BottomTabBar';
import { MessageCircle, Bell, User } from 'lucide-react';

const PRIMARY = '#003087';

const STATUS_LABEL = { ACTIVE: '대화 중', CLOSED: '종료됨', BLOCKED: '차단됨' };
const STATUS_COLOR = { ACTIVE: '#34C759', CLOSED: '#aaa', BLOCKED: '#FF4757' };

// 시간 포맷: 오늘이면 HH:MM, 이전이면 MM/DD
function fmtTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ChatRoomListPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chat.rooms()
      .then(data => setRooms(Array.isArray(data) ? data : []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-shell">
      <div style={{ flex: 1, background: '#fff', overflowY: 'auto', paddingBottom: 88 }}>

        {/* ── 헤더 ── */}
        <div style={{ padding: '20px 34px 16px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', letterSpacing: -0.5, margin: 0 }}>
            채팅
          </h1>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        )}

        {/* ── 빈 상태 ── */}
        {!loading && rooms.length === 0 && (
          <div style={s.emptyWrap}>
            <div style={s.emptyIconBox}>
              <MessageCircle size={36} color={PRIMARY} strokeWidth={1.6} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '16px 0 0' }}>
              아직 채팅이 없어요
            </p>
            <p style={{ fontSize: 14, color: '#aaa', marginTop: 8, lineHeight: 1.6, textAlign: 'center' }}>
              공강 매칭 또는 랭크 매칭이 성사되면<br />자동으로 채팅방이 열려요
            </p>
            <div style={s.notifPill}>
              <Bell size={14} color={PRIMARY} strokeWidth={2} />
              <span style={{ fontSize: 13, fontWeight: 600, color: PRIMARY }}>알림 받는 중</span>
            </div>
          </div>
        )}

        {/* ── 채팅 목록 ── */}
        {!loading && rooms.length > 0 && (
          <div>
            {rooms.map((room, idx) => (
              <div key={room.roomId}>
                <button
                  onClick={() => navigate(`/chat/${room.matchId}`, { state: { room } })}
                  style={s.row}
                >
                  {/* 아바타 */}
                  <div style={s.avatar}>
                    {room.opponentPhoto ? (
                      <img src={`/uploads/${room.opponentPhoto}`} alt=""
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <User size={22} color="#fff" strokeWidth={1.8} />
                    )}
                  </div>

                  {/* 텍스트 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>
                        {room.opponentName || '상대방'}
                      </span>
                      <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0, marginLeft: 8 }}>
                        {fmtTime(room.lastMessageAt)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <p style={s.preview}>
                        {room.latestMessage || '대화를 시작해보세요!'}
                      </p>
                      {room.status !== 'ACTIVE' && (
                        <span style={{ fontSize: 10, color: STATUS_COLOR[room.status], flexShrink: 0 }}>
                          {STATUS_LABEL[room.status]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 안 읽은 뱃지 */}
                  {room.unreadCount > 0 && (
                    <div style={s.badge}>{room.unreadCount > 99 ? '99+' : room.unreadCount}</div>
                  )}
                </button>

                {/* 구분선 (마지막 항목 제외) */}
                {idx < rooms.length - 1 && (
                  <div style={{ height: 1, background: '#F4F6FA', marginLeft: 80 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomTabBar />
    </div>
  );
}

const s = {
  emptyWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 32px 0',
    textAlign: 'center',
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: '#EAF0FB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    padding: '10px 22px',
    borderRadius: 24,
    background: '#EAF0FB',
  },
  row: {
    width: '100%',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 20px',
    textAlign: 'left',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4A90D9, #003087)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  preview: {
    fontSize: 13,
    color: '#999',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0,
  },
  badge: {
    background: PRIMARY,
    color: '#fff',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    padding: '0 5px',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};
