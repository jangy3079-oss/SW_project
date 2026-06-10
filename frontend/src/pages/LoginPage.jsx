import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Link2 } from 'lucide-react';

const PRIMARY    = '#003087';
const PRIMARY_BG = '#EAF0FB';
const SUB        = '#888888';
const BORDER     = '#E8E8E8';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrap}>

      {/* 로고 영역 */}
      <div style={s.logoArea}>
        <div style={s.logoCircle}>
          <Link2 size={30} color="#fff" strokeWidth={2.5} />
        </div>
        <h1 style={s.appName}>동아줄</h1>
        <p style={s.appSub}>동아대학교 학생들의 인연 연결 서비스</p>
      </div>

      {/* 폼 카드 */}
      <div style={s.card}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* 이메일 */}
          <div style={s.inputWrap}>
            <Mail size={16} color={SUB} strokeWidth={2} style={s.inputIcon} />
            <input
              style={s.input}
              type="email"
              placeholder="학번@donga.ac.kr"
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>

          {/* 비밀번호 */}
          <div style={s.inputWrap}>
            <Lock size={16} color={SUB} strokeWidth={2} style={s.inputIcon} />
            <input
              style={s.input}
              type="password"
              placeholder="비밀번호"
              value={form.password}
              onChange={set('password')}
              required
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#B00020', textAlign: 'center', margin: 0 }}>{error}</p>
          )}

          <button style={{ ...s.submitBtn, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 구분선 */}
        <div style={s.dividerRow}>
          <div style={s.dividerLine} />
          <span style={{ fontSize: 12, color: SUB, padding: '0 12px', whiteSpace: 'nowrap' }}>또는</span>
          <div style={s.dividerLine} />
        </div>

        <button style={s.outlineBtn} onClick={() => navigate('/register')}>
          회원가입
        </button>
      </div>

      {/* 하단 링크 */}
      <p style={{ textAlign: 'center', fontSize: 13, color: SUB, marginTop: 20 }}>
        인증 메일을 받지 못하셨나요?{' '}
        <button
          style={{ background: 'none', border: 'none', color: PRIMARY, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0 }}
          onClick={() => navigate('/verify')}
        >
          이메일 인증
        </button>
      </p>

      <p style={{ textAlign: 'center', fontSize: 11, color: '#CCC', marginTop: 32 }}>
        동아대학교 재학생 전용 서비스
      </p>

    </div>
  );
}

const s = {
  wrap: {
    display: 'flex', flexDirection: 'column',
    minHeight: '100dvh', background: '#fff',
    maxWidth: 430, width: '100%', margin: '0 auto',
    padding: '60px 24px 40px',
    boxSizing: 'border-box',
  },
  logoArea: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 68, height: 68, borderRadius: 22,
    background: PRIMARY,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    boxShadow: '0 8px 24px rgba(0,48,135,0.25)',
  },
  appName: {
    fontSize: 30, fontWeight: 900, color: PRIMARY,
    letterSpacing: -1, margin: 0,
  },
  appSub: {
    fontSize: 13, color: SUB, marginTop: 6,
  },
  card: {
    background: '#fff', borderRadius: 20,
    padding: '28px 24px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    borderRadius: 12,
    padding: '0 14px', background: '#FAFAFA',
    transition: 'border-color 0.15s',
  },
  inputIcon: {
    flexShrink: 0, marginRight: 10,
  },
  input: {
    flex: 1, border: 'none', background: 'none',
    padding: '14px 0', fontSize: 15,
    outline: 'none', fontFamily: 'inherit', color: '#111',
  },
  submitBtn: {
    width: '100%', padding: '15px',
    background: PRIMARY, color: '#fff',
    border: 'none', borderRadius: 14,
    fontSize: 16, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'opacity 0.15s',
    marginTop: 4,
  },
  outlineBtn: {
    width: '100%', padding: '14px',
    background: '#fff', color: PRIMARY,
    border: `1.5px solid ${PRIMARY}`, borderRadius: 14,
    fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  dividerRow: {
    display: 'flex', alignItems: 'center',
    margin: '20px 0',
  },
  dividerLine: {
    flex: 1, height: 1, background: BORDER,
  },
};
