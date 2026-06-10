"""
에브리타임 시간표 분석 FastAPI 서버
────────────────────────────────────────
실행 방법:
    uvicorn main:app --reload --port 8000

API:
    POST /analyze
      - multipart/form-data: file (이미지)
      - 응답: 요일별 공강시간 JSON
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import analyzer

app = FastAPI(
    title="에브리타임 시간표 분석 서비스",
    description="시간표 이미지를 받아 공강시간을 추출하는 API",
    version="1.0.0",
)


@app.post("/analyze")
async def analyze_timetable(file: UploadFile = File(...)):
    """
    에브리타임 시간표 이미지 업로드 → 공강시간 분석

    - 지원 형식: jpg, jpeg, png, webp
    - 응답 예시:
      {
        "MON": [{"startTime": "09:00", "endTime": "12:00"}],
        "TUE": [{"startTime": "09:00", "endTime": "13:30"}],
        ...
      }
    """
    # 파일 형식 검증
    allowed = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식입니다: {file.content_type}"
        )

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="빈 파일입니다.")

    try:
        result = analyzer.analyze(image_bytes)
        return JSONResponse(content=result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"분석 중 오류 발생: {str(e)}")


@app.get("/health")
def health_check():
    return {"status": "ok"}
