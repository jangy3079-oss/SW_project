# 프론트 연동 가이드

## 📋 사진 / 자기소개 API 명세

### 1. 프로필 + 사진 통합 조회 (권장)
**프론트에서 가장 많이 사용할 API**

```http
GET /api/users/{userId}/profile-with-photos
```

**응답:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "userId": 1,
      "email": "user@donga.ac.kr",
      "name": "김동아",
      "gender": "MALE",
      "birthDate": "2000-01-01",
      "studentId": "20191234",
      "department": "컴퓨터공학과",
      "grade": 3,
      "bio": "안녕하세요. 저는 컴퓨터공학 전공입니다.",
      "rankScore": 4.50,
      "rankTier": "GOLD",
      "evalCount": 10,
      "emailVerified": true,
      "isActive": true
    },
    "photos": [
      {
        "photoId": 1,
        "userId": 1,
        "fileName": "550e8400-e29b-41d4-a716-446655440000.jpg",
        "viewUrl": "/uploads/550e8400-e29b-41d4-a716-446655440000.jpg",
        "originalName": "profile.jpg",
        "fileSize": 2097152,
        "isPrimary": true,
        "photoOrder": 0,
        "createdAt": "2026-05-20T10:30:00"
      },
      {
        "photoId": 2,
        "userId": 1,
        "fileName": "550e8400-e29b-41d4-a716-446655440001.jpg",
        "viewUrl": "/uploads/550e8400-e29b-41d4-a716-446655440001.jpg",
        "originalName": "photo2.jpg",
        "fileSize": 1572864,
        "isPrimary": false,
        "photoOrder": 1,
        "createdAt": "2026-05-20T11:15:00"
      }
    ]
  }
}
```

---

## 📸 사진 API

### 2. 사진 업로드
```http
POST /api/users/{userId}/photos
Content-Type: multipart/form-data

file=<binary data>
```

**제한사항:**
- 최대 파일 크기: 5MB
- 지원 확장자: jpg, jpeg, png, webp
- 최대 5장까지 등록 가능
- 첫 번째 사진 자동으로 대표사진 설정

**응답:**
```json
{
  "success": true,
  "data": {
    "photoId": 3,
    "userId": 1,
    "fileName": "550e8400-e29b-41d4-a716-446655440002.jpg",
    "viewUrl": "/uploads/550e8400-e29b-41d4-a716-446655440002.jpg",
    "originalName": "new_photo.jpg",
    "fileSize": 2097152,
    "isPrimary": false,
    "photoOrder": 2,
    "createdAt": "2026-05-20T12:00:00"
  }
}
```

**에러 응답:**
```json
{
  "success": false,
  "error": {
    "message": "사진은 최대 5장까지 등록할 수 있습니다."
  }
}
```

---

### 3. 사진 목록 조회
```http
GET /api/users/{userId}/photos
```

**응답 (대표사진이 먼저 반환됨):**
```json
{
  "success": true,
  "data": [
    {
      "photoId": 1,
      "userId": 1,
      "fileName": "550e8400-e29b-41d4-a716-446655440000.jpg",
      "viewUrl": "/uploads/550e8400-e29b-41d4-a716-446655440000.jpg",
      "originalName": "profile.jpg",
      "fileSize": 2097152,
      "isPrimary": true,
      "photoOrder": 0,
      "createdAt": "2026-05-20T10:30:00"
    },
    {
      "photoId": 2,
      "userId": 1,
      "fileName": "550e8400-e29b-41d4-a716-446655440001.jpg",
      "viewUrl": "/uploads/550e8400-e29b-41d4-a716-446655440001.jpg",
      "originalName": "photo2.jpg",
      "fileSize": 1572864,
      "isPrimary": false,
      "photoOrder": 1,
      "createdAt": "2026-05-20T11:15:00"
    }
  ]
}
```

---

### 4. 대표사진 변경
```http
PATCH /api/users/{userId}/photos/{photoId}/primary
```

**응답:**
```json
{
  "success": true,
  "data": null
}
```

**주의:**
- 이전 대표사진의 isPrimary는 자동으로 false로 변경
- photoOrder는 자동 정렬되지 않음 (조회시에만 대표사진이 먼저 반환)

---

### 5. 사진 삭제
```http
DELETE /api/users/{userId}/photos/{photoId}
```

**응답:**
```json
{
  "success": true,
  "data": null
}
```

**삭제 후 자동 처리:**
- 남은 사진들의 photoOrder 자동 재정렬 (0부터)
- 대표사진(isPrimary=true) 삭제 시, 남은 사진 중 첫 번째가 자동으로 대표사진 설정

---

## 📝 자기소개 API

### 6. 프로필 수정 (자기소개 포함)
```http
POST /api/users/{userId}/profile
Content-Type: application/json

{
  "name": "김동아",
  "gender": "MALE",
  "birthDate": "2000-01-01",
  "studentId": "20191234",
  "department": "컴퓨터공학과",
  "grade": 3,
  "bio": "안녕하세요. 저는 컴퓨터공학을 전공하고 있습니다."
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@donga.ac.kr",
    "name": "김동아",
    "gender": "MALE",
    "birthDate": "2000-01-01",
    "studentId": "20191234",
    "department": "컴퓨터공학과",
    "grade": 3,
    "bio": "안녕하세요. 저는 컴퓨터공학을 전공하고 있습니다.",
    "rankScore": 4.50,
    "rankTier": "GOLD",
    "evalCount": 10,
    "emailVerified": true,
    "isActive": true
  }
}
```

---

### 7. 자기소개만 수정 (빠른 수정)
```http
PATCH /api/users/{userId}/bio
Content-Type: application/json

