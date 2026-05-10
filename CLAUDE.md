# 동아대 데이팅 앱 프로젝트 지침

## 프로젝트 개요
동아대학교 학생 대상 데이팅 앱. Spring Boot 3.3 + MySQL + React (프론트 미구현).
패키지: com.donga.dating
GitHub: https://github.com/jangy3079-oss/SW_project

## 담당 분리
- 로그인/회원가입 (이메일 인증, JWT): 별도 팀원 담당 → SecurityConfig 임의 수정 금지
- 사진 등록 / 매칭 / 평가: 내 담당

## 코드 컨벤션
- 도메인별 패키지: entity / repository / service / controller
- Service 기본: @Transactional(readOnly = true), 쓰기 메서드만 @Transactional
- 에러: CustomException(ErrorCode) 사용, 새 에러는 ErrorCode enum에 추가
- 응답: ResponseEntity<ApiResponse<T>> 통일
- schema.sql로 DB 직접 관리 (ddl-auto: validate), Hibernate 자동 DDL 금지

## ⚠️ 타입 규칙 (자주 틀리는 부분)

### boolean 필드 규칙
- `is`로 시작하는 필드는 반드시 래퍼 타입 `Boolean` 사용
- `boolean isPrimary` (X) → `Boolean isPrimary` (O)
- 이유: Lombok이 `boolean isPrimary`에 대해 `isIsPrimary()` getter 생성 → Spring Data JPA 쿼리 매핑 실패

---

## Entity 필드 타입 정의

### User (users 테이블)
```
Long          userId          // PK, AUTO_INCREMENT
String        email           // UNIQUE, length=100
String        password        // BCrypt 해시, VARCHAR(255)
String        name            // length=30
User.Gender   gender          // ENUM: MALE | FEMALE
LocalDate     birthDate       // DATE
String        studentId       // UNIQUE, length=20
String        department      // length=50
Byte          grade           // TINYINT, 1~4 (래퍼 타입 Byte)
String        bio             // TEXT, nullable
BigDecimal    rankScore       // DECIMAL(3,2), default=0.00
User.RankTier rankTier        // ENUM: BRONZE|SILVER|GOLD|PLATINUM|DIAMOND, default=BRONZE
int           evalCount       // 기본형 int, default=0
boolean       emailVerified   // 기본형 boolean (is 접두사 없으므로 OK), default=false
Boolean       isActive        // 래퍼 Boolean (is 접두사 → 래퍼 필수), default=true
LocalDateTime createdAt       // @CreationTimestamp
LocalDateTime updatedAt       // @UpdateTimestamp
```

**RankTier ordinal 순서**: BRONZE=0, SILVER=1, GOLD=2, PLATINUM=3, DIAMOND=4

---

### UserPhoto (user_photos 테이블)
```
Long          photoId         // PK, AUTO_INCREMENT
User          user            // @ManyToOne LAZY, FK=user_id
String        fileName        // UUID 기반 저장 파일명
String        filePath        // 서버 절대 경로, length=500
String        originalName    // 원본 파일명
Long          fileSize        // bytes (래퍼 타입 Long)
Boolean       isPrimary       // 래퍼 Boolean (is 접두사 → 래퍼 필수), default=false
byte          photoOrder      // 기본형 byte (is 접두사 없으므로 OK), default=0
LocalDateTime createdAt       // @CreationTimestamp
```

---

### Match (matches 테이블)
```
Long              matchId         // PK, AUTO_INCREMENT
User              maleUser        // @ManyToOne LAZY, FK=male_user_id
User              femaleUser      // @ManyToOne LAZY, FK=female_user_id
Match.MatchType   matchType       // ENUM: GENERAL | RANK
Match.MatchStatus status          // ENUM: ACTIVE|EVALUATED|EXPIRED, default=ACTIVE
LocalDateTime     matchedAt       // @CreationTimestamp
LocalDateTime     expiresAt       // 매칭 평가 마감 (nullable=false, 직접 세팅)
LocalDateTime     updatedAt       // @UpdateTimestamp
```

---

### MatchQueue (match_queue 테이블)
```
Long                  queueId     // PK, AUTO_INCREMENT
User                  user        // @ManyToOne LAZY, FK=user_id
Match.MatchType       matchType   // ENUM: GENERAL | RANK  (Match 내부 enum 참조)
MatchQueue.QueueStatus status     // ENUM: WAITING|MATCHED|CANCELLED, default=WAITING
LocalDateTime         enteredAt   // @CreationTimestamp
LocalDateTime         updatedAt   // @UpdateTimestamp
```

---

### Evaluation (evaluations 테이블)
```
Long          evaluationId    // PK, AUTO_INCREMENT
Match         match           // @ManyToOne LAZY, FK=match_id
User          evaluator       // @ManyToOne LAZY, FK=evaluator_id (평가자)
User          evaluated       // @ManyToOne LAZY, FK=evaluated_id (피평가자)
Byte          score           // TINYINT, 1~5 (래퍼 타입 Byte)
LocalDateTime createdAt       // @CreationTimestamp
```

---

## Enum 전체 목록
```
User.Gender          : MALE, FEMALE
User.RankTier        : BRONZE, SILVER, GOLD, PLATINUM, DIAMOND
Match.MatchType      : GENERAL, RANK
Match.MatchStatus    : ACTIVE, EVALUATED, EXPIRED
MatchQueue.QueueStatus: WAITING, MATCHED, CANCELLED
```

## 미구현 영역 (TODO)
- Controller DTO 클래스 작성 (요청/응답)
- Controller에 Service 로직 실제 연결 (현재 껍데기)
- JWT 인증 연동 (로그인 담당자 완성 후)
- React 프론트엔드
