import React from 'react'
import ProfileWithPhotos from './components/ProfileWithPhotos'
import PhotoUpload from './components/PhotoUpload'

export default function App(){
  const userId = 1
  return (
    <div className="container">
      <h1>동아대 데이팅 - 데모</h1>
      <ProfileWithPhotos userId={userId} />
      <hr />
      <PhotoUpload userId={userId} />
    </div>
  )
}
