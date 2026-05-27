import React, { useEffect, useState } from 'react'

export default function ProfileWithPhotos({ userId }){
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    setLoading(true)
    fetch(`/api/users/${userId}/profile-with-photos`)
      .then(r=>r.json())
      .then(resp=>{
        if(!resp.success) throw new Error(resp.error?.message || 'API error')
        setData(resp.data)
      })
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false))
  },[userId])

  if(loading) return <div>로딩 중...</div>
  if(error) return <div>오류: {error}</div>
  if(!data) return null

  const { profile, photos } = data
  const primary = photos?.find(p=>p.isPrimary) || photos?.[0]

  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="section-label">프로필</p>
          <h2>{profile.name} 님의 프로필</h2>
        </div>
        <span className="status-badge">LIVE</span>
      </div>

      <p className="profile-bio">{profile.bio}</p>
      {primary && (
        <div className="primary-photo">
          <img src={primary.viewUrl} alt={primary.originalName} />
        </div>
      )}
      <div className="photo-grid">
        {photos?.map(p=> (
          <figure key={p.photoId} className={p.isPrimary ? 'photo-card primary' : 'photo-card'}>
            <img src={p.viewUrl} alt={p.originalName} />
            <figcaption>{p.originalName}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
