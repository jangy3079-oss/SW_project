import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chat } from '../api/client';
import BottomTabBar from '../components/BottomTabBar';

const STATUS_LABEL = { ACTIVE: '대화 중', CLOSED: '종료됨', BLOCKED: '차단됨' };
const STATUS_COLOR = { ACTIVE: 'var(--green)', CLOSED: 'var(--sub)', BLOCKED: '#FF4757' };

export default function ChatRoomListPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    chat.rooms()
      .then(setRooms)
      .catch(err => setError(err.message || '채팅방 목록을 불러올 수 없어요.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-shell">
      <div className="page">
        <h2 className="page-header">채팅</h2>

        {loading && <div className="spinner" />}

        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && rooms.length === 0 && (
          <div style={styles.empty}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>💬</div>
            <p style={{ color: 'var(--sub)', fontSize: 15 }}>아직 채팅방이 없어요</p>
            <p style={{ color: 'var(--sub)', fontSize: 13, marginTop: 6 }}>
              매칭이 성사되면 채팅이 시작돼요
            </p>
          </div>
        )}

        {rooms.map(room => (
          <div
            key={room.roomId}
            className="card"
            style={{ cursor: 'pointer', padding: '16px 20px' }}
            onClick={() => navigate(`/chat/${room.matchId}`, { state: { room } })}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* 아바타 */}
              <div style={styles.avatar}>👤</div>

              {/* 내용 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{room.opponentName}</span>
                  <span style={{ fontSize: 11, color: STATUS_COLOR[room.status] }}>
                    {STATUS_LABEL[room.status] || room.status}
                  </span>
                </div>
                <p style={{
                  fontSize: 13, color: 'var(--sub)', marginTop: 4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {room.latestMessage || '대화를 시작해보세요!'}
                </p>
              </div>

              {/* 안 읽은 메시지 뱃지 */}
              {room.unreadCount > 0 && (
                <div style={styles.unreadBadge}>{room.unreadCount}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <BottomTabBar />
    </div>
  );
}

const styles = {
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    textAlign: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FF6B9D, #C44EFF)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    flexShrink: 0,
  },
  unreadBadge: {
    background: 'var(--pink)',
    color: '#fff',
    borderRadius: '50%',
    width: 20,
    height: 20,
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};
