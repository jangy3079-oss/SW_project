import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { user as userApi, auth as authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userInfo, setUserInfo] = useState(null);   // { userId, email, name, ... }
  const [loading, setLoading] = useState(true);

  // 앱 시작 시 저장된 토큰으로 유저 정보 복원
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('userInfo');
    if (token && savedUser) {
      try { setUserInfo(JSON.parse(savedUser)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    // 이메일로 유저 정보 임시 저장 (userId는 서버 응답에서)
    const info = { email: data.email, name: data.name };
    // userId를 별도로 가져와야 하면 추후 /api/users/me 엔드포인트로 확장
    localStorage.setItem('userInfo', JSON.stringify(info));
    setUserInfo(info);
    return data;
  }, []);

  const setUserId = useCallback((userId) => {
    setUserInfo(prev => {
      const next = { ...prev, userId };
      localStorage.setItem('userInfo', JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    setUserInfo(null);
  }, []);

  const isLoggedIn = !!userInfo;

  return (
    <AuthContext.Provider value={{ userInfo, isLoggedIn, loading, login, logout, setUserId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
