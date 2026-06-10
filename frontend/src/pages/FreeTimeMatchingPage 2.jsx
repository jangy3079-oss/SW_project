import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { timetable as timetableApi, freeTime } from '../api/client';
import BottomTabBar from '../components/BottomTabBar';
import {
  Coffee, Camera, Calendar, RefreshCw, Inbox, User, Info, Wrench,
  CheckCircle, XCircle, ChevronLeft,
} from 'lucide-react';

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
  const [mySlots, setMySlots]             = useState(null); // 등록된 공강 시간

  const userId = userInfo?.userId;

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
        setRequests(Array.isArray(list) ? list : []);
        setMySlots(slotsData?.freeSlots ?? null);
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

  return (
    <div className="app-shell">
      <div className="page">
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0 12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }}
          >
            <ChevronLeft size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Coffee size={22} color="#00B894" strokeWidth={2} />
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>공강 친구 매칭</h2>
          </div>
        </div>

        {!userId && !loading && (
          <div className="alert alert-error">로그인 정보를 불러올 수 없습니다. 다시 로그인해주세요.</div>
        )}

        {loading && <div className="spinner" />}

        {/* ── 업로드 결과 확인 단계 ── */}
        {!loading && confirmResult && (
          <>
            <div className="card" style={{ textAlign: 'center', padding: '20px 20px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <CheckCircle size={36} color="#00B894" strokeWidth={1.8} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>분석이 완료됐어요!</h3>
              <p style={{ fontSize: 13, color: 'var(--sub)' }}>아래 공강 시간이 맞는지 확인해주세요</p>
            </div>

            <div className="card">
              {Object.keys(confirmResult).length === 0 ? (
                <p style={{ color: 'var(--sub)', fontSize: 14, textAlign: 'center' }}>
                  인식된 공강 시간이 없습니다
                </p>
              ) : (
                ['MON','TUE','WED','THU','FRI'].map(day => {
                  const slots = confirmResult[day];
                  if (!slots?.length) return null;
                  const dayKo = { MON:'월', TUE:'화', WED:'수', THU:'목', FRI:'금' }[day];
                  return (
                    <div key={day} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '10px 0', borderBottom: '1px solid var(--border)',
                    }}>
                      <span style={{
                        fontWeight: 700, fontSize: 14, color: 'var(--pink)',
                        minWidth: 20, paddingTop: 2,
                      }}>{dayKo}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {slots.map((s, i) => (
                          <span key={i} style={{
                            fontSize: 14, background: 'var(--bg)',
                            padding: '3px 10px', borderRadius: 8,
                          }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button className="btn btn-primary" onClick={handleConfirm}>
              맞아요, 저장할게요
            </button>
            <button className="btn btn-outline" onClick={handleReupload}>
              다시 올릴게요
            </button>
          </>
        )}

        {/* ── 시간표 미등록 or 재업로드 ── */}
        {!loading && !confirmResult && userId && (registered === false || showUpload) && (
          <>
            <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <Calendar size={48} color="var(--sub)" strokeWidth={1.2} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
                시간표를 먼저 등록해주세요
              </h3>
              <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.7, marginBottom: 20 }}>
                에브리타임 시간표 캡처 이미지를 올리면<br />
                공강 시간이 맞는 친구를 찾아드려요!
              </p>

              {uploadMsg && (
                <div className="alert alert-error" style={{ textAlign: 'left', marginBottom: 14 }}>
                  {uploadMsg}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleUpload}
              />
              <button
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
              >
                <Camera size={18} color="#fff" />
                {uploading ? '분석 중...' : '시간표 이미지 업로드'}
              </button>
              {showUpload && (
                <button
                  className="btn btn-outline"
                  style={{ marginTop: 10 }}
                  onClick={() => { setShowUpload(false); setUploadMsg(''); }}
                >
                  취소
                </button>
              )}
            </div>

            <div className="alert alert-info" style={{ fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>에브리타임 앱 → 시간표 화면 캡처 → 이미지 업로드</span>
            </div>
          </>
        )}

        {/* ── 시간표 등록됨 ── */}
        {!loading && !confirmResult && userId && registered === true && !showUpload && (
          <>
            <div className="alert alert-info" style={{ fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Coffee size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>매일 자정, 내일 공강이 겹치는 상대에게 매칭 요청이 옵니다.<br />수락하면 즉시 채팅이 가능해요!</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <button
              className="btn btn-outline"
              style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={handleReupload}
            >
              <RefreshCw size={16} color="var(--primary)" />
              시간표 재업로드
            </button>

            {uploadMsg && (
              <div className="alert alert-error">{uploadMsg}</div>
            )}

            {/* ── 내 공강 시간 요약 ── */}
            {mySlots && Object.keys(mySlots).length > 0 && (
              <div className="card" style={{ marginBottom: 4 }}>
                <p style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--sub)',
                  letterSpacing: '0.05em', marginBottom: 10,
                }}>내 공강 시간</p>
                {['MON','TUE','WED','THU','FRI'].map(day => {
                  const slots = mySlots[day];
                  if (!slots?.length) return null;
                  const dayKo = { MON:'월', TUE:'화', WED:'수', THU:'목', FRI:'금' }[day];
                  return (
                    <div key={day} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '6px 0',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      <span style={{
                        width: 20, fontWeight: 700, fontSize: 13,
                        color: '#00B894', textAlign: 'center',
                      }}>{dayKo}</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {slots.map((s, i) => (
                          <span key={i} style={{
                            fontSize: 12, background: '#D4F5EC',
                            color: '#00876A', padding: '2px 9px',
                            borderRadius: 20, fontWeight: 600,
                          }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <p style={{ fontSize: 11, color: 'var(--sub)', marginTop: 8 }}>
                  이 시간대를 기준으로 매일 자정에 매칭이 이뤄져요
                </p>
              </div>
            )}

            {actionMsg && (
              <div className="alert alert-success">{actionMsg}</div>
            )}

            <p className="section-title">받은 매칭 요청</p>

            {requests.length === 0 && (
              <div className="card" style={{ textAlign: 'center', color: 'var(--sub)', padding: '32px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <Inbox size={36} color="var(--sub)" strokeWidth={1.5} />
                </div>
                <p>아직 들어온 요청이 없어요</p>
                <p style={{ fontSize: 12, marginTop: 6 }}>매일 자정에 공강 매칭 요청이 생성됩니다</p>
              </div>
            )}

            {requests.map(req => (
              <div key={req.requestId} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D4F5EC, #00B894)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <User size={22} color="#fff" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{req.partnerName}</p>
                    <p style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>
                      {req.partnerGender === 'MALE' ? '남성' : '여성'}
                    </p>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg)', borderRadius: 10, padding: '10px 14px',
                  fontSize: 13, marginBottom: 14,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--sub)' }}>날짜</span>
                    <span style={{ fontWeight: 600 }}>{req.matchedDate}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--sub)' }}>공강 시간</span>
                    <span style={{ fontWeight: 600, color: 'var(--green)' }}>
                      {req.overlapStart?.substring(0, 5)} ~ {req.overlapEnd?.substring(0, 5)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onClick={() => handleAccept(req.requestId)}
                  >
                    <CheckCircle size={16} color="#fff" />수락
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onClick={() => handleReject(req.requestId)}
                  >
                    <XCircle size={16} color="var(--primary)" />거절
                  </button>
                </div>
              </div>
            ))}

            {/* 개발자 도구 */}
            <p className="section-title" style={{ marginTop: 28 }}>개발자 도구</p>
            <div className="card">
              <p style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 12 }}>
                자정 스케줄러를 즉시 실행해 내일 날짜 기준으로 매칭 요청을 생성합니다.
              </p>
              {testMsg && (
                <div className="alert alert-info" style={{ marginBottom: 10 }}>{testMsg}</div>
              )}
              <button
                className="btn btn-ghost"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={handleTestRun}
              >
                <Wrench size={16} color="var(--sub)" />
                스케줄러 즉시 실행 (테스트)
              </button>
            </div>
          </>
        )}
      </div>
      <BottomTabBar />
    </div>
  );
}
