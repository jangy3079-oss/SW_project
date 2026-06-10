import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'dongajul_gems';

export const GEM_COSTS = {
  FREETIME_PREMIUM : 2,   // 화/수 외 요일 공강매칭 접근
  REROLL           : 1,   // 무료 리롤 소진 후 추가 리롤
  RANK_MATCH       : 3,   // 랭크 매칭 입장
};

const GemsContext = createContext(null);

export function GemsProvider({ children }) {
  const [gems, setGems] = useState(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    return v !== null ? parseInt(v, 10) : 0;
  });

  const addGems = useCallback((n) => {
    setGems(prev => {
      const next = prev + n;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const spendGems = useCallback((n) => {
    setGems(prev => {
      const next = prev - n;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const canAfford = useCallback((n) => gems >= n, [gems]);

  const resetGems = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '0');
    setGems(0);
  }, []);

  return (
    <GemsContext.Provider value={{ gems, addGems, spendGems, canAfford, resetGems }}>
      {children}
    </GemsContext.Provider>
  );
}

export function useGems() {
  return useContext(GemsContext);
}
