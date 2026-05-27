import React, { useEffect, useState } from 'react'
import ProfileWithPhotos from './ProfileWithPhotos'
import PhotoUpload from './PhotoUpload'
import PreferencesForm from './PreferencesForm'

function unwrapApiResponse(payload) {
  if (!payload) return null
  if (payload.success === false) {
    throw new Error(payload.error?.message || 'API error')
  }

  return payload.data ?? payload
}

export default function AccountDrawer({ userId, onClose }) {
  const [profile, setProfile] = useState(null)
  const [bio, setBio] = useState('')
  const [savingBio, setSavingBio] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      try {
        const response = await fetch(`/api/users/${userId}/profile-with-photos`).then((result) => result.json())
        const data = unwrapApiResponse(response)
        if (!cancelled) {
          setProfile(data?.profile || null)
          setBio(data?.profile?.bio || '')
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [userId])

  async function saveBio() {
    setSavingBio(true)
    setMessage('')

    try {
      const response = await fetch(`/api/users/${userId}/bio`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio })
      })
      const json = await response.json()
      const data = unwrapApiResponse(json)
      setProfile((current) => current ? { ...current, bio: data?.bio ?? bio } : current)
      setMessage('자기소개가 저장됐습니다.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSavingBio(false)
    }
  }

  return (
    <aside className="drawer">
      <div className="drawer-header">
        <div>
          <p className="section-label">내 정보</p>
          <h2>프로필 설정</h2>
        </div>
        <button type="button" className="secondary-button" onClick={onClose}>닫기</button>
      </div>

      {loading ? (
        <div className="drawer-loading">내 정보 불러오는 중...</div>
      ) : (
        <>
          <div className="drawer-summary">
            <div>
              <strong>{profile?.name || '나'}</strong>
              <p>{profile?.department || ''}{profile?.grade ? ` · ${profile.grade}학년` : ''}</p>
            </div>
            <span className="status-badge">{profile?.rankTier || 'BRONZE'}</span>
          </div>

          <div className="drawer-section">
            <div className="section-heading compact">
              <div>
                <p className="section-label">자기소개</p>
                <h3>프로필 문구</h3>
              </div>
            </div>
            <textarea
              className="bio-textarea"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="예: 하단에서 커피 마시고, 주말엔 산책하는 스타일"
              rows={5}
            />
            <div className="next-action">
              <button type="button" className="primary-button" onClick={saveBio} disabled={savingBio}>
                {savingBio ? '저장 중...' : '자기소개 저장'}
              </button>
            </div>
          </div>

          <div className="drawer-section">
            <div className="section-heading compact">
              <div>
                <p className="section-label">사진</p>
                <h3>사진 관리</h3>
              </div>
            </div>
            <ProfileWithPhotos userId={userId} />
            <PhotoUpload userId={userId} />
          </div>

          <div className="drawer-section">
            <PreferencesForm userId={userId} />
          </div>

          {message && <div className="msg">{message}</div>}
        </>
      )}
    </aside>
  )
}