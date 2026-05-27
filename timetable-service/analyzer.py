"""
에브리타임 시간표 이미지 분석 모듈 (웹 형식 · 라이트/다크 모드 지원)
────────────────────────────────────────────────────────────
대상 이미지: 에브리타임 웹/앱에서 캡처한 시간표 화면
  - 배경: 흰색(라이트) 또는 검정(다크)
  - 헤더: 요일명(월~금) + 하단 회색 수평 구분선
  - 좌측: 시간 레이블 (09:00, 09:30, ...)
  - 수업 블록: 채도(Saturation) 높은 컬러 사각형

알고리즘:
  0. 평균 밝기 < 128 이면 다크모드 → 이미지 반전 (구분선 위치는 동일)
  1. 동적 임계값 = 이미지 99th percentile 밝기 − 15
  2. 너비 70% 이상이 임계값보다 어두운 첫 번째 수평선 → grid_top
  3. 채도(S<30) & 명도 < 임계값 인 수직 구분선 클러스터링 → grid_left / grid_right
  4. 수평 구분선 간격 중앙값(= 60분) / 2 → slot_h, grid_bottom = grid_top + 18 × slot_h
  5. 그리드를 5열(월~금) × 18행(30분 단위) 분할
  6. HSV 채도 기반으로 수업 블록 셀 판별 (라이트/다크 모두 채도 유지)
  7. 빈 셀 연속 구간 → 공강시간 슬롯 반환
"""
import cv2
import numpy as np
from typing import List, Dict, Tuple

# ── 상수 ─────────────────────────────────────────────────────
DAYS         = ["MON", "TUE", "WED", "THU", "FRI"]
TIME_START   = 9      # 09:00
TIME_END     = 18     # 18:00
SLOT_MINUTES = 30     # 30분 단위
TOTAL_SLOTS  = (TIME_END - TIME_START) * 60 // SLOT_MINUTES   # 18슬롯


# ── 메인 분석 함수 ────────────────────────────────────────────

def analyze(image_bytes: bytes) -> Dict[str, List[Dict[str, str]]]:
    """
    에브리타임 시간표 이미지 → 요일별 공강시간 딕셔너리 반환

    반환 예시:
    {
        "MON": [{"startTime": "09:00", "endTime": "12:00"}],
        "TUE": [{"startTime": "09:00", "endTime": "13:30"}, ...],
        ...
    }
    """
    img = _load_image(image_bytes)
    img_proc = _normalize(img)   # 그리드 경계 탐지용 (다크모드이면 반전)
    grid_left, grid_top, grid_right, grid_bottom = _find_grid_bounds(img_proc)

    col_w  = (grid_right - grid_left) / len(DAYS)
    slot_h = (grid_bottom - grid_top) / TOTAL_SLOTS

    result = {}
    for col_idx, day in enumerate(DAYS):
        x1 = grid_left + int(col_idx * col_w)
        x2 = grid_left + int((col_idx + 1) * col_w)

        occupied_flags = []
        for slot in range(TOTAL_SLOTS):
            y1 = grid_top + int(slot * slot_h)
            y2 = grid_top + int((slot + 1) * slot_h)
            cell = img[y1 + 2: y2 - 2, x1 + 3: x2 - 3]
            occupied_flags.append(_is_occupied(cell))

        result[day] = _to_free_slots(occupied_flags)

    return result


# ── 전처리 ───────────────────────────────────────────────────

