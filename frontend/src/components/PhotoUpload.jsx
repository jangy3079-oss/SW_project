import React, { useState } from 'react'

export default function PhotoUpload({ userId }){
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
    }catch(e){
      setMessage(e.message)
    }
  }

  return (
    <section>
      <h3>사진 업로드</h3>
      <input type="file" accept="image/*" onChange={handleChange} />
      <button onClick={handleUpload}>업로드</button>
      {message && <div className="msg">{message}</div>}
    </section>
  )
}
