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
    // 토큰 먼저 저장 (이후 API 호출에 사용됨)
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    // 기본 정보 저장
    let info = {
      userId:   data.userId,
      email:    data.email,
      name:     data.name,
      gender:   data.gender ?? null,
      rankTier: data.rankTier ?? 'BRONZE',
    };

    // 로그인 응답에 gender 없으면 프로필 API로 추가 조회
    if (!info.gender && data.userId) {
      try {
        const profile = await userApi.get(data.userId);
        info.gender   = profile.gender   ?? null;
        info.rankTier = profile.rankTier ?? info.rankTier;
      } catch {}
    }

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
