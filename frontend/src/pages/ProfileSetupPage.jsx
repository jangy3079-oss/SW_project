import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { user as userApi, photo as photoApi } from '../api/client';
import { Camera, PenLine, Lightbulb, Leaf, GraduationCap, ClipboardList, Sparkles, X } from 'lucide-react';
import AuthImage from '../components/AuthImage';

// ── 상수 ──────────────────────────────────────────────────
const PRIMARY    = '#003087';
const PRIMARY_BG = '#EAF0FB';

const STEPS = [
  { id: 1, Icon: Camera,     title: '사진 등록',    desc: '동아대 친구들에게 나를 소개해요' },
  { id: 2, Icon: PenLine,    title: '자기소개',     desc: '나만의 이야기를 들려주세요' },
  { id: 3, Icon: Lightbulb,  title: '관심사',       desc: '공통 취미를 가진 상대를 만나요' },
  { id: 4, Icon: Leaf,       title: '라이프스타일', desc: '나의 생활 패턴을 알려주세요' },
];

// ── 관심사 데이터 (이모지는 콘텐츠 데이터이므로 유지) ───────
const INTERESTS_DATA = {
  '🏃 운동·스포츠': [
    { emoji: '💪', label: '헬스' },      { emoji: '🏃', label: '러닝' },
    { emoji: '🏊', label: '수영' },      { emoji: '🧘', label: '필라테스' },
    { emoji: '🧘', label: '요가' },      { emoji: '🚴', label: '자전거' },
    { emoji: '🧗', label: '클라이밍' },  { emoji: '⛰️', label: '등산' },
    { emoji: '⚽', label: '축구' },      { emoji: '🎾', label: '테니스' },
    { emoji: '🏸', label: '배드민턴' },  { emoji: '💃', label: '댄스' },
    { emoji: '⛳', label: '골프' },      { emoji: '🏀', label: '농구' },
    { emoji: '🎳', label: '볼링' },
  ],
  '🍳 요리·미식': [
    { emoji: '🍽️', label: '맛집/카페 탐방' }, { emoji: '👨‍🍳', label: '요리' },
    { emoji: '🧁', label: '베이킹/제과제빵' }, { emoji: '☕', label: '커피' },
    { emoji: '🏠', label: '홈카페' },          { emoji: '🍷', label: '와인' },
    { emoji: '🍺', label: '맥주' },            { emoji: '🍵', label: '차(티)' },
  ],
  '✈️ 여행·드라이브': [
    { emoji: '🗺️', label: '국내 여행' }, { emoji: '✈️', label: '해외 여행' },
    { emoji: '🚗', label: '드라이브' },  { emoji: '🏖️', label: '바다 여행' },
    { emoji: '⛺', label: '캠핑' },       { emoji: '🌟', label: '글램핑' },
  ],
  '🎬 문화·예술': [
    { emoji: '🎬', label: '영화' },  { emoji: '🎵', label: '음악' },
    { emoji: '📚', label: '독서' },  { emoji: '🖼️', label: '미술관' },
    { emoji: '🎭', label: '공연' },  { emoji: '📷', label: '사진' },
    { emoji: '🎸', label: '악기' },  { emoji: '🎨', label: '그림' },
  ],
  '🎮 게임·IT': [
    { emoji: '🎮', label: '게임' },       { emoji: '🖥️', label: 'PC방' },
    { emoji: '📹', label: '유튜브 제작' },{ emoji: '💻', label: '코딩' },
  ],
};

const QUESTION_CATEGORIES = [
  {
    category: '나를 설명하는',
    questions: [
      '나의 장점을 꼽자면',
      '요즘 가장 즐기고 있는 것',
      '스트레스 받을 때 나는',
      '나의 버킷리스트',
      '나에게 쉬이란',
      '인생의 목표가 있다면',
    ],
  },
  {
    category: '어떤 인연을 원하는',
    questions: [
      '이런 사람에게 호감을 느껴요',
      '좋은 연인관계의 핵심은',
      '이상형의 조건이 있다면',
      '함께 하고 싶은 데이트는',
      '선호하는 연락 스타일은',
      '요즘 관심있는 것',
    ],
  },
];

