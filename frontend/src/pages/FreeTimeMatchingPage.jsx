import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { timetable as timetableApi, freeTime } from '../api/client';
import BottomTabBar from '../components/BottomTabBar';
import {
  Camera, Calendar, RefreshCw, Inbox, User, Wrench,
  CheckCircle, ChevronLeft, Shuffle,
} from 'lucide-react';

const PRIMARY     = '#003087';
const PRIMARY_BG  = '#EAF0FB';

const MAX_REROLL = 3;   // 남성 리롤 최대 횟수
const MALE_LIMIT = 2;   // 남성에게 보여줄 후보 수

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function FreeTimeMatchingPage() {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const fileInputRef = useRef();

  const [registered, setRegistered] = useState(null);
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [uploadMsg, setUploadMsg]   = useState('');
  const [actionMsg, setActionMsg]   = useState('');
  const [testMsg, setTestMsg]       = useState('');
  const [confirmResult, setConfirmResult] = useState(null);
  const [showUpload, setShowUpload]       = useState(false);
  const [mySlots, setMySlots]             = useState(null);
  const [rerollCount, setRerollCount]     = useState(0);
  const [visiblePool, setVisiblePool]     = useState([]);  // 남성용 셔플 풀

  const userId  = userInfo?.userId;
  const isMale  = userInfo?.gender === 'MALE';

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    load();
  }, [userId]);

  async function load() {
    setLoading(true);
    try {
      const status = await timetableApi.status(userId);
      const isReg = status?.registered ?? false;
      setRegistered(isReg);
      if (isReg) {
        const [list, slotsData] = await Promise.all([
          freeTime.pending(userId),
          timetableApi.getSlots(userId).catch(() => null),
        ]);
        const arr = Array.isArray(list) ? list : [];
        setRequests(arr);
        setMySlots(slotsData?.freeSlots ?? null);
        // 남성: 최초 로드 시 셔플해서 풀 세팅
        if (userInfo?.gender === 'MALE') {
          setVisiblePool(shuffle(arr));
          setRerollCount(0);
        }
      }
    } catch {
      setRegistered(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    setUploadMsg('');
    try {
      const result = await timetableApi.upload(userId, file);
      setConfirmResult(result?.freeSlots ?? {});
    } catch (err) {
      setUploadMsg(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleConfirm() {
    setConfirmResult(null);
    setShowUpload(false);
    load();
  }

  function handleReupload() {
    setConfirmResult(null);
    setUploadMsg('');
    setShowUpload(true);
  }

  async function handleAccept(requestId) {
    try {
      await freeTime.accept(requestId, userId);
      setActionMsg('수락했습니다! 매칭이 성사되었어요.');
      load();
    } catch (e) {
      setActionMsg(e.message);
    }
  }

  async function handleReject(requestId) {
    try {
      await freeTime.reject(requestId, userId);
      setActionMsg('거절했습니다.');
      load();
    } catch (e) {
      setActionMsg(e.message);
    }
  }

  function handleReroll() {
    if (rerollCount >= MAX_REROLL) return;
    setVisiblePool(shuffle(requests));
    setRerollCount(c => c + 1);
  }

  async function handleTestRun() {
    try {
      setTestMsg('실행 중...');
      await freeTime.testRun();
      setTestMsg('스케줄러 실행 완료!');
      load();
    } catch (e) {
      setTestMsg(e.message);
    }
  }

  const DAY_KO = { MON:'월', TUE:'화', WED:'수', THU:'목', FRI:'금' };
  const DAYS   = ['MON','TUE','WED','THU','FRI'];

  const card = {
    background: '#fff', borderRadius: 20, padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)', boxSizing: 'border-box',
  };
  const slotRow = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 0', borderBottom: '1px solid #f0f0f0',
  };
  const dayLabel = {
    fontSize: 13, fontWeight: 700, color: PRIMARY,
    width: 20, textAlign: 'center', flexShrink: 0,
  };
  const slotChip = {
    fontSize: 12, fontWeight: 600, color: PRIMARY,
    background: PRIMARY_BG, borderRadius: 20, padding: '3px 10px',
  };
  const btnPrimary = {
    width: '100%', padding: '14px 0', borderRadius: 12,
    background: PRIMARY, color: '#fff', border: 'none', cursor: 'pointer',
    fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const btnOutline = {
    width: '100%', padding: '14px 0', borderRadius: 12,
    background: '#fff', color: PRIMARY, border: `1.5px solid ${PRIMARY}`,
    cursor: 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px 20px 8px', gap: 4 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
            <ChevronLeft size={24} color="#111" />
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: 0 }}>공강 매칭</h2>
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {!userId && !loading && (
            <p style={{ fontSize: 14, color: '#e00', textAlign: 'center', marginTop: 40 }}>로그인 정보를 불러올 수 없습니다.</p>
          )}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}>
              <Inbox size={32} color="#ddd" />
            </div>
          )}

          {/* ── 업로드 결과 확인 ── */}
          {!loading && confirmResult && (
            <>
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <CheckCircle size={22} color={PRIMARY} strokeWidth={1.8} />
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: 0 }}>분석이 완료됐어요!</p>
                </div>
                {Object.keys(confirmResult).length === 0 ? (
                  <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center' }}>인식된 공강 시간이 없습니다</p>
                ) : (
                  DAYS.map(day => {
                    const slots = confirmResult[day];
                    if (!slots?.length) return null;
                    return (
                      <div key={day} style={slotRow}>
                        <span style={dayLabel}>{DAY_KO[day]}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {slots.map((s, i) => <span key={i} style={slotChip}>{s}</span>)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <button style={btnPrimary} onClick={handleConfirm}>맞아요, 저장할게요</button>
              <button style={btnOutline} onClick={handleReupload}>다시 올릴게요</button>
            </>
          )}

          {/* ── 시간표 미등록 ── */}
          {!loading && !confirmResult && userId && (registered === false || showUpload) && (
            <>
              <div style={{ ...card, textAlign: 'center', padding: '40px 24px' }}>
                <Calendar size={44} color="#ccc" strokeWidth={1.2} style={{ marginBottom: 16 }} />
                <p style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 8 }}>시간표를 등록해주세요</p>
                <p style={{ fontSize: 13, color: '#999', lineHeight: 1.7, marginBottom: 24 }}>
                  에브리타임 시간표 캡처를 올리면<br />공강이 겹치는 상대를 찾아드려요
                </p>
                {uploadMsg && <p style={{ fontSize: 13, color: '#e00', marginBottom: 12 }}>{uploadMsg}</p>}
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
                <button style={btnPrimary} onClick={() => fileInputRef.current.click()} disabled={uploading}>
                  <Camera size={16} color="#fff" style={{ marginRight: 6 }} />
                  {uploading ? '분석 중...' : '시간표 업로드'}
                </button>
                {showUpload && (
                  <button style={{ ...btnOutline, marginTop: 8 }} onClick={() => { setShowUpload(false); setUploadMsg(''); }}>취소</button>
                )}
              </div>
              <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>에브리타임 앱 → 시간표 화면 캡처 → 업로드</p>
            </>
          )}

          {/* ── 시간표 등록됨 ── */}
          {!loading && !confirmResult && userId && registered === true && !showUpload && (
            <>
              {/* 내 공강 시간 */}
              {mySlots && Object.keys(mySlots).length > 0 && (
                <div style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: 0 }}>내 공강 시간</p>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#aaa', fontFamily: 'inherit' }}
                      onClick={handleReupload}
                    >
                      <RefreshCw size={12} color="#aaa" />재업로드
                    </button>
                  </div>
                  {DAYS.map(day => {
                    const slots = mySlots[day];
                    if (!slots?.length) return null;
                    return (
                      <div key={day} style={slotRow}>
                        <span style={dayLabel}>{DAY_KO[day]}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {slots.map((s, i) => <span key={i} style={slotChip}>{s}</span>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {uploadMsg && <p style={{ fontSize: 13, color: '#e00' }}>{uploadMsg}</p>}
              {actionMsg && <p style={{ fontSize: 13, color: PRIMARY, fontWeight: 600 }}>{actionMsg}</p>}

              {/* 섹션 헤더 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#111', margin: 0 }}>
                  {isMale ? `추천 후보 ${Math.min(visiblePool.length, MALE_LIMIT)}명` : `받은 요청 ${requests.length}명`}
                </p>
                {isMale && requests.length > 0 && (
                  <button
                    onClick={handleReroll}
                    disabled={rerollCount >= MAX_REROLL}
                    style={{
                      background: 'none', border: `1.5px solid ${rerollCount >= MAX_REROLL ? '#ddd' : PRIMARY}`,
                      borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600,
                      cursor: rerollCount >= MAX_REROLL ? 'not-allowed' : 'pointer',
                      color: rerollCount >= MAX_REROLL ? '#ccc' : PRIMARY, fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <Shuffle size={12} />다른 후보 ({MAX_REROLL - rerollCount}회)
                  </button>
                )}
              </div>

              {/* 빈 상태 */}
              {(isMale ? visiblePool : requests).length === 0 && (
                <div style={{ ...card, textAlign: 'center', padding: '40px 24px' }}>
                  <Inbox size={32} color="#ddd" strokeWidth={1.5} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 14, color: '#aaa' }}>아직 들어온 요청이 없어요</p>
                  <p style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>매일 자정에 공강 매칭 요청이 생성돼요</p>
                </div>
              )}

              {/* 요청 카드 */}
              {(isMale ? visiblePool.slice(0, MALE_LIMIT) : requests).map(req => (
                <div key={req.requestId} style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: PRIMARY_BG,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <User size={20} color={PRIMARY} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 15, color: '#111', margin: 0 }}>{req.partnerName}</p>
                      <p style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                        {req.partnerGender === 'MALE' ? '남성' : '여성'}
                      </p>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#aaa' }}>날짜</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{req.matchedDate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: '#aaa' }}>공강 시간</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>
                        {req.overlapStart?.substring(0, 5)} ~ {req.overlapEnd?.substring(0, 5)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ ...btnPrimary, flex: 1 }} onClick={() => handleAccept(req.requestId)}>
                      수락
                    </button>
                    <button style={{ ...btnOutline, flex: 1 }} onClick={() => handleReject(req.requestId)}>
                      거절
                    </button>
                  </div>
                </div>
              ))}

              {/* 개발자 도구 */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: 11, color: '#ccc', marginBottom: 8 }}>개발자 도구</p>
                {testMsg && <p style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>{testMsg}</p>}
                <button
                  style={{ background: 'none', border: 'none', fontSize: 12, color: '#ccc', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={handleTestRun}
                >
                  <Wrench size={13} color="#ccc" />스케줄러 즉시 실행
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <BottomTabBar />
    </div>
  );
}
