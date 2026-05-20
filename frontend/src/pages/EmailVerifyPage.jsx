import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { user as userApi } from '../api/client';

export default function EmailVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [token, setToken] = useState('');
  const [resendEmail, setResendEmail] = useState(email);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await userApi.verify(token.trim());
      setSuccess('이메일 인증 완료! 로그인해주세요.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || '인증에 실패했습니다. 토큰을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!resendEmail) return;
    setError(''); setSuccess('');
    try {
      await userApi.resend(resendEmail);
      setSuccess('인증 메일을 재발송했습니다. 받은편지함을 확인해주세요.');
    } catch (err) {
      setError(err.message || '재발송에 실패했습니다.');
    }
  };

  return (
    <div className="page page-no-tab" style={{ paddingTop: 60 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>📧</div>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>이메일 인증</h2>
        <p style={{ fontSize: 14, color: 'var(--sub)', marginTop: 8, lineHeight: 1.5 }}>
          {email ? `${email}으로 인증 링크를 발송했습니다.` : '가입한 이메일로 인증 링크를 발송했습니다.'}<br />
          이메일의 링크에서 <strong>token=</strong> 뒤 값을 복사해 붙여넣으세요.
        </p>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleVerify}>
        <div className="form-group">
          <label className="form-label">인증 토큰</label>
          <input
            className="form-input"
            type="text"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={token}
            onChange={e => setToken(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? '인증 중...' : '이메일 인증'}
        </button>
      </form>

      <div className="divider">메일을 못 받으셨나요?</div>

      <div className="form-group">
        <label className="form-label">이메일 주소</label>
        <input
          className="form-input"
          type="email"
          value={resendEmail}
          onChange={e => setResendEmail(e.target.value)}
          placeholder="재발송할 이메일"
        />
      </div>
      <button className="btn btn-outline" onClick={handleResend}>
        인증 메일 재발송
      </button>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--sub)' }}>
        <button className="link-text" onClick={() => navigate('/login')}>
          로그인으로 돌아가기
        </button>
      </p>
    </div>
  );
}
