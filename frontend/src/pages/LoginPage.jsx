import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
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
    <div className="page page-no-tab" style={{ paddingTop: 60, alignSelf: 'center', width: '100%' }}>
      {/* 로고 */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>💕</div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>동아대 데이팅</h1>
        <p style={{ fontSize: 14, color: 'var(--sub)', marginTop: 4 }}>
          @donga.ac.kr 계정으로 로그인하세요
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">이메일</label>
          <input
            className="form-input"
            type="email"
            placeholder="학번@donga.ac.kr"
            value={form.email}
            onChange={set('email')}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">비밀번호</label>
          <input
            className="form-input"
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={set('password')}
            required
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div className="divider">또는</div>

      <button className="btn btn-outline" onClick={() => navigate('/register')}>
        회원가입
      </button>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--sub)', marginTop: 20 }}>
        인증 메일을 받지 못하셨나요?{' '}
        <button className="link-text" onClick={() => navigate('/verify')}>
          이메일 인증
        </button>
      </p>
    </div>
  );
}
