import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { timetable as timetableApi } from '../api/client';
import { ChevronLeft, Calendar, RefreshCw, CheckCircle, Camera } from 'lucide-react';

const PRIMARY    = '#003087';
const PRIMARY_BG = '#EAF0FB';

const DAYS   = ['MON','TUE','WED','THU','FRI'];
const DAY_KO = { MON:'월', TUE:'화', WED:'수', THU:'목', FRI:'금' };

export default function TimetableManagePage() {
  const navigate     = useNavigate();
  const { userInfo } = useAuth();
  const fileInputRef = useRef();

  const userId = userInfo?.userId;

  const [registered,     setRegistered]     = useState(null);
  const [mySlots,        setMySlots]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [uploading,      setUploading]      = useState(false);
  const [uploadMsg,      setUploadMsg]      = useState('');
  const [confirmResult,  setConfirmResult]  = useState(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    load();
  }, [userId]); // eslint-disable-line

  async function load() {
    setLoading(true);
    try {
      const status = await timetableApi.status(userId);
      const isReg  = status?.registered ?? false;
      setRegistered(isReg);
      if (isReg) {
        const slotsData = await timetableApi.getSlots(userId).catch(() => null);
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
    load();
  }

  const card = {
    background: '#fff', borderRadius: 20, padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)', boxSizing: 'border-box',
  };
  const slotRow = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 0', borderBottom: '1px solid #f0f0f0',
  };
  const slotChip = {
    fontSize: 12, fontWeight: 600, color: PRIMARY,
    background: PRIMARY_BG, borderRadius: 20, padding: '3px 10px',
  };
  const btnPrimary = {
    width: '100%', padding: '14px 0', borderRadius: 12,
    background: PRIMARY, color: '#fff', border: 'none', cursor: 'pointer',
    fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
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
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: 0 }}>시간표 관리</h2>
        </div>

        <div style={{ padding: '8px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}>
              <Calendar size={32} color="#ddd" />
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
                <p style={{ fontSize: 13, color: '#aaa', marginBottom: 14 }}>아래 공강 시간이 맞는지 확인해주세요</p>
                {Object.keys(confirmResult).length === 0 ? (
                  <p style={{ fontSize: 13, color: '#ccc', textAlign: 'center', padding: '12px 0' }}>인식된 공강 시간이 없습니다</p>
                ) : (
                  DAYS.map(day => {
                    const slots = confirmResult[day];
                    if (!slots?.length) return null;
                    return (
                      <div key={day} style={slotRow}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, width: 20, textAlign: 'center', flexShrink: 0 }}>{DAY_KO[day]}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {slots.map((s, i) => <span key={i} style={slotChip}>{s}</span>)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <button style={btnPrimary} onClick={handleConfirm}>맞아요, 저장할게요</button>
              <button style={btnOutline} onClick={() => { setConfirmResult(null); setUploadMsg(''); }}>다시 올릴게요</button>
            </>
          )}

          {/* ── 시간표 없음 ── */}
          {!loading && !confirmResult && registered === false && (
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
                  <Camera size={16} color="#fff" />
                  {uploading ? '분석 중...' : '시간표 업로드'}
                </button>
              </div>
              <p style={{ fontSize: 12, color: '#bbb', textAlign: 'center' }}>에브리타임 앱 → 시간표 화면 캡처 → 업로드</p>
            </>
          )}

          {/* ── 시간표 등록됨 ── */}
          {!loading && !confirmResult && registered === true && (
            <>
              {mySlots && Object.keys(mySlots).length > 0 ? (
                <div style={card}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 14px' }}>등록된 공강 시간</p>
                  {DAYS.map(day => {
                    const slots = mySlots[day];
                    if (!slots?.length) return null;
                    return (
                      <div key={day} style={slotRow}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, width: 20, textAlign: 'center', flexShrink: 0 }}>{DAY_KO[day]}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {slots.map((s, i) => <span key={i} style={slotChip}>{s}</span>)}
                        </div>
                      </div>
                    );
                  })}
                  <p style={{ fontSize: 12, color: '#bbb', marginTop: 14 }}>이 시간대를 기준으로 매일 자정에 매칭이 이뤄져요</p>
                </div>
              ) : (
                <div style={card}>
                  <p style={{ fontSize: 14, color: '#aaa', textAlign: 'center', padding: '12px 0' }}>등록된 공강 시간이 없어요</p>
                </div>
              )}

              {uploadMsg && <p style={{ fontSize: 13, color: '#e00' }}>{uploadMsg}</p>}

              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
              <button
                style={{ ...btnOutline, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => { setUploadMsg(''); fileInputRef.current.click(); }}
                disabled={uploading}
              >
                <RefreshCw size={15} color={PRIMARY} />
                {uploading ? '분석 중...' : '시간표 재업로드'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
