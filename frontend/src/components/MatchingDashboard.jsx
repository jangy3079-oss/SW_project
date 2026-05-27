import React, { useEffect, useState } from 'react'

function unwrapApiResponse(payload) {
  if (!payload) return null
  if (payload.success === false) {
    throw new Error(payload.error?.message || 'API error')
  }

  return payload.data ?? payload
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function MatchingDashboard({ userId }) {
  const [activeMatches, setActiveMatches] = useState([])
  const [historyMatches, setHistoryMatches] = useState([])
  const [queueMessage, setQueueMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)

  async function loadMatches() {
    setLoading(true)

    try {
      const [activeResponse, historyResponse] = await Promise.all([
        fetch(`/api/matching/active?userId=${userId}`).then((response) => response.json()),
        fetch(`/api/matching/history?userId=${userId}`).then((response) => response.json())
      ])

      setActiveMatches(unwrapApiResponse(activeResponse) || [])
      setHistoryMatches(unwrapApiResponse(historyResponse) || [])
    } catch (error) {
      setQueueMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMatches()
  }, [userId])

  async function enterQueue(matchType) {
    setBusy(matchType)
    setQueueMessage('')

    try {
      const response = await fetch(`/api/matching/${matchType}/enter?userId=${userId}`, {
        method: 'POST'
      })
      const json = await response.json()
      const result = unwrapApiResponse(json)

      if (result?.matched) {
        setQueueMessage(`${result.partnerName} 님과 ${result.matchType} 매칭이 완료됐습니다.`)
      } else {
        setQueueMessage(`${result?.matchType || matchType.toUpperCase()} 대기열에 등록됐습니다.`)
      }

      await loadMatches()
    } catch (error) {
      setQueueMessage(error.message)
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return <div>매칭 화면 불러오는 중...</div>
  }

  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="section-label">세 번째 세션</p>
          <h2>매칭 시작</h2>
        </div>
        <span className="status-badge muted">ACTIVE {activeMatches.length}</span>
      </div>

      <p className="profile-bio">프로필과 취향을 채웠으면 이제 일반 매칭 또는 랭크 매칭으로 넘어갈 수 있습니다.</p>

      <div className="matching-actions">
        <button type="button" className="primary-button" onClick={() => enterQueue('general')} disabled={busy !== null}>
          {busy === 'general' ? '진행 중...' : '일반 매칭 시작'}
        </button>
        <button type="button" className="secondary-button" onClick={() => enterQueue('rank')} disabled={busy !== null}>
          {busy === 'rank' ? '진행 중...' : '랭크 매칭 시작'}
        </button>
      </div>

      {queueMessage && <div className="msg">{queueMessage}</div>}

      <div className="matching-grid">
        <article className="matching-card">
          <div className="preference-card-header">
            <h3>현재 활성 매칭</h3>
            <span>{activeMatches.length}건</span>
          </div>

          {activeMatches.length === 0 ? (
            <p className="empty-state">활성 매칭이 아직 없습니다.</p>
          ) : (
            <ul className="match-list">
              {activeMatches.map((match) => (
                <li key={match.matchId}>
                  <strong>{match.partnerName}</strong>
                  <span>{match.matchType} · {match.status}</span>
                  <small>만료 {formatDateTime(match.expiresAt)}</small>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="matching-card">
          <div className="preference-card-header">
            <h3>최근 매칭 이력</h3>
            <span>{historyMatches.length}건</span>
          </div>

          {historyMatches.length === 0 ? (
            <p className="empty-state">아직 이력이 없습니다.</p>
          ) : (
            <ul className="match-list">
              {historyMatches.slice(0, 5).map((match) => (
                <li key={match.matchId}>
                  <strong>{match.partnerName}</strong>
                  <span>{match.matchType} · {match.status}</span>
                  <small>매칭 {formatDateTime(match.matchedAt)}</small>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  )
}