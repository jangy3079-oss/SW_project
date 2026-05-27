import React, { useState } from 'react'

export default function PhotoUpload({ userId, onUploaded }){
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')

  function handleChange(e){
    setFile(e.target.files[0])
    setMessage('')
  }

  async function handleUpload(){
    if(!file) { setMessage('파일을 선택하세요.'); return }
    const fd = new FormData()
    fd.append('file', file)

    try{
      const res = await fetch(`/api/users/${userId}/photos`, {
        method: 'POST',
        body: fd
      })
      const json = await res.json()
      if(!json.success) throw new Error(json.error?.message || '업로드 실패')
      setMessage('업로드 성공')
      if (typeof onUploaded === 'function') {
        onUploaded(json.data)
      }
    }catch(e){
      setMessage(e.message)
    }
  }

  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="section-label">업로드</p>
          <h3>사진 업로드</h3>
        </div>
      </div>

      <div className="upload-row">
        <label className="file-picker">
          <input type="file" accept="image/*" onChange={handleChange} />
          <span>파일 선택</span>
        </label>

        <button className="primary-button" onClick={handleUpload}>업로드</button>
      </div>

      {file && <div className="file-name">선택됨: {file.name}</div>}
      {message && <div className="msg">{message}</div>}
    </section>
  )
}
