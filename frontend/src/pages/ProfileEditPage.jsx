import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { user as userApi, photo as photoApi } from '../api/client';

// ── 상수 ──────────────────────────────────────────────────
const PRIMARY    = '#003087';   // Pantone 282C
const PRIMARY_BG = '#EAF0FB';

// ── 관심사 데이터 ─────────────────────────────────────────
const INTERESTS_DATA = {
  '🏃 운동·스포츠': [
    { emoji: '💪', label: '헬스' },      { emoji: '🏃', label: '러닝' },
    { emoji: '🏊', label: '수영' },      { emoji: '🤿', label: '스노클링' },
    { emoji: '🤿', label: '다이빙' },    { emoji: '🧘', label: '필라테스' },
    { emoji: '🧘', label: '요가' },      { emoji: '🚴', label: '자전거' },
    { emoji: '🧗', label: '클라이밍' },  { emoji: '⛰️', label: '등산' },
    { emoji: '⚽', label: '축구' },      { emoji: '⚾', label: '야구 관람' },
    { emoji: '🎾', label: '테니스' },    { emoji: '🏸', label: '배드민턴' },
    { emoji: '💃', label: '댄스' },      { emoji: '⛳', label: '골프' },
    { emoji: '🏀', label: '농구' },      { emoji: '🎳', label: '볼링' },
  ],
  '🍳 요리·미식': [
    { emoji: '🍽️', label: '맛집/카페 탐방' }, { emoji: '👨‍🍳', label: '요리' },
    { emoji: '🧁', label: '베이킹/제과제빵' }, { emoji: '☕', label: '커피' },
    { emoji: '🏠', label: '홈카페' },          { emoji: '🍷', label: '와인' },
    { emoji: '🍺', label: '맥주' },            { emoji: '🍸', label: '칵테일' },
    { emoji: '🍶', label: '전통주' },          { emoji: '🍵', label: '차(티)' },
    { emoji: '🥘', label: '쿠킹 클래스' },
  ],
  '✈️ 여행·드라이브': [
    { emoji: '🗺️', label: '국내 여행' },  { emoji: '✈️', label: '해외 여행' },
    { emoji: '🚗', label: '드라이브' },   { emoji: '🏖️', label: '바다 여행' },
    { emoji: '⛺', label: '캠핑' },        { emoji: '🌟', label: '글램핑' },
  ],
  '🎬 문화·예술': [
    { emoji: '🎬', label: '영화' },   { emoji: '🎵', label: '음악' },
    { emoji: '📚', label: '독서' },   { emoji: '🖼️', label: '미술관' },
    { emoji: '🎭', label: '공연' },   { emoji: '📷', label: '사진' },
    { emoji: '🎸', label: '악기' },   { emoji: '🎨', label: '그림' },
  ],
  '🎮 게임·IT': [
    { emoji: '🎮', label: '게임' },       { emoji: '🖥️', label: 'PC방' },
    { emoji: '📹', label: '유튜브 제작' },{ emoji: '💻', label: '코딩' },
  ],
};

// ── Bio 추가 질문 목록 ────────────────────────────────────
const EXTRA_QUESTIONS = [
  '인생의 목표가 있다면',
  '이런 사람에게 호감을 느껴요',
  '좋은 연인관계의 핵심은',
  '나에게 쉬이란',
  '나의 버킷리스트',
  '요즘 관심있는 것',
];

// ── 내 정보 옵션 ──────────────────────────────────────────
const INFO_OPTIONS = {
  smoking: {
    label: '흡연', options: [
      { value: 'no_smoke',           label: '비흡연 🚭' },
      { value: 'smoke',              label: '흡연 🚬' },
      { value: 'vape',               label: '전자담배 💨' },
      { value: 'only_when_drinking', label: '술 마실 때만 🥂' },
    ],
  },
  drinking: {
    label: '음주 스타일', options: [
      { value: 'party',        label: '알코올 요정 🍻' },
      { value: 'moderate',     label: '적당히 즐김 🍺' },
      { value: 'sober',        label: '알쓰/논알콜 🥤' },
      { value: 'wine_highball',label: '와인/하이볼파 🍷' },
    ],
  },
  relationship_goal: {
    label: '만남의 목적', options: [
      { value: 'serious',       label: '진지하고 오래' },
      { value: 'gradual',       label: '썸 → 연인' },
      { value: 'casual_friend', label: '동네/학교 친구 겸 연인' },
    ],
  },
  weekend: {
    label: '주말 활동', options: [
      { value: 'outgoing',    label: '프로 밖돌이/밖순이 🗺️' },
      { value: 'local',       label: '하단/로컬 지박령 🏘️' },
      { value: 'selective',   label: '선택적 외출파 🏠' },
      { value: 'home_master', label: '집돌이/집순이 마스터 🎮' },
    ],
  },
};

