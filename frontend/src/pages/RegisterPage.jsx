import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { user as userApi } from '../api/client';

const DEPARTMENTS = [
  '컴퓨터공학과', '소프트웨어학과', '전자공학과', '기계공학과',
  '경영학과', '경제학과', '사회복지학과', '법학과',
  '간호학과', '의학과', '약학과', '건축학과', '기타',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: 계정정보, 2: 학교정보
  const [form, setForm] = useState({
    email: '', password: '', passwordConfirm: '',
    name: '', studentId: '', department: '', grade: '1',
    birthDate: '', gender: 'MALE',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const nextStep = (e) => {
    e.preventDefault();
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!form.email.endsWith('@donga.ac.kr')) {
      setError('동아대학교 이메일(@donga.ac.kr)만 사용 가능합니다.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await userApi.register({
        email: form.email,
        password: form.password,
        name: form.name,
        studentId: form.studentId,
        department: form.department,
        grade: parseInt(form.grade),
        birthDate: form.birthDate,
        gender: form.gender,
      });
      navigate('/verify', { state: { email: form.email } });
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-no-tab" style={{ paddingTop: 24 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}
          onClick={() => step === 1 ? navigate('/login') : setStep(1)}
        >
          ←
        </button>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>회원가입</h2>
          <p style={{ fontSize: 13, color: 'var(--sub)' }}>{step} / 2 단계</p>
        </div>
      </div>

      {/* 진행 바 */}
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 28 }}>
        <div style={{
          height: '100%',
          width: step === 1 ? '50%' : '100%',
          background: 'var(--pink)',
          borderRadius: 2,
          transition: 'width .3s',
        }} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {step === 1 && (
        <form onSubmit={nextStep}>
          <div className="form-group">
            <label className="form-label">동아대 이메일</label>
            <input className="form-input" type="email" placeholder="학번@donga.ac.kr"
              value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input className="form-input" type="password" placeholder="비밀번호 (6자 이상)"
              value={form.password} onChange={set('password')} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호 확인</label>
            <input className="form-input" type="password" placeholder="비밀번호 재입력"
              value={form.passwordConfirm} onChange={set('passwordConfirm')} required />
          </div>
          <button className="btn btn-primary" type="submit">다음</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">이름</label>
            <input className="form-input" type="text" placeholder="실명"
              value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label className="form-label">학번</label>
            <input className="form-input" type="text" placeholder="20260001"
              value={form.studentId} onChange={set('studentId')} required />
          </div>
          <div className="form-group">
            <label className="form-label">학과</label>
            <select className="form-select" value={form.department} onChange={set('department')} required>
              <option value="">학과 선택</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">학년</label>
              <select className="form-select" value={form.grade} onChange={set('grade')}>
                {[1,2,3,4].map(g => <option key={g} value={g}>{g}학년</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">성별</label>
              <select className="form-select" value={form.gender} onChange={set('gender')}>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">생년월일</label>
            <input className="form-input" type="date" value={form.birthDate}
              onChange={set('birthDate')} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? '가입 중...' : '회원가입 완료'}
          </button>
        </form>
      )}
    </div>
  );
}
