# [백엔드 요청] 마이페이지 연동을 위한 API 확인 요청

안녕하세요! 마이페이지 프론트엔드 구현 완료했는데, 아래 두 가지 확인 부탁드려요.

---

## 1. `upload-photo-bio` 브랜치 병합 충돌 해결 필요

머지 과정에서 아래 파일에 충돌이 발생했어요.  
현재 브랜치(`feature/timetable`) 기준으로 `--ours`로 임시 수락했는데,  
`upload-photo-bio` 브랜치의 변경 사항과 합쳐야 할 부분이 있으면 직접 정리해 주세요!

- `src/main/java/com/donga/dating/domain/user/controller/UserController.java`
- `src/main/java/com/donga/dating/domain/user/service/UserService.java`

> 특히 `UserController`에 `upload-photo-bio` 브랜치에 있는  
> `POST /api/users/{id}/profile`, `PATCH /api/users/{id}/bio`,  
> `GET/PUT /api/users/{id}/preferences` 엔드포인트가 포함되어 있어야 해요.

---

## 2. Preferences API 필드 확인 요청

마이페이지에서 토글 설정을 저장할 때 아래 구조로 `PUT /api/users/{userId}/preferences`를 호출해요.

```json
{
  "sameDepExclude":    true,
  "sameSchoolExclude": false,
  "pushEnabled":       true
}
```

`preferences.json` 템플릿이나 `PreferenceDtos.java`에 이 세 필드가 있는지 확인해 주세요.  
필드명이 다르면 알려주시면 프론트에서 맞출게요!

---

## 3. 사진 API URL 확인

사진 업로드 후 프론트에서 `/uploads/profiles/{fileName}` 경로로 이미지를 불러와요.  
`WebConfig` 또는 `WebMvcConfigurer`에서 `/uploads/profiles/**` 정적 파일 서빙이 설정되어 있는지 확인 부탁드려요.

---

감사합니다! 🙏