const MBTI_PAIRS = [
  ['E', 'I', '외향', '내향'],
  ['S', 'N', '감각', '직관'],
  ['T', 'F', '사고', '감정'],
  ['J', 'P', '판단', '인식'],
];

// ── 완성도 계산 ───────────────────────────────────────────
function calcCompletion(photos, bioAnswers, interests, prefs) {
  let s = 0;
  if (photos.length > 0)                         s += 25;
  if (bioAnswers[0]?.answer?.trim())             s += 20;
  if (bioAnswers.length > 1)                     s += 10;
  if (interests.length > 0)                      s += 20;
  if (prefs?.mbti && !prefs.mbti.includes('?'))  s += 10;
  if (prefs?.smoking)                            s += 5;
  if (prefs?.drinking)                           s += 5;
  if (prefs?.relationship_goal)                  s += 5;
  return Math.min(s, 100);
}

function calcAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age--;
  return age;
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function ProfileEditPage() {
  const navigate   = useNavigate();
  const { userInfo } = useAuth();
  const fileRef    = useRef(null);
  const uid        = userInfo?.userId;

  // 뷰 상태
  const [view,        setView]        = useState('main'); // 'main'|'answer'|'interests'|'mbti'|'field'
  const [activeQIdx,  setActiveQIdx]  = useState(null);
  const [activeField, setActiveField] = useState(null);

  // 데이터
  const [profile,   setProfile]   = useState(null);
  const [photos,    setPhotos]    = useState([]);
  const [prefs,     setPrefs]     = useState({});
  const [bioAnswers,setBioAnswers]= useState([
    { question: '지금 하고 있는 일에 대해', answer: '', required: true },
  ]);
  const [interests, setInterests] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    Promise.all([
      userApi.get(uid).catch(() => null),
      photoApi.list(uid).catch(() => []),
      userApi.getPreferences(uid).catch(() => null),
    ]).then(([p, ph, pr]) => {
      if (p) {
        setProfile(p);
        if (p.bio) setBioAnswers(prev =>
          prev.map((b, i) => i === 0 ? { ...b, answer: p.bio } : b)
        );
      }
      if (ph) setPhotos(ph.sort((a, b) => a.photoOrder - b.photoOrder));
      if (pr) {
        setPrefs(pr);
        if (pr.interests)    setInterests(pr.interests);
        if (pr.bio_answers)  setBioAnswers(pr.bio_answers);
      }
    }).finally(() => setLoading(false));
  }, [uid]);

  const completion = calcCompletion(photos, bioAnswers, interests, prefs);

  // ── 저장 ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      const mainBio  = bioAnswers.find(b => b.required)?.answer || '';
      const fullPrefs = { ...prefs, interests, bio_answers: bioAnswers };
      await Promise.all([
        userApi.updateBio(uid, mainBio),
        userApi.updatePreferences(uid, fullPrefs),
      ]);
      navigate(-1);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── 사진 업로드/삭제 ─────────────────────────────────
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || photos.length >= 6) return;
    try {
      const uploaded = await photoApi.upload(uid, file);
      setPhotos(prev => [...prev, uploaded]);
    } catch (err) { alert(err.message); }
    e.target.value = '';
  };

  const handleDelete = async (photoId) => {
    try {
      await photoApi.delete(uid, photoId);
      setPhotos(prev => prev.filter(p => p.photoId !== photoId));
    } catch (err) { alert(err.message); }
  };

  // ── MBTI 토글 ────────────────────────────────────────
  const toggleMbti = (pairIdx, char) => {
    const cur = (prefs.mbti || '????').split('');
    cur[pairIdx] = char;
    setPrefs(prev => ({ ...prev, mbti: cur.join('') }));
  };

  // ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  // ══ 서브 뷰: 답변 작성 ══════════════════════════════
  if (view === 'answer' && activeQIdx !== null) {
    const qa = bioAnswers[activeQIdx];
    return (
      <div style={s.screen}>
        <SubHeader
          left={<Btn style={{ color: '#888' }} onClick={() => setView('main')}>✕</Btn>}
          title="답변 작성"
          right={<Btn style={{ color: PRIMARY, fontWeight: 700 }} onClick={() => setView('main')}>완료</Btn>}
        />
        <div style={{ padding: '12px 20px 12px', borderBottom: '1px solid #F0F0F0' }}>
          <p style={{ fontSize: 13, color: '#888' }}>
            🎓 학부 (대학생) · {profile?.department || '컴퓨터공학과'}
          </p>
        </div>
        <div style={{ padding: '18px 20px 8px', display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{qa.question}</p>
          <button style={{ fontSize: 12, color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer' }}>
            답변 예시 &gt;
          </button>
        </div>
        <textarea
          value={qa.answer}
          onChange={e => {
            const updated = bioAnswers.map((b, i) =>
              i === activeQIdx ? { ...b, answer: e.target.value } : b
            );
            setBioAnswers(updated);
          }}
          placeholder="답변을 입력해주세요..."
          autoFocus
          style={{
            flex: 1, width: '100%', padding: '16px 20px',
            border: 'none', outline: 'none', resize: 'none',
            fontSize: 16, lineHeight: 1.8, fontFamily: 'inherit',
            background: '#fff', color: '#111',
          }}
        />
        <div style={{ padding: '12px 20px', borderTop: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#AAA' }}>{qa.answer.length} 자</span>
          {activeQIdx < bioAnswers.length - 1 && (
            <button
              style={{ fontSize: 13, color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setActiveQIdx(prev => prev + 1)}
            >
              다음 질문 →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ══ 서브 뷰: 관심사 선택 ════════════════════════════
  if (view === 'interests') {
    const allItems = Object.values(INTERESTS_DATA).flat();
    return (
      <div style={s.screen}>
        <SubHeader
          left={<Btn onClick={() => setView('main')}>←</Btn>}
          title="내 관심사"
          right={<Btn style={{ color: PRIMARY, fontWeight: 700 }} onClick={() => setView('main')}>완료</Btn>}
        />

        {/* 선택 현황 고정 영역 */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F0F0F0', background: '#fff' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.35, color: '#111' }}>
            관심 있는 주제를<br />선택해 주세요
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: interests.length >= 10 ? '#e74c3c' : PRIMARY, marginRight: 4 }}>
              {interests.length} / 10
            </span>
            {interests.map(label => (
              <span key={label} style={s.selectedChip}>
                {label}
                <button
                  onClick={() => setInterests(prev => prev.filter(i => i !== label))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#666', marginLeft: 2 }}
                >✕</button>
              </span>
            ))}
          </div>
        </div>

        {/* 관심사 그리드 */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 20px 40px' }}>
          {Object.entries(INTERESTS_DATA).map(([cat, items]) => (
            <div key={cat} style={{ marginTop: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>{cat}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {items.map(item => {
                  const sel = interests.includes(item.label);
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (sel) setInterests(prev => prev.filter(i => i !== item.label));
                        else if (interests.length < 10) setInterests(prev => [...prev, item.label]);
                      }}
                      style={{
                        ...s.interestBtn,
                        border: `2px solid ${sel ? PRIMARY : '#EFEFEF'}`,
                        color:  sel ? PRIMARY : '#666',
                        fontWeight: sel ? 700 : 400,
                        background: sel ? '#F0F4FF' : '#FAFAFA',
                      }}
                    >
                      <span style={{ fontSize: 26 }}>{item.emoji}</span>
                      <span style={{ fontSize: 12, marginTop: 4 }}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ══ 서브 뷰: MBTI 선택 ══════════════════════════════
  if (view === 'mbti') {
    const mbti = (prefs.mbti || '????').split('');
    return (
      <div style={s.screen}>
        <SubHeader
          left={<Btn onClick={() => setView('main')}>←</Btn>}
          title="성격 유형"
          right={<Btn style={{ color: PRIMARY, fontWeight: 700 }} onClick={() => setView('main')}>완료</Btn>}
        />
        <div style={{ padding: '28px 24px 8px' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>나의 성격 유형</h2>
          <p style={{ fontSize: 14, color: '#888', marginTop: 6 }}>나는 어떤 사람인가요?</p>
          {!mbti.includes('?') && (
            <p style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: PRIMARY }}>
              {mbti.join('')}
            </p>
          )}
        </div>
        <div style={{ padding: '20px 24px 40px' }}>
          {MBTI_PAIRS.map(([left, right, lLabel, rLabel], pi) => (
            <div key={pi} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[left, right].map((char, ci) => {
                const label = ci === 0 ? lLabel : rLabel;
                const sel   = mbti[pi] === char;
                return (
                  <button
                    key={char}
                    onClick={() => toggleMbti(pi, char)}
                    style={{
                      padding: '26px 0', borderRadius: 16,
                      border: `2px solid ${sel ? PRIMARY : '#E8E8E8'}`,
                      background: sel ? '#EEF3FF' : '#F9F9F9',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 30, fontWeight: 900, color: sel ? PRIMARY : '#CCCCCC' }}>{char}</span>
                    <span style={{ fontSize: 13, color: sel ? PRIMARY : '#999' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ══ 서브 뷰: 단일 필드 선택 ═════════════════════════
  if (view === 'field' && activeField) {
    const meta = INFO_OPTIONS[activeField];
    const cur  = prefs[activeField];
    return (
      <div style={s.screen}>
        <SubHeader
          left={<Btn onClick={() => setView('main')}>←</Btn>}
          title={meta.label}
          right={<Btn style={{ color: PRIMARY, fontWeight: 700 }} onClick={() => setView('main')}>완료</Btn>}
        />
        <div style={{ padding: '28px 20px 0' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{meta.label}</h2>
        </div>
        <div style={{ padding: '8px 20px 0' }}>
          {meta.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setPrefs(prev => ({ ...prev, [activeField]: opt.value })); setView('main'); }}
              style={{
                ...s.optionRow,
                color:      cur === opt.value ? PRIMARY : '#111',
                fontWeight: cur === opt.value ? 700     : 400,
              }}
            >
              <span>{opt.label}</span>
              {cur === opt.value && <span style={{ color: PRIMARY }}>✓</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ══ 메인 뷰 ═════════════════════════════════════════
  const primaryPhoto = photos.find(p => p.isPrimary) || photos[0];

  return (
    <div style={s.screen}>
      {/* 헤더 */}
      <SubHeader
        left={<Btn onClick={() => navigate(-1)}>←</Btn>}
        title="프로필 편집"
        right={
          <span style={{ fontSize: 13, fontWeight: 700, color: '#555', background: '#F2F2F2', padding: '4px 12px', borderRadius: 20 }}>
            {completion}%
          </span>
        }
      />

      <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 80 }}>

        {/* ── 내 사진 ── */}
        <Sect title="내 사진">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
            {photos.map((ph, idx) => (
              <div key={ph.photoId} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: '#EEE' }}>
                <img
                  src={`/uploads/profiles/${ph.fileName}`}
                  alt="프로필"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {idx === 0 && (
                  <span style={s.primaryBadge}>필수 정면 ×</span>
                )}
                <button onClick={() => handleDelete(ph.photoId)} style={s.deleteBtn}>×</button>
              </div>
            ))}
            {photos.length < 6 && (
              <button onClick={() => fileRef.current?.click()} style={s.addPhotoBtn}>
                <span style={{ fontSize: 30, color: '#CCC' }}>+</span>
              </button>
            )}
          </div>
          <p style={s.hint}>길게 눌러서 순서를 변경할 수 있어요</p>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
        </Sect>

        {/* ── 내 소개글 ── */}
        <Sect title="내 소개글">
          {bioAnswers.map((qa, idx) => (
            <button
              key={idx}
              onClick={() => { setActiveQIdx(idx); setView('answer'); }}
              style={s.bioCard}
            >
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
                  {qa.question}
                  {qa.required && <span style={{ color: PRIMARY }}> (필수)</span>}
                </p>
                <p style={{ fontSize: 14, color: qa.answer ? '#555' : '#C0C0C0', marginTop: 6, lineHeight: 1.6 }}>
                  {qa.answer || '답변을 입력해주세요...'}
                </p>
              </div>
              {!qa.required && (
                <button
                  onClick={e => { e.stopPropagation(); setBioAnswers(prev => prev.filter((_, i) => i !== idx)); }}
                  style={s.removeBioBtn}
                >×</button>
              )}
            </button>
          ))}

          {/* 질문 추가 버튼 */}
          {bioAnswers.length < 6 && (
            <div style={{ position: 'relative', marginTop: 8 }}>
              <button
                onClick={() => {
                  const used = bioAnswers.map(b => b.question);
                  const next = EXTRA_QUESTIONS.find(q => !used.includes(q));
                  if (!next) return;
                  const newBio = [...bioAnswers, { question: next, answer: '', required: false }];
                  setBioAnswers(newBio);
                  setActiveQIdx(newBio.length - 1);
                  setView('answer');
                }}
                style={s.addQBtn}
              >
                <span style={{ fontSize: 12, color: PRIMARY, background: PRIMARY_BG, padding: '3px 8px', borderRadius: 12, fontWeight: 700 }}>
                  +5%
                </span>
                <span style={{ fontSize: 15, color: '#444', marginLeft: 10 }}>질문 추가</span>
              </button>
              <div style={{ position: 'absolute', top: -6, right: 0, width: 26, height: 26, borderRadius: '50%', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 16, fontWeight: 800, lineHeight: 1 }}>+</span>
              </div>
            </div>
          )}
          <p style={s.hint}>길게 눌러서 순서를 변경할 수 있어요</p>
        </Sect>

        {/* ── 내 관심사 ── */}
        <Sect title="내 관심사">
          {interests.length > 0 ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
              {interests.map(label => {
                const item = Object.values(INTERESTS_DATA).flat().find(i => i.label === label);
                return (
                  <button key={label} onClick={() => setView('interests')} style={s.interestChip}>
                    <span style={{ fontSize: 22 }}>{item?.emoji || '✨'}</span>
                    <span style={{ fontSize: 11, marginTop: 3 }}>{label}</span>
                  </button>
                );
              })}
              <button onClick={() => setView('interests')} style={{ ...s.interestChip, background: '#F5F5F5' }}>
                <span style={{ fontSize: 22, color: '#999' }}>+</span>
                <span style={{ fontSize: 11, color: '#999', marginTop: 3 }}>추가</span>
              </button>
            </div>
          ) : (
            <button onClick={() => setView('interests')} style={s.emptyBtn}>
              관심사를 추가해보세요 →
            </button>
          )}
          <p style={s.hint}>길게 눌러서 순서를 변경할 수 있어요</p>
        </Sect>

        {/* ── 내 정보 ── */}
        <Sect title="내 정보" noPadX>
          <InfoRow
            label="성격 유형 (MBTI)"
            value={prefs.mbti && !prefs.mbti.includes('?') ? prefs.mbti : '선택 안 함'}
            onClick={() => setView('mbti')}
          />
          {Object.entries(INFO_OPTIONS).map(([key, meta]) => {
            const cur = meta.options.find(o => o.value === prefs[key]);
            return (
              <InfoRow
                key={key}
                label={meta.label}
                value={cur?.label || '선택 안 함'}
                onClick={() => { setActiveField(key); setView('field'); }}
              />
            );
          })}
          <InfoRow
            label="학교"
            value="동아대학교"
          />
          {profile?.emailVerified && (
            <InfoRow
              label="학교 인증"
              value={<span style={{ color: PRIMARY, fontWeight: 700 }}>✓ 인증 완료</span>}
            />
          )}
        </Sect>

        {/* ── 필수 정보 ── */}
        <Sect title="필수 정보" noPadX style={{ borderBottom: 'none' }}>
          <InfoRow label="이름"   value={profile?.name || '-'} />
          <InfoRow label="나이"   value={profile?.birthDate ? `만 ${calcAge(profile.birthDate)}세` : '-'} />
          <InfoRow label="성별"   value={profile?.gender === 'MALE' ? '남성' : profile?.gender === 'FEMALE' ? '여성' : '-'} />
          <InfoRow label="학번"   value={profile?.studentId || '-'} />
          <InfoRow label="학과"   value={profile?.department || '-'} />
          <InfoRow label="학년"   value={profile?.grade ? `${profile.grade}학년` : '-'} />
          <InfoRow label="이메일" value={profile?.email || userInfo?.email || '-'} />
        </Sect>

      </div>

      {/* 저장 버튼 */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #F0F0F0', background: '#fff' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: '15px', borderRadius: 14,
            border: 'none', cursor: 'pointer',
            background: PRIMARY, color: '#fff', fontSize: 16, fontWeight: 700,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}

// ── 공통 서브 컴포넌트 ────────────────────────────────────

function SubHeader({ left, title, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', borderBottom: '1px solid #F4F4F4',
      position: 'sticky', top: 0, background: '#fff', zIndex: 10,
    }}>
      <div style={{ width: 60 }}>{left}</div>
      <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{title}</span>
      <div style={{ width: 60, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

function Btn({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#333', padding: 4, ...style }}>
      {children}
    </button>
  );
}

function Sect({ title, children, noPadX, style }) {
  return (
    <div style={{ borderBottom: '8px solid #F4F6FB', paddingTop: 22, paddingBottom: 4, ...style }}>
      <p style={{ fontSize: 16, fontWeight: 800, color: '#111', paddingLeft: 20, paddingRight: 20 }}>{title}</p>
      <div style={{ paddingLeft: noPadX ? 0 : 20, paddingRight: noPadX ? 0 : 20 }}>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', background: 'none', border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '15px 20px', borderBottom: '1px solid #F8F8F8',
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 14, color: '#999' }}>{value}</span>
        {onClick && <span style={{ color: '#CCC', fontSize: 16 }}>›</span>}
      </div>
    </button>
  );
}

// ── 스타일 객체 ───────────────────────────────────────────
const s = {
  screen: {
    width: '100%', maxWidth: 430, margin: '0 auto',
    minHeight: '100dvh', background: '#fff',
    display: 'flex', flexDirection: 'column',
  },
  primaryBadge: {
    position: 'absolute', top: 7, left: 7,
    background: 'rgba(0,0,0,0.55)', color: '#fff',
    fontSize: 10, padding: '3px 8px', borderRadius: 8, fontWeight: 600,
  },
  deleteBtn: {
    position: 'absolute', top: 5, right: 5,
    width: 22, height: 22, borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)', color: '#fff',
    border: 'none', cursor: 'pointer', fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  addPhotoBtn: {
    aspectRatio: '1', borderRadius: 12,
    border: '2px dashed #DDD', background: '#FAFAFA',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  hint: { fontSize: 12, color: '#C0C0C0', textAlign: 'center', marginTop: 10, marginBottom: 4 },
  bioCard: {
    width: '100%', background: '#F8F8F8', borderRadius: 14,
    padding: '16px', border: 'none', cursor: 'pointer',
    marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 10,
  },
  removeBioBtn: {
    background: '#E0E0E0', border: 'none', cursor: 'pointer',
    width: 22, height: 22, borderRadius: '50%',
    fontSize: 13, color: '#666', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  addQBtn: {
    width: '100%', border: `1.5px dashed ${PRIMARY}`,
    borderRadius: 14, padding: '14px 16px',
    background: '#FAFCFF', cursor: 'pointer',
    display: 'flex', alignItems: 'center', marginTop: 8,
  },
  interestChip: {
    flexShrink: 0, background: '#F4F4F4', border: 'none', borderRadius: 12,
    padding: '8px 10px', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 58,
  },
  interestBtn: {
    aspectRatio: '1', borderRadius: 14,
    cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: 8,
  },
  selectedChip: {
    fontSize: 13, color: '#333', background: '#F0F0F0',
    padding: '4px 10px', borderRadius: 20,
    display: 'inline-flex', alignItems: 'center', gap: 3,
  },
  emptyBtn: {
    width: '100%', marginTop: 10, padding: '14px',
    background: '#F8F8F8', border: '1.5px dashed #DDD',
    borderRadius: 14, cursor: 'pointer', fontSize: 14, color: '#999',
  },
  optionRow: {
    width: '100%', background: 'none', border: 'none',
    cursor: 'pointer', padding: '16px 0', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid #F4F4F4',
  },
};