def _normalize(img: np.ndarray) -> np.ndarray:
    """다크모드 이미지(평균 밝기 < 128)는 반전하여 라이트모드와 동일하게 처리."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    if gray.mean() < 128:
        return cv2.bitwise_not(img)
    return img


def _dark_threshold(gray: np.ndarray) -> float:
    """이미지 최대 밝기(99th percentile) 기준 동적 임계값 반환."""
    return float(np.percentile(gray, 99)) - 15.0


# ── 그리드 경계 탐지 ──────────────────────────────────────────

def _find_grid_bounds(img: np.ndarray) -> Tuple[int, int, int, int]:
    h, w  = img.shape[:2]
    gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    dthr  = _dark_threshold(gray)

    grid_top              = _find_grid_top(img, h, w, dthr)
    grid_left, grid_right = _find_col_bounds(img, grid_top, h, w, dthr)
    slot_h                = _find_slot_height(img, grid_top, h, dthr)
    grid_bottom           = grid_top + int(slot_h * TOTAL_SLOTS)

    return grid_left, grid_top, grid_right, grid_bottom


def _find_grid_top(img: np.ndarray, h: int, w: int, dthr: float) -> int:
    """
    요일 헤더 아래 수평 구분선 y좌표 탐지.

    전략:
      - 이미지 상위 15% 구간을 행 단위로 스캔
      - 최상단 2% 건너뜀 (이미지 외곽 테두리 노이즈 제거)
      - 전체 너비의 70% 이상 픽셀이 dthr 미만인 행 → 수평 구분선
      - 첫 번째로 발견되는 구분선이 헤더 하단 경계

    수업 블록은 너비 약 1/5 → dark_ratio ≈ 20% 로 미검출.
    """
    gray     = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    skip_y   = int(h * 0.02)    # 최상단 2% 건너뜀
    search_h = int(h * 0.15)    # 상위 15% 내에서 탐색

    for y in range(skip_y, search_h):
        if np.mean(gray[y, :] < dthr) > 0.70:
            return y + 2   # 구분선 바로 아래

    return int(h * 0.06)   # fallback


def _find_col_bounds(img: np.ndarray, grid_top: int, h: int, w: int, dthr: float) -> Tuple[int, int]:
    """
    그리드 좌우 경계 탐지.

    grid_left:
      수업 블록(채도 S>60)의 xs.min() — 시간 레이블 열에는 채도 높은 픽셀 없음.

    grid_right:
      수직 구분선(채도 S<30 AND 명도 V < dthr)이 grid_top 이하 전체 열에 걸쳐
      8% 이상 분포한 열을 구분선으로 탐지 → 클러스터링 → 등간격 col_w 계산
      → 마지막 구분선 + col_w = grid_right.
      수업 블록(채도 높음)은 S<30 조건에서 자동 제외.
    """
    hsv     = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    colored = (hsv[:, :, 1] > 60).astype(np.uint8)
    kernel  = np.ones((5, 5), np.uint8)
    colored = cv2.morphologyEx(colored, cv2.MORPH_CLOSE, kernel)
    _, xs   = np.where(colored > 0)

    if len(xs) >= 2:
        grid_left = max(0, int(xs.min()) - 3)
    else:
        grid_left = int(w * 0.10)

    # 수직 구분선 탐지: 채도 낮고(S<30) 명도가 dthr 미만인 픽셀 비율 > 8%
    sep_x = []
    for x in range(grid_left, w):
        col_hsv = hsv[grid_top:, x, :]
        if float(np.mean((col_hsv[:, 1] < 30) & (col_hsv[:, 2] < dthr))) > 0.08:
            sep_x.append(x)

    grid_right = w - 2   # fallback

    if len(sep_x) >= 2:
        # 연속 열 → 클러스터 중심으로 묶기
        clusters = []
        cur = [sep_x[0]]
        for x in sep_x[1:]:
            if x - cur[-1] <= 3:
                cur.append(x)
            else:
                clusters.append(int(np.mean(cur)))
                cur = [x]
        clusters.append(int(np.mean(cur)))

        if len(clusters) >= 2:
            gaps    = [clusters[i + 1] - clusters[i] for i in range(len(clusters) - 1)]
            col_w   = int(np.median(gaps))
            grid_right = min(w - 1, clusters[-1] + col_w)

    return grid_left, grid_right


def _find_slot_height(img: np.ndarray, grid_top: int, h: int, dthr: float) -> float:
    """
    수평 구분선 간격으로 슬롯 높이(30분 단위) 계산.

    에브리타임 웹/앱은 1시간마다 굵은 수평 구분선을 그림.
    → 탐지된 구분선 간격 중앙값 = 60분 분량 픽셀 수
    → slot_h = 중앙값 / 2   (30분 단위)

    18:00 하단 경계가 이미지 바깥에 잘리는 경우에도 정확히 동작.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 너비 70% 이상이 dthr 미만인 행 수집
    sep_rows = [
        y for y in range(grid_top, h - 5)
        if np.mean(gray[y, :] < dthr) > 0.70
    ]

    if not sep_rows:
        return (h * 0.95 - grid_top) / TOTAL_SLOTS   # fallback

    # 연속 행 → 클러스터 중심
    clusters: list[int] = []
    cur = [sep_rows[0]]
    for y in sep_rows[1:]:
        if y - cur[-1] <= 3:
            cur.append(y)
        else:
            clusters.append(int(np.mean(cur)))
            cur = [y]
    clusters.append(int(np.mean(cur)))

    if len(clusters) < 2:
        return (h * 0.95 - grid_top) / TOTAL_SLOTS   # fallback

    gaps = [clusters[i + 1] - clusters[i] for i in range(len(clusters) - 1)]
    # 수업 블록 테두리(너무 좁음) · 이상치(너무 넓음) 제거
    valid = [g for g in gaps if 50 < g < 300]

    if not valid:
        return (h * 0.95 - grid_top) / TOTAL_SLOTS   # fallback

    # 중앙값 간격 = 60분 → ÷ 2 = 30분 슬롯 높이
    return float(np.median(valid)) / 2.0


