import { useState, useEffect, useRef } from 'react';

/**
 * JWT Authorization 헤더를 붙여서 /uploads/* 이미지를 fetch한 뒤
 * blob URL로 렌더링하는 컴포넌트.
 *
 * <img src="/uploads/xxx.jpg"> 대신 사용:
 * <AuthImage src="/uploads/xxx.jpg" alt="..." style={...} />
 */

// 세션 내 메모리 캐시 (같은 URL은 한 번만 fetch)
const cache = new Map(); // url → blobUrl

export default function AuthImage({ src, alt = '', style, className, onError }) {
  const [blobUrl, setBlobUrl] = useState(() => cache.get(src) ?? null);
  const [failed, setFailed] = useState(false);
  const prevSrc = useRef(src);

  useEffect(() => {
    if (!src) return;

    // src가 바뀌면 상태 초기화
    if (prevSrc.current !== src) {
      prevSrc.current = src;
      const cached = cache.get(src);
      if (cached) { setBlobUrl(cached); setFailed(false); return; }
      setBlobUrl(null);
      setFailed(false);
    }

    if (cache.has(src)) {
      setBlobUrl(cache.get(src));
      return;
    }

    const token = localStorage.getItem('accessToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(src, { headers })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        cache.set(src, url);
        setBlobUrl(url);
      })
      .catch(() => {
        setFailed(true);
        onError?.();
      });
  }, [src]);

  if (!src || failed) return null;
  if (!blobUrl) return null; // 로딩 중 — 부모가 fallback 처리

  return <img src={blobUrl} alt={alt} style={style} className={className} />;
}