const INFO_OPTIONS = {
  smoking: {
    label: '흡연', options: [
      { value: 'no_smoke',           label: '비흡연' },
      { value: 'smoke',              label: '흡연' },
      { value: 'vape',               label: '전자담배' },
      { value: 'only_when_drinking', label: '술 마실 때만' },
    ],
  },
  drinking: {
    label: '음주 스타일', options: [
      { value: 'party',         label: '알코올 요정' },
      { value: 'moderate',      label: '적당히 즐김' },
      { value: 'sober',         label: '알쓰/논알콜' },
      { value: 'wine_highball', label: '와인/하이볼파' },
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
      { value: 'outgoing',    label: '프로 밖돌이/밖순이' },
      { value: 'local',       label: '하단/로컬 지박령' },
      { value: 'selective',   label: '선택적 외출파' },
      { value: 'home_master', label: '집돌이/집순이 마스터' },
    ],
  },
};

const MBTI_PAIRS = [
  ['E', 'I', '외향', '내향'],
  ['S', 'N', '감각', '직관'],
  ['T', 'F', '사고', '감정'],
  ['J', 'P', '판단', '인식'],
];

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function ProfileSetupPage() {
  const navigate     = useNavigate();
  const { userInfo } = useAuth();
  const fileRef          = useRef(null);
  const chipContainerRef = useRef(null);
  const skipMainAnim     = useRef(false); // 서브뷰 복귀 시 메인 진입 애니메이션 스킵
  const uid              = userInfo?.userId;

  const [chipContainerH, setChipContainerH] = useState(0);

  const [step,        setStep]        = useState(1);
  const [view,        setView]        = useState('main');
  const [activeQIdx,  setActiveQIdx]  = useState(null);
  const [activeField, setActiveField] = useState(null);

  const [profile,    setProfile]    = useState(null);
  const [photos,     setPhotos]     = useState([]);
  const [prefs,      setPrefs]      = useState({});
  const [bioAnswers, setBioAnswers] = useState([
    { question: '나를 한마디로 설명하자면?', answer: '', required: true },
  ]);
  const [interests,  setInterests]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [qPickerOpen,       setQPickerOpen]       = useState(false);
  const [qPickerVisible,    setQPickerVisible]    = useState(false);
  const [closingAnswer,     setClosingAnswer]     = useState(false);
  const [closingInterests,  setClosingInterests]  = useState(false);
  const [closingMbti,       setClosingMbti]       = useState(false);
  const [closingField,      setClosingField]      = useState(false);
  const [closingStep,       setClosingStep]       = useState(false);
  const [stepDir,           setStepDir]           = useState('forward'); // 'forward' | 'back'

  // 애니메이션 CSS 주입
  useEffect(() => {
    const id = 'profile-setup-anim';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = `
        @keyframes answerSlideIn {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes answerSlideOut {
          from { opacity: 1; transform: translateX(0);    }
          to   { opacity: 0; transform: translateX(28px); }
        }
        @keyframes chipFadeIn {
          from { opacity: 0; transform: scale(0.65); }
          to   { opacity: 1; transform: scale(1);    }
        }
        @keyframes stepEnter {
          from { opacity: 0; transform: translateX(72px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
        @keyframes stepExit {
          from { opacity: 1; transform: translateX(0)     scale(1);    }
          to   { opacity: 0; transform: translateX(-72px) scale(0.96); }
        }
        @keyframes stepEnterBack {
          from { opacity: 0; transform: translateX(-72px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0)     scale(1);    }
        }
        @keyframes stepExitBack {
          from { opacity: 1; transform: translateX(0)    scale(1);    }
          to   { opacity: 0; transform: translateX(72px) scale(0.96); }
        }
      `;
      document.head.appendChild(el);
    }
  }, []);

  // 칩 컨테이너 높이 측정 → CSS height transition용
  useEffect(() => {
    const el = chipContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setChipContainerH(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [view]); // view 전환 시 재연결

  // 서브뷰 → 메인 복귀 후 한 프레임 뒤 flag 리셋
  useEffect(() => {
    if (view === 'main') {
      const t = setTimeout(() => { skipMainAnim.current = false; }, 50);
      return () => clearTimeout(t);
    }
  }, [view]);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    Promise.all([
      userApi.get(uid).catch(() => null),
      photoApi.list(uid).catch(() => []),
      userApi.getPreferences(uid).catch(() => null),
    ]).then(([p, ph, pr]) => {
      if (p) setProfile(p);
      if (ph) setPhotos(ph.sort((a, b) => a.photoOrder - b.photoOrder));
      if (pr) {
        const raw    = pr.preferences || {};
        const parsed = { ...raw };
        try { if (raw.interests)   parsed.interests   = JSON.parse(raw.interests);   } catch {}
        try { if (raw.bio_answers) parsed.bio_answers = JSON.parse(raw.bio_answers); } catch {}
        setPrefs(parsed);
        if (Array.isArray(parsed.interests))   setInterests(parsed.interests);
        if (Array.isArray(parsed.bio_answers)) setBioAnswers(parsed.bio_answers);
      }
    }).finally(() => setLoading(false));
  }, [uid]);

  const canProceed = () => {
    if (step === 1) return photos.length >= 1;
    if (step === 2) return bioAnswers[0]?.answer?.trim().length > 0;
    return true;
  };

  const handleComplete = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      const mainBio = bioAnswers.find(b => b.required)?.answer || '';
      const simplePrefs = {};
      ['mbti', 'smoking', 'drinking', 'relationship_goal', 'weekend'].forEach(k => {
        if (prefs[k]) simplePrefs[k] = prefs[k];
      });
      simplePrefs.interests   = JSON.stringify(interests);
      simplePrefs.bio_answers = JSON.stringify(bioAnswers);
      await Promise.all([
        userApi.updateBio(uid, mainBio),
        userApi.updatePreferences(uid, { preferences: simplePrefs }),
      ]);
      navigate('/home', { replace: true });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (step < 4) {
      setStepDir('forward');
      setClosingStep(true);
      setTimeout(() => {
        setStep(s => s + 1);
        setClosingStep(false);
      }, 220);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    setStepDir('back');
    setClosingStep(true);
    setTimeout(() => {
      setStep(s => s - 1);
      setClosingStep(false);
    }, 220);
  };

  const closeField = () => {
    setClosingField(true);
    skipMainAnim.current = true;
    setTimeout(() => { setView('main'); setClosingField(false); }, 250);
  };

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

  // ── 질문 피커 헬퍼 ──────────────────────────────────────
  const openQPicker = () => {
    setQPickerOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setQPickerVisible(true)));
  };

  const closeQPicker = () => {
    setQPickerVisible(false);
    setTimeout(() => setQPickerOpen(false), 300);
  };

  const openAnswerView = (idx) => {
    setActiveQIdx(idx);
    setClosingAnswer(false);
    setView('answer');
  };

  const closeAnswerView = () => {
    setClosingAnswer(true);
    skipMainAnim.current = true;
    setTimeout(() => { setView('main'); setClosingAnswer(false); }, 250);
  };

  const closeInterests = () => {
    setClosingInterests(true);
    skipMainAnim.current = true;
    setTimeout(() => { setView('main'); setClosingInterests(false); }, 250);
  };

  const closeMbti = () => {
    setClosingMbti(true);
    skipMainAnim.current = true;
    setTimeout(() => { setView('main'); setClosingMbti(false); }, 250);
  };

  const toggleMbti = (pairIdx, char) => {
    const cur = (prefs.mbti || '????').split('');
    cur[pairIdx] = char;
    setPrefs(prev => ({ ...prev, mbti: cur.join('') }));
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  // ══ 서브 뷰: 답변 작성 ══
  if (view === 'answer' && activeQIdx !== null) {
    const qa = bioAnswers[activeQIdx];
    return (
      <div style={{ ...s.screen, animation: closingAnswer ? 'answerSlideOut 0.25s ease forwards' : 'answerSlideIn 0.25s ease' }}>
        <SubHeader
          left={<Btn onClick={closeAnswerView}><X size={18} color="#888" /></Btn>}
          title="답변 작성"
          right={<Btn style={{ color: PRIMARY, fontWeight: 700 }} onClick={closeAnswerView}>완료</Btn>}
        />
        <div style={{ padding: '12px 20px 12px', borderBottom: '1px solid #F0F0F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <GraduationCap size={14} color="#888" />
            <p style={{ fontSize: 13, color: '#888' }}>
              학부 (대학생) · {profile?.department || '동아대학교'}
            </p>
          </div>
        </div>
        <div style={{ padding: '18px 20px 8px', display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{qa.question}</p>
        </div>
        <textarea
          value={qa.answer}
          onChange={e => {
            setBioAnswers(prev => prev.map((b, i) =>
              i === activeQIdx ? { ...b, answer: e.target.value } : b
            ));
          }}
          placeholder="답변을 입력해주세요..."
          autoFocus
          style={{
            flex: 1, width: '100%', padding: '16px 20px',
            border: 'none', outline: 'none', resize: 'none',
            fontSize: 16, lineHeight: 1.8, fontFamily: 'inherit',
            background: '#fff', color: '#111', boxSizing: 'border-box',
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

  // ══ 서브 뷰: 관심사 선택 ══
  if (view === 'interests') {
    return (
      <div style={{ ...s.screen, animation: closingInterests ? 'answerSlideOut 0.25s ease forwards' : 'answerSlideIn 0.25s ease' }}>
        <SubHeader
          left={<Btn onClick={closeInterests}>←</Btn>}
          title="내 관심사"
          right={<Btn style={{ color: PRIMARY, fontWeight: 700 }} onClick={closeInterests}>완료</Btn>}
        />
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F0F0F0', background: '#fff' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.35, color: '#111' }}>
            관심 있는 주제를<br />선택해 주세요
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: interests.length >= 10 ? '#e74c3c' : PRIMARY }}>
              {interests.length} / 10
            </span>
          </div>
          {/* 높이 부드럽게 확장 — ResizeObserver로 측정한 실제 높이로 transition */}
          <div style={{
            height: interests.length === 0 ? 0 : chipContainerH + 8,
            overflow: 'hidden',
            transition: 'height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <div
              ref={chipContainerRef}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 8 }}
            >
              {interests.map(label => (
                <span key={label} style={{ ...s.selectedChip, animation: 'chipFadeIn 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                  {label}
                  <button
                    onClick={() => setInterests(prev => prev.filter(i => i !== label))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#666', marginLeft: 2 }}
                  >✕</button>
                </span>
              ))}
            </div>
          </div>
        </div>
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
                        border:      `2px solid ${sel ? PRIMARY : '#EFEFEF'}`,
                        color:       sel ? PRIMARY : '#666',
                        fontWeight:  sel ? 700 : 400,
                        background:  sel ? '#F0F4FF' : '#FAFAFA',
                        transition:  'background 0.18s, border-color 0.18s, color 0.18s',
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

  // ══ 서브 뷰: MBTI ══
  if (view === 'mbti') {
    const mbti = (prefs.mbti || '????').split('');
    return (
      <div style={{ ...s.screen, animation: closingMbti ? 'answerSlideOut 0.25s ease forwards' : 'answerSlideIn 0.25s ease' }}>
        <SubHeader
          left={<Btn onClick={closeMbti}>←</Btn>}
          title="성격 유형"
          right={<Btn style={{ color: PRIMARY, fontWeight: 700 }} onClick={closeMbti}>완료</Btn>}
        />
        <div style={{ padding: '28px 24px 8px' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>나의 성격 유형</h2>
          <p style={{ fontSize: 14, color: '#888', marginTop: 6 }}>나는 어떤 사람인가요?</p>
          {/* 항상 렌더링, grid-template-rows로 높이 부드럽게 확장 */}
          <div style={{
            display: 'grid',
            gridTemplateRows: mbti.includes('?') ? '0fr' : '1fr',
            transition: 'grid-template-rows 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <div style={{ overflow: 'hidden' }}>
              <p style={{
                marginTop: 10, fontSize: 22, fontWeight: 800, color: PRIMARY,
                opacity: mbti.includes('?') ? 0 : 1,
                transition: 'opacity 0.28s ease 0.08s',
              }}>
                {mbti.join('')}
              </p>
            </div>
          </div>
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
                      transition: 'background 0.2s, border-color 0.2s',
                    }}
                  >
                    <span style={{ fontSize: 30, fontWeight: 900, color: sel ? PRIMARY : '#CCCCCC', transition: 'color 0.2s' }}>{char}</span>
                    <span style={{ fontSize: 13, color: sel ? PRIMARY : '#999', transition: 'color 0.2s' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ══ 서브 뷰: 단일 필드 선택 ══
  if (view === 'field' && activeField) {
    const meta = INFO_OPTIONS[activeField];
    const cur  = prefs[activeField];
    return (
      <div style={{ ...s.screen, animation: closingField ? 'answerSlideOut 0.25s ease forwards' : 'answerSlideIn 0.25s ease' }}>
        <SubHeader
          left={<Btn onClick={closeField}>←</Btn>}
          title={meta.label}
          right={<Btn style={{ color: PRIMARY, fontWeight: 700 }} onClick={closeField}>완료</Btn>}
        />
        <div style={{ padding: '28px 20px 0' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{meta.label}</h2>
        </div>
        <div style={{ padding: '8px 20px 0' }}>
          {meta.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setPrefs(prev => ({ ...prev, [activeField]: opt.value })); closeField(); }}
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

  // ══ 메인 위자드 ══
  const stepData     = STEPS[step - 1];
  const StepIcon     = stepData.Icon;
  const mbtiDisplay  = prefs.mbti && !prefs.mbti.includes('?') ? prefs.mbti : null;

  return (
    <div style={s.screen}>

      {/* 상단 프로그레스 + 헤더 */}
      <div style={{ padding: '52px 24px 24px', background: '#fff' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {STEPS.map(st => (
            <div
              key={st.id}
              style={{
                flex: 1, height: 4, borderRadius: 2,
                background: st.id <= step ? PRIMARY : '#E5E7EB',
                transition: 'background 0.35s',
              }}
            />
          ))}
        </div>

        {/* step 바뀔 때 카드 스와이프 / 서브뷰 복귀 시 애니메이션 없음 */}
        <div key={step} style={{ animation: skipMainAnim.current ? 'none'
          : closingStep
            ? (stepDir === 'back' ? 'stepExitBack 0.22s cubic-bezier(0.4,0,0.2,1) forwards' : 'stepExit 0.22s cubic-bezier(0.4,0,0.2,1) forwards')
            : (stepDir === 'back' ? 'stepEnterBack 0.28s cubic-bezier(0.25,0.46,0.45,0.94)' : 'stepEnter 0.28s cubic-bezier(0.25,0.46,0.45,0.94)') }}>
          <p style={{ fontSize: 13, color: PRIMARY, fontWeight: 700, marginBottom: 6 }}>
            STEP {step} / {STEPS.length}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: PRIMARY_BG,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <StepIcon size={28} color={PRIMARY} strokeWidth={1.8} />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', margin: 0 }}>
                {stepData.title}
              </h1>
              <p style={{ fontSize: 14, color: '#888', marginTop: 4 }}>{stepData.desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 단계별 콘텐츠 */}
      <div style={{ flex: 1, overflowX: 'hidden', position: 'relative' }}>
      <div key={step} style={{ height: '100%', overflowY: 'auto', paddingBottom: 20, animation: skipMainAnim.current ? 'none'
          : closingStep
            ? (stepDir === 'back' ? 'stepExitBack 0.22s cubic-bezier(0.4,0,0.2,1) forwards' : 'stepExit 0.22s cubic-bezier(0.4,0,0.2,1) forwards')
            : (stepDir === 'back' ? 'stepEnterBack 0.28s cubic-bezier(0.25,0.46,0.45,0.94)' : 'stepEnter 0.28s cubic-bezier(0.25,0.46,0.45,0.94)') }}>

        {/* STEP 1: 사진 등록 */}
        {step === 1 && (
          <div style={{ padding: '4px 20px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {photos.map((ph, idx) => (
                <div
                  key={ph.photoId}
                  style={{ position: 'relative', aspectRatio: '1', borderRadius: 14, overflow: 'hidden', background: '#EEE' }}
                >
                  <AuthImage
                    src={`/uploads/${ph.fileName}`}
                    alt="프로필"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {idx === 0 && (
                    <span style={s.primaryBadge}>대표 사진</span>
                  )}
                  <button onClick={() => handleDelete(ph.photoId)} style={s.deleteBtn}>×</button>
                </div>
              ))}
              {photos.length < 6 && (
                <button onClick={() => fileRef.current?.click()} style={s.addPhotoBtn}>
                  <span style={{ fontSize: 32, color: '#C8C8C8', lineHeight: 1 }}>+</span>
                  <span style={{ fontSize: 11, color: '#BDBDBD', marginTop: 4 }}>사진 추가</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />

            <div style={{ marginTop: 20, background: PRIMARY_BG, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <ClipboardList size={14} color={PRIMARY} />
                <p style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>사진 등록 가이드</p>
              </div>
              <p style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>
                · 첫 번째 사진이 상대방에게 먼저 보여요<br />
                · 정면 사진을 대표 사진으로 설정해요<br />
                · 최대 6장까지 등록할 수 있어요
              </p>
            </div>

            {photos.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: 13, color: '#F05050', marginTop: 14, fontWeight: 600 }}>
                사진을 1장 이상 등록해야 다음 단계로 넘어갈 수 있어요
              </p>
            )}
          </div>
        )}

        {/* STEP 2: 자기소개 */}
        {step === 2 && (
          <div style={{ padding: '4px 20px 20px' }}>
            {bioAnswers.map((qa, idx) => (
              <button
                key={idx}
                onClick={() => openAnswerView(idx)}
                style={s.bioCard}
              >
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>
                    {qa.question}
                    {qa.required && <span style={{ color: PRIMARY }}> *</span>}
                  </p>
                  <p style={{
                    fontSize: 14, color: qa.answer ? '#555' : '#C0C0C0',
                    marginTop: 6, lineHeight: 1.6,
                  }}>
                    {qa.answer || '탭해서 답변을 입력해주세요...'}
                  </p>
                </div>
                {!qa.required && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setBioAnswers(prev => prev.filter((_, i) => i !== idx));
                    }}
                    style={s.removeBioBtn}
                  >×</button>
                )}
              </button>
            ))}

            {bioAnswers.length < 4 && (
              <button onClick={openQPicker} style={s.addQBtn}>
                <span style={{ fontSize: 12, color: PRIMARY, background: PRIMARY_BG, padding: '3px 8px', borderRadius: 12, fontWeight: 700 }}>
                  + 질문 추가
                </span>
                <span style={{ fontSize: 14, color: '#666', marginLeft: 10 }}>더 많이 알려줄수록 매칭이 잘 돼요</span>
              </button>
            )}

            {!bioAnswers[0]?.answer?.trim() && (
              <p style={{ textAlign: 'center', fontSize: 13, color: '#F05050', marginTop: 14, fontWeight: 600 }}>
                필수 답변을 입력해야 다음 단계로 넘어갈 수 있어요
              </p>
            )}
          </div>
        )}

        {/* STEP 3: 관심사 & MBTI */}
        {step === 3 && (
          <div style={{ padding: '4px 20px 20px' }}>
            <div style={s.sectionCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>관심사</p>
                <button
                  onClick={() => setView('interests')}
                  style={{ fontSize: 13, color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  편집 →
                </button>
              </div>
              {interests.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {interests.map(label => {
                    const item = Object.values(INTERESTS_DATA).flat().find(i => i.label === label);
                    return (
                      <span
                        key={label}
                        style={{
                          fontSize: 13, background: PRIMARY_BG, color: PRIMARY,
                          padding: '5px 12px', borderRadius: 20, fontWeight: 600,
                        }}
                      >
                        {item?.emoji} {label}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <button onClick={() => setView('interests')} style={s.emptyBtn}>
                  관심사를 추가해보세요 →
                </button>
              )}
            </div>

            <div style={{ ...s.sectionCard, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>성격 유형 (MBTI)</p>
                <button
                  onClick={() => setView('mbti')}
                  style={{ fontSize: 13, color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  {mbtiDisplay ? '변경 →' : '선택 →'}
                </button>
              </div>
              {mbtiDisplay ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontSize: 28, fontWeight: 900, color: PRIMARY,
                    background: PRIMARY_BG, padding: '8px 20px', borderRadius: 12,
                  }}>
                    {mbtiDisplay}
                  </span>
                  <span style={{ fontSize: 13, color: '#888' }}>나의 성격 유형</span>
                </div>
              ) : (
                <button onClick={() => setView('mbti')} style={s.emptyBtn}>
                  MBTI를 선택해보세요 →
                </button>
              )}
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#BDBDBD', marginTop: 16 }}>
              이 단계는 건너뛸 수 있어요. 나중에 마이페이지에서 언제든 수정할 수 있어요.
            </p>
          </div>
        )}

        {/* STEP 4: 라이프스타일 */}
        {step === 4 && (
          <div style={{ padding: '4px 0 20px' }}>
            {Object.entries(INFO_OPTIONS).map(([key, meta]) => {
              const cur = meta.options.find(o => o.value === prefs[key]);
              return (
                <button
                  key={key}
                  onClick={() => { setActiveField(key); setView('field'); }}
                  style={s.infoRow}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{meta.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 13,
                      color:      cur ? PRIMARY : '#C0C0C0',
                      fontWeight: cur ? 700 : 400,
                      background: cur ? PRIMARY_BG : 'transparent',
                      padding:    cur ? '3px 10px' : '0',
                      borderRadius: 20,
                    }}>
                      {cur?.label || '선택 안 함'}
                    </span>
                    <span style={{ color: '#CCC', fontSize: 16 }}>›</span>
                  </div>
                </button>
              );
            })}

            <p style={{ textAlign: 'center', fontSize: 12, color: '#BDBDBD', marginTop: 20, padding: '0 20px' }}>
              이 단계는 건너뛸 수 있어요. 나중에 마이페이지에서 언제든 수정할 수 있어요.
            </p>
          </div>
        )}

      </div>
      </div> {/* 클리핑 래퍼 닫기 */}

      {/* 하단 네비게이션 */}
      <div style={{ padding: '14px 20px 36px', background: '#fff', borderTop: '1px solid #F0F0F0' }}>

        {(step === 3 || step === 4) && (
          <button
            onClick={handleNext}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: '#AAAAAA', textDecoration: 'underline',
              marginBottom: 10, padding: '4px 0' }}
          >
            건너뛰기
          </button>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          {step > 1 && (
            <button
              onClick={handleBack}
              style={{
                width: 52, height: 52, borderRadius: 14,
                border: `1.5px solid ${PRIMARY}`,
                background: '#fff', cursor: 'pointer',
                fontSize: 18, color: PRIMARY,
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ←
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            style={{
              flex: 1, height: 52, borderRadius: 14,
              border: 'none', cursor: canProceed() ? 'pointer' : 'not-allowed',
              background: canProceed() ? PRIMARY : '#E5E7EB',
              color: canProceed() ? '#fff' : '#AAAAAA',
              fontSize: 16, fontWeight: 700,
              opacity: saving ? 0.7 : 1,
              transition: 'background 0.25s, color 0.25s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {step === 4 ? (
              saving ? '저장 중...' : <><Sparkles size={18} color="#fff" /> 시작하기</>
            ) : (
              `다음 (${step}/${STEPS.length})`
            )}
          </button>
        </div>
      </div>

      {/* ── 질문 선택 바텀시트 ── */}
      {qPickerOpen && (
        <>
          {/* 딤 배경 */}
          <div
            onClick={closeQPicker}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 200,
              opacity: qPickerVisible ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          />
          {/* 시트 */}
          <div style={{
            position: 'fixed', bottom: 0,
            left: '50%',
            transform: `translateX(-50%) translateY(${qPickerVisible ? '0%' : '100%'})`,
            width: '100%', maxWidth: 430,
            background: '#fff',
            borderRadius: '20px 20px 0 0',
            zIndex: 201,
            maxHeight: '72vh',
            overflowY: 'auto',
            transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
          }}>
            {/* 핸들 */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E0E0E0' }} />
            </div>
            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 16px' }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: 0 }}>질문 선택</p>
              <button onClick={closeQPicker} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} color="#888" />
              </button>
            </div>
            {/* 카테고리별 질문 */}
            {QUESTION_CATEGORIES.map(cat => {
              const used = bioAnswers.map(b => b.question);
              const available = cat.questions.filter(q => !used.includes(q));
              if (available.length === 0) return null;
              return (
                <div key={cat.category} style={{ marginBottom: 16 }}>
                  <p style={{
                    fontSize: 11, fontWeight: 700, color: '#aaa',
                    letterSpacing: 1, padding: '0 20px 8px',
                    textTransform: 'uppercase',
                  }}>
                    {cat.category}
                  </p>
                  {available.map(q => (
                    <button
                      key={q}
                      onClick={() => {
                        closeQPicker();
                        const newBio = [...bioAnswers, { question: q, answer: '', required: false }];
                        setBioAnswers(newBio);
                        const newIdx = newBio.length - 1;
                        setTimeout(() => openAnswerView(newIdx), 320);
                      }}
                      style={{
                        width: '100%', background: 'none', border: 'none',
                        cursor: 'pointer', padding: '15px 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px solid #F4F6FA', textAlign: 'left',
                        boxSizing: 'border-box',
                      }}
                    >
                      <span style={{ fontSize: 15, color: '#111', fontWeight: 500, fontFamily: 'inherit' }}>{q}</span>
                      <span style={{ fontSize: 18, color: '#CCC' }}>›</span>
                    </button>
                  ))}
                </div>
              );
            })}
            <div style={{ height: 40 }} />
          </div>
        </>
      )}

    </div>
  );
}

// ── 서브 컴포넌트 ──
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
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#333', padding: 4, display: 'flex', alignItems: 'center', ...style }}>
      {children}
    </button>
  );
}

const s = {
  screen: {
    width: '100%', maxWidth: 430, margin: '0 auto',
    minHeight: '100dvh', background: '#fff',
    display: 'flex', flexDirection: 'column',
  },
  primaryBadge: {
    position: 'absolute', bottom: 7, left: 7,
    background: PRIMARY, color: '#fff',
    fontSize: 10, padding: '3px 8px', borderRadius: 8, fontWeight: 700,
  },
  deleteBtn: {
    position: 'absolute', top: 5, right: 5,
    width: 24, height: 24, borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)', color: '#fff',
    border: 'none', cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  addPhotoBtn: {
    aspectRatio: '1', borderRadius: 14,
    border: '2px dashed #DDDDDD', background: '#FAFAFA',
    cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  },
  bioCard: {
    width: '100%', background: '#F8F9FB', borderRadius: 14,
    padding: '16px', border: '1.5px solid #EFEFEF', cursor: 'pointer',
    marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 10,
    boxSizing: 'border-box',
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
    display: 'flex', alignItems: 'center', marginTop: 10,
    boxSizing: 'border-box',
  },
  sectionCard: {
    background: '#F8F9FB', borderRadius: 16,
    border: '1.5px solid #EFEFEF', padding: '16px 16px 14px',
  },
  emptyBtn: {
    width: '100%', padding: '13px',
    background: '#F0F0F0', border: 'none',
    borderRadius: 12, cursor: 'pointer', fontSize: 14, color: '#999',
    textAlign: 'center',
  },
  infoRow: {
    width: '100%', background: 'none', border: 'none',
    cursor: 'pointer', padding: '16px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid #F4F4F4', boxSizing: 'border-box',
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
  optionRow: {
    width: '100%', background: 'none', border: 'none',
    cursor: 'pointer', padding: '16px 0', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid #F4F4F4', boxSizing: 'border-box',
  },
};