# ── 셀 점유 판별 ──────────────────────────────────────────────

def _is_occupied(cell: np.ndarray) -> bool:
    """
    셀 이미지에 수업 블록 색상이 있는지 판별.
    HSV 채도(S) > 50 AND 명도(V) > 80 인 픽셀 비율 > 30% → 점유
    """
    if cell is None or cell.size == 0:
        return False
    if cell.shape[0] < 2 or cell.shape[1] < 2:
        return False

    hsv     = cv2.cvtColor(cell, cv2.COLOR_BGR2HSV)
    colored = (hsv[:, :, 1] > 50) & (hsv[:, :, 2] > 80)
    return float(np.mean(colored)) > 0.30


# ── 슬롯 변환 ─────────────────────────────────────────────────

def _to_free_slots(occupied: List[bool]) -> List[Dict[str, str]]:
    """
    점유 여부 플래그 배열 → 공강시간 슬롯 목록 변환

    예) [F,F,F, T,T, F,F, ...] →
        [{"startTime":"09:00","endTime":"10:30"},
         {"startTime":"11:30","endTime":"13:00"}, ...]
    """
    free_slots = []
    in_free    = False
    start_idx  = 0

    for i, is_occ in enumerate(occupied):
        if not is_occ and not in_free:
            in_free   = True
            start_idx = i
        elif is_occ and in_free:
            in_free = False
            free_slots.append(_idx_to_slot(start_idx, i))

    if in_free:
        free_slots.append(_idx_to_slot(start_idx, len(occupied)))

    return free_slots


def _idx_to_slot(start: int, end: int) -> Dict[str, str]:
    """슬롯 인덱스 → {"startTime": "HH:MM", "endTime": "HH:MM"} 변환"""
    def fmt(idx: int) -> str:
        total_min = TIME_START * 60 + idx * SLOT_MINUTES
        return f"{total_min // 60:02d}:{total_min % 60:02d}"
    return {"startTime": fmt(start), "endTime": fmt(end)}


def _load_image(image_bytes: bytes) -> np.ndarray:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("이미지를 디코드할 수 없습니다. 지원 형식: jpg, png, webp")
    return img
