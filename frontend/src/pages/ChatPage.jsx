import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chat, matching } from '../api/client';
import { ArrowLeft, MoreVertical, User, Send } from 'lucide-react';
import AuthImage from '../components/AuthImage';

const PRIMARY = '#003087';

export default function ChatPage() {
  const navigate  = useNavigate();
  const { matchId } = useParams();
  const location  = useLocation();
  const { userInfo } = useAuth();
  const room = location.state?.room;

  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [showMenu,  setShowMenu]  = useState(false);
  const [error,     setError]     = useState('');
  const [partnerId, setPartnerId] = useState(null);

  const bottomRef = useRef(null);
  const pollRef   = useRef(null);
  const uid = userInfo?.userId;

  // ── 상대방 userId 파악 (active → history 순서로 탐색) ──────────
  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        let list = await matching.active(uid).catch(() => []);
        let found = list?.find(m => String(m.matchId) === String(matchId));
        if (!found) {
          const hist = await matching.history(uid).catch(() => []);
          found = hist?.find(m => String(m.matchId) === String(matchId));
        }
        if (found?.partnerId) setPartnerId(found.partnerId);
      } catch {}
    })();
  }, [uid, matchId]);

  // ── 메시지 로드 + 3초 폴링 ─────────────────────────────────────
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
    pollRef.current = setInterval(loadMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── 전송 ──────────────────────────────────────────────────────
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
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── 메뉴 액션들 ───────────────────────────────────────────────
  const handleClose = async () => {
    if (!window.confirm('채팅방을 종료할까요?')) return;
    try { await chat.close(matchId); navigate('/chat', { replace: true }); }
    catch (err) { setError(err.message || '종료에 실패했어요.'); }
  };

  const handleBlock = async () => {
    if (!window.confirm('이 사용자를 차단할까요?')) return;
    try { await chat.block(matchId); navigate('/chat', { replace: true }); }
    catch (err) { setError(err.message || '차단에 실패했어요.'); }
  };

  const handleReport = async () => {
    const reason = window.prompt('신고 사유를 입력해주세요:');
    if (!reason) return;
    try { await chat.report(matchId, reason); alert('신고가 접수됐어요.'); setShowMenu(false); }
    catch (err) { setError(err.message || '신고에 실패했어요.'); }
  };

  // ── 유틸 ──────────────────────────────────────────────────────
  const fmt     = (dt) => dt ? new Date(dt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
  const isMine  = (msg) => msg.senderId === uid;
  const opponentName = room?.opponentName || '상대방';

  return (
    <div style={s.wrap}>

      {/* ── 헤더 ─────────────────────────────────────────────── */}
      <div style={s.header}>
        <button style={s.iconBtn} onClick={() => navigate('/chat')}>
          <ArrowLeft size={22} color="#111" strokeWidth={2} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 17, color: '#111' }}>{opponentName}</span>
        <button style={s.iconBtn} onClick={() => setShowMenu(v => !v)}>
          <MoreVertical size={22} color="#111" strokeWidth={2} />
        </button>
      </div>

      {/* ── 드롭다운 ──────────────────────────────────────────── */}
      {showMenu && (
        <>
          <div style={s.menuOverlay} onClick={() => setShowMenu(false)} />
          <div style={s.menuDropdown}>
            <button
              style={{ ...s.menuItem, color: partnerId ? '#111' : '#bbb' }}
              onClick={() => { setShowMenu(false); partnerId && navigate(`/partner/${partnerId}`); }}
            >
              상대 프로필 보기
            </button>
            <button style={s.menuItem} onClick={handleClose}>채팅방 종료</button>
            <button style={s.menuItem} onClick={handleBlock}>사용자 차단</button>
            <button style={{ ...s.menuItem, color: '#FF4757', borderBottom: 'none' }} onClick={handleReport}>
              신고하기
            </button>
          </div>
        </>
      )}

      {/* ── 메시지 영역 ───────────────────────────────────────── */}
      <div style={s.messageArea} onClick={() => setShowMenu(false)}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ margin: '12px 16px' }}>{error}</div>
        )}

        {!loading && messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: '#aaa', fontSize: 14 }}>
            첫 메시지를 보내보세요!
          </div>
        )}

        {messages.map((msg, i) => {
          const mine = isMine(msg);
          // 연속 메시지면 아바타 숨김 (투명하게 공간 유지)
          const showAvatar = !mine && (i === 0 || isMine(messages[i - 1]));

          return (
            <div key={msg.messageId ?? i} style={{ ...s.msgRow, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              {!mine && (
                <div style={{ ...s.avatarSm, opacity: showAvatar ? 1 : 0 }}>
                  {room?.opponentPhoto ? (
                    <AuthImage src={`/uploads/${room.opponentPhoto}`} alt=""
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <User size={16} color="#fff" />
                  )}
                </div>
              )}

              <div style={{ maxWidth: '68%' }}>
                <div style={{ ...s.bubble, ...(mine ? s.bubbleMine : s.bubbleTheirs) }}>
                  {msg.content}
                </div>
                <p style={{ ...s.time, textAlign: mine ? 'right' : 'left' }}>
                  {fmt(msg.createdAt)}
                  {mine && msg.isRead && (
                    <span style={{ marginLeft: 4, color: PRIMARY, fontWeight: 600 }}>읽음</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── 입력 영역 ─────────────────────────────────────────── */}
      <div style={s.inputArea}>
        <input
          style={s.textInput}
          placeholder="메시지를 입력하세요..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          style={{ ...s.sendBtn, opacity: input.trim() ? 1 : 0.35 }}
          onClick={handleSend}
          disabled={!input.trim() || sending}
        >
          <Send size={17} color="#fff" />
        </button>
      </div>
    </div>
  );
}

// ── 스타일 ──────────────────────────────────────────────────────
const s = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    maxWidth: 430,
    width: '100%',
    margin: '0 auto',
    background: '#F4F6FA',
    position: 'relative',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 8px',
    background: '#fff',
    borderBottom: '1px solid #F0F2F5',
    flexShrink: 0,
    zIndex: 100,
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
  },
  menuOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 150,
  },
  menuDropdown: {
    position: 'absolute',
    top: 60,
    right: 12,
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
    zIndex: 200,
    overflow: 'hidden',
    minWidth: 164,
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '14px 20px',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid #F4F6FA',
    textAlign: 'left',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: '#111',
  },
  messageArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  msgRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  avatarSm: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4A90D9, #003087)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  bubble: {
    padding: '10px 14px',
    borderRadius: 18,
    fontSize: 15,
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  bubbleMine: {
    background: PRIMARY,
    color: '#fff',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    background: '#fff',
    color: '#111',
    borderBottomLeftRadius: 4,
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  },
  time: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 4,
    paddingLeft: 4,
    paddingRight: 4,
  },
  inputArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: '#fff',
    borderTop: '1px solid #F0F2F5',
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    padding: '11px 16px',
    border: '1.5px solid #EBEBEB',
    borderRadius: 24,
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    background: '#F9FAFC',
    lineHeight: 1.5,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: PRIMARY,
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'opacity 0.15s',
  },
};
