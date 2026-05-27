import React, { useState } from 'react'
import ProfileWithPhotos from './components/ProfileWithPhotos'
import PhotoUpload from './components/PhotoUpload'
import PreferencesForm from './components/PreferencesForm'
import TinderHome from './components/TinderHome'

export default function App(){
  const userId = 1
  const [step, setStep] = useState(1)

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1)
      return
    }

    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.alert('이전 페이지 기록이 없습니다.')
  }

  return (
    step < 3 ? (
      <div className="app-shell onboarding-shell">
        <header className="hero onboarding-hero">
          <div>
            <p className="eyebrow">Donga Dating Demo</p>
            <h1>동아대 데이팅</h1>
            <p className="hero-copy">프로필과 사진을 먼저 만들고, 취향을 저장한 뒤 메인 피드로 들어갑니다.</p>
          </div>

          <div className="hero-actions">
            {step > 1 ? (
              <button type="button" className="secondary-button" onClick={goBack}>이전 단계</button>
            ) : (
              <button type="button" className="secondary-button" onClick={goBack}>뒤로가기</button>
            )}
            <button type="button" className="secondary-button" onClick={() => window.location.reload()}>새로고침</button>
          </div>
        </header>

        <div className="container stepper" aria-label="진행 단계">
          <div className={step === 1 ? 'step active' : 'step'}>
            <span>1</span>
            <strong>프로필 / 사진</strong>
          </div>
          <div className={step === 2 ? 'step active' : 'step'}>
            <span>2</span>
            <strong>취향 설정</strong>
          </div>
          <div className="step">
            <span>3</span>
            <strong>메인 피드</strong>
          </div>
        </div>

        <main className="container layout-grid onboarding-grid">
          {step === 1 ? (
            <>
              <section className="panel panel-profile">
                <ProfileWithPhotos userId={userId} />
              </section>

              <section className="panel panel-upload">
                <PhotoUpload userId={userId} onUploaded={() => setStep(2)} />
                <div className="next-action">
                  <button type="button" className="primary-button" onClick={() => setStep(2)}>다음으로</button>
                  <p>사진 등록까지 끝나면 취향 설정으로 넘어갑니다.</p>
                </div>
              </section>
            </>
          ) : (
            <section className="panel panel-preferences panel-wide">
              <PreferencesForm userId={userId} onSaved={() => setStep(3)} />
            </section>
          )}
        </main>
      </div>
    ) : (
      <TinderHome userId={userId} onOpenSetup={() => setStep(2)} />
    )
  )
}
