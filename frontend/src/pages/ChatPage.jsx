import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chat } from '../api/client';

export default function ChatPage() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const location = useLocation();
  const { userInfo } = useAuth();
  const room = location.state?.room;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  // 메시지 불러오기
  const loadMessages = async () => {
    try {
      const data = await chat.messages(matchId);
      setMessages(data || []);
    } catch (err) {
      setError(err.message || '메시지를 불러올 수 없어요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    chat.read(matchId).catch(() => {});

    // 3초마다 폴링
    pollRef.current = setInterval(loadMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [matchId]);

  // 새 메시지 오면 스크롤 내리기
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput('');
    try {
      const msg = await chat.send(matchId, text);
      setMessages(prev => [...prev, msg]);
    } catch (err) {
      setError(err.message || '전송에 실패했어요.');
      setInput(text); // 실패하면 복원
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = async () => {
    if (!window.confirm('채팅방을 종료할까요?')) return;
    try {
      await chat.close(matchId);
      navigate('/chat', { replace: true });
    } catch (err) {
      setError(err.message || '종료에 실패했어요.');
    }
  };

  const handleBlock = async () => {
    if (!window.confirm('이 사용자를 차단할까요?')) return;
    try {
      await chat.block(matchId);
      navigate('/chat', { replace: true });
    } catch (err) {
      setError(err.message || '차단에 실패했어요.');
    }
  };

  const handleReport = async () => {
    const reason = window.prompt('신고 사유를 입력해주세요:');
    if (!reason) return;
    try {
      await chat.report(matchId, reason);
      alert('신고가 접수됐어요.');
      setShowMenu(false);
    } catch (err) {
      setError(err.message || '신고에 실패했어요.');
    }
  };

  const fmt = (dt) => {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const isMine = (msg) => msg.senderId === userInfo?.userId;

  const opponentName = room?.opponentName || '상대방';

  return (
    <div style={styles.wrap}>
      {/* 헤더 */}
      <div style={styles.header}>
        <button style={styles.iconBtn} onClick={() => navigate('/chat')}>←</button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: 16 }}>{opponentName}</p>
        </div>
        <button style={styles.iconBtn} onClick={() => setShowMenu(v => !v)}>⋯</button>
      </div>

      {/* 드롭다운 메뉴 */}
      {showMenu && (
        <div style={styles.menuDropdown}>
          <button style={styles.menuItem} onClick={handleClose}>채팅방 종료</button>
          <button style={styles.menuItem} onClick={handleBlock}>사용자 차단</button>
          <button style={{ ...styles.menuItem, color: '#FF4757' }} onClick={handleReport}>신고하기</button>
        </div>
      )}

      {/* 메시지 영역 */}
      <div style={styles.messageArea} onClick={() => setShowMenu(false)}>
        {loading && <div className="spinner" />}

        {error && (
          <div className="alert alert-error" style={{ margin: '12px 16px' }}>{error}</div>
        )}

        {!loading && messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--sub)', fontSize: 14 }}>
            첫 메시지를 보내보세요! 👋
          </div>
        )}

        {messages.map((msg, i) => {
          const mine = isMine(msg);
          return (
            <div key={msg.messageId ?? i} style={{ ...styles.msgRow, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              {!mine && <div style={styles.avatarSm}>👤</div>}
              <div style={{ maxWidth: '68%' }}>
                <div style={{ ...styles.bubble, ...(mine ? styles.bubbleMine : styles.bubbleTheirs) }}>
                  {msg.content}
                </div>
                <p style={{ ...styles.time, textAlign: mine ? 'right' : 'left' }}>
                  {fmt(msg.createdAt)}
                  {mine && (
                    <span style={{ marginLeft: 4, color: msg.isRead ? 'var(--green)' : 'var(--sub)' }}>
                      {msg.isRead ? '읽음' : ''}
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      <div style={styles.inputArea}>
        <textarea
          style={styles.textInput}
          placeholder="메시지를 입력하세요..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.4 }}
          onClick={handleSend}
          disabled={!input.trim() || sending}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    maxWidth: 430,
    width: '100%',
    margin: '0 auto',
    background: 'var(--bg)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: 'var(--white)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    color: 'var(--sub)',
    padding: '4px 8px',
  },
  menuDropdown: {
    position: 'absolute',
    top: 58,
    right: 'calc(50% - 215px + 8px)',
    background: 'var(--white)',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    zIndex: 200,
    overflow: 'hidden',
    minWidth: 140,
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '14px 20px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text)',
  },
  messageArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  msgRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  avatarSm: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FF6B9D, #C44EFF)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  },
  bubble: {
    padding: '10px 14px',
    borderRadius: 18,
    fontSize: 15,
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  bubbleMine: {
    background: 'var(--pink)',
    color: '#fff',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    background: 'var(--white)',
    color: 'var(--text)',
    borderBottomLeftRadius: 4,
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  },
  time: {
    fontSize: 11,
    color: 'var(--sub)',
    marginTop: 4,
    paddingLeft: 4,
    paddingRight: 4,
  },
  inputArea: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    padding: '12px 16px',
    background: 'var(--white)',
    borderTop: '1px solid var(--border)',
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    padding: '10px 14px',
    border: '1.5px solid var(--border)',
    borderRadius: 20,
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'none',
    maxHeight: 120,
    background: 'var(--bg)',
    lineHeight: 1.5,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: 'var(--pink)',
    color: '#fff',
    border: 'none',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};