{
  "bio": "새로운 자기소개입니다."
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@donga.ac.kr",
    "name": "김동아",
    "gender": "MALE",
    "birthDate": "2000-01-01",
    "studentId": "20191234",
    "department": "컴퓨터공학과",
    "grade": 3,
    "bio": "새로운 자기소개입니다.",
    "rankScore": 4.50,
    "rankTier": "GOLD",
    "evalCount": 10,
    "emailVerified": true,
    "isActive": true
  }
}
```

**자기소개 제한사항:**
- 길이: 1자 이상 500자 이하
- 빈 값 또는 공백만으로 입력 불가

**에러 응답:**
```json
{
  "success": false,
  "error": {
    "message": "자기소개는 500자 이하여야 합니다."
  }
}
```

---

## 👤 프로필 전체 조회
```http
GET /api/users/{userId}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@donga.ac.kr",
    "name": "김동아",
    "gender": "MALE",
    "birthDate": "2000-01-01",
    "studentId": "20191234",
    "department": "컴퓨터공학과",
    "grade": 3,
    "bio": "안녕하세요. 저는 컴퓨터공학 전공입니다.",
    "rankScore": 4.50,
    "rankTier": "GOLD",
    "evalCount": 10,
    "emailVerified": true,
    "isActive": true
  }
}
```

---

## 🔍 에러 코드

| 상황 | HTTP | 에러메시지 |
|------|------|-----------|
| 사용자 없음 | 404 | 사용자를 찾을 수 없습니다. |
| 사진 없음 | 404 | 사진을 찾을 수 없습니다. |
| 권한 없음 (다른 사용자의 사진) | 403 | 접근 권한이 없습니다. |
| 사진 5장 초과 | 400 | 사진은 최대 5장까지 등록할 수 있습니다. |
| 파일 크기 초과 (5MB) | 400 | 파일 크기는 5MB 이하여야 합니다. |
| 지원하지 않는 확장자 | 400 | 지원하지 않는 파일 형식입니다. (jpg, jpeg, png, webp) |
| 자기소개 빈 값 | 400 | 자기소개는 1자 이상 입력해야 합니다. |
| 자기소개 500자 초과 | 400 | 자기소개는 500자 이하여야 합니다. |

| 잘못된 취향 키 | 400 | 존재하지 않는 취향 카테고리입니다. |
| 잘못된 취향 값 | 400 | 허용되지 않는 취향 값입니다. |

---

## 🎯 프론트 개발 팁

### 사진 업로드 처리
```javascript
// FormData 사용
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch(`/api/users/${userId}/photos`, {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

### 프로필 + 사진 한 번에 로드
```javascript
// 초기 로드시 추천
fetch(`/api/users/${userId}/profile-with-photos`)
  .then(res => res.json())
  .then(data => {
    const { profile, photos } = data.data;
    // profile: 사용자 정보
    // photos: 사진 목록 (대표사진이 먼저)
  });
```

### 대표사진 표시
```javascript
const primaryPhoto = photos.find(p => p.isPrimary);
// 또는 photos[0] (조회시 대표사진이 우선 반환됨)
```

### 자기소개 작성 UI
- 최대 500자 제한 표시
- 실시간 글자 수 카운트
- 업로드 전 길이 검증 (프론트)
- 백엔드에서도 검증 (보안)

---

## 🧭 취향/태그 (Preferences)

### 템플릿 조회 (프론트 초기 로딩)
```http
GET /api/preferences/template
```
응답은 `static/preferences.json`의 내용을 반환합니다. 프런트는 이 템플릿을 사용해 체크박스/라디오 UI를 구성하세요.

### 취향 조회
```http
GET /api/users/{userId}/preferences
```

### 취향 업데이트
```http
PUT /api/users/{userId}/preferences
Content-Type: application/json

{
  "preferences": {
    "smoking": "no_smoke",
    "culture": ["music","movie"],
    "contact": "fast_reply"
  }
}
```

요청 검증:
- 키는 템플릿의 `categories[].id`에 존재해야 함
- `type: single` 항목은 문자열 값 하나
- `type: multi` 항목은 문자열 배열

응답: 저장된 preferences 맵


---

## 📌 주요 정책

1. **사진 정렬**
   - 조회시 대표사진(isPrimary=true)이 항상 첫 번째
   - 나머지는 photoOrder 순서대로 정렬

2. **대표사진 자동 설정**
   - 첫 번째 업로드 사진 → 자동으로 대표사진
   - 대표사진 삭제시 → 남은 사진 중 첫 번째 자동 지정

3. **photoOrder 재정렬**
   - 사진 삭제시만 자동 재정렬 (0부터 시작)
   - 수동 순서 변경 기능은 추후 추가 예정

4. **자기소개**
   - 선택사항 (필수 아님)
   - 프로필 수정시나 별도 API로 수정 가능
