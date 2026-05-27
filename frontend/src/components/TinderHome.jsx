import React, { useMemo, useRef, useState } from 'react'
import AccountDrawer from './AccountDrawer'

const demoCandidates = [
  {
    id: 1,
    name: '지윤',
    age: 23,
    major: '경영학과',
    distance: '1.2km',
    prompt: '주말엔 해운대 말고 하단 카페 투어도 좋아요.',
    vibe: '사진·카페·산책',
    tags: ['적당히 즐김', '카페', '산책']
  },
  {
    id: 2,
    name: '민수',
    age: 24,
    major: '컴공',
    distance: '0.8km',
    prompt: '시험기간엔 각자 집중, 끝나면 맛집 정복.',
    vibe: '코딩·러닝·국밥',
    tags: ['미리미리', '러닝', '국물']
  },
  {
    id: 3,
    name: '서연',
    age: 22,
    major: '심리학과',
    distance: '2.4km',
    prompt: '대화 잘 되는 사람, 장난도 잘 받아요.',
    vibe: '공감·전시·넷플릭스',
    tags: ['공감형', '영화', '주말']
  }
]

const tabOrder = ['discover', 'likes', 'messages', 'profile']

function createAvatarSeed(name) {
  return name.slice(0, 1)
}

export default function TinderHome({ userId, onOpenSetup }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deckIndex, setDeckIndex] = useState(0)
  const [flashMessage, setFlashMessage] = useState('')
  const [activeTab, setActiveTab] = useState('discover')
  const [likedCandidates, setLikedCandidates] = useState([])
  const gestureStartX = useRef(null)

  const currentCandidate = demoCandidates[deckIndex % demoCandidates.length]

  const deckProgress = useMemo(() => `${deckIndex + 1}/${demoCandidates.length}`, [deckIndex])

  function openTab(tab) {
    setActiveTab(tab)
  }

  function navigateTab(direction) {
    const currentIndex = tabOrder.indexOf(activeTab)
    const nextIndex = direction === 'next'
      ? (currentIndex + 1) % tabOrder.length
      : (currentIndex - 1 + tabOrder.length) % tabOrder.length

    setActiveTab(tabOrder[nextIndex])
  }

  function handleTouchStart(event) {
    gestureStartX.current = event.touches?.[0]?.clientX ?? null
  }

  function handleTouchEnd(event) {
    if (gestureStartX.current === null) return

    const endX = event.changedTouches?.[0]?.clientX ?? gestureStartX.current
    const deltaX = endX - gestureStartX.current
    gestureStartX.current = null

    if (Math.abs(deltaX) < 60) return

    navigateTab(deltaX < 0 ? 'next' : 'prev')
  }

  function handlePointerDown(event) {
    if (event.pointerType === 'mouse' || event.pointerType === 'touch' || event.pointerType === 'pen') {
      gestureStartX.current = event.clientX
    }
  }

  function handlePointerUp(event) {
    if (gestureStartX.current === null) return

    const deltaX = event.clientX - gestureStartX.current
    gestureStartX.current = null

    if (Math.abs(deltaX) < 60) return

    navigateTab(deltaX < 0 ? 'next' : 'prev')
  }

  function moveDeck(actionLabel) {
    setFlashMessage(`${currentCandidate.name} 님에게 ${actionLabel} 반응을 보냈습니다.`)
    if (actionLabel !== '패스') {
      // 서버에 좋아요 저장 시도
      (async () => {
        try {
          const res = await fetch(`/api/matching/like?fromUserId=${userId}&toUserId=${currentCandidate.id}`, {
            method: 'POST'
          })
          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            setFlashMessage(body?.message || '좋아요 저장에 실패했습니다.')
          } else {
            setLikedCandidates((current) => {
              if (current.some((candidate) => candidate.id === currentCandidate.id)) {
                return current
              }
              return [currentCandidate, ...current]
            })
          }
        } catch (e) {
          setFlashMessage('네트워크 오류로 좋아요 저장에 실패했습니다.')
        }
      })()
    }
    setDeckIndex((current) => (current + 1) % demoCandidates.length)
  }

  function renderDiscoverTab() {
    return (
      <>
        <div className="feed-meta">
          <span className="status-badge muted">오늘의 추천</span>
          <span className="feed-progress">{deckProgress}</span>
        </div>

        <div className="profile-card-stack">
          <article className="tinder-card">
            <div className="card-photo" aria-hidden="true">
              <span>{createAvatarSeed(currentCandidate.name)}</span>
              <div className="card-photo-glow"></div>
            </div>

            <div className="card-content">
              <div className="card-title-row">
                <div>
                  <h2>{currentCandidate.name}, {currentCandidate.age}</h2>
                  <p>{currentCandidate.major} · {currentCandidate.distance}</p>
                </div>
                <span className="card-chip">{currentCandidate.vibe}</span>
              </div>

              <p className="card-prompt">{currentCandidate.prompt}</p>

              <div className="tag-row">
                {currentCandidate.tags.map((tag) => (
                  <span key={tag} className="interest-tag">{tag}</span>
                ))}
              </div>
            </div>
          </article>
        </div>

        <div className="action-rail">
          <button type="button" className="action-button nope" onClick={() => moveDeck('패스')}>✕</button>
          <button type="button" className="action-button superlike" onClick={() => moveDeck('슈퍼라이크')}>★</button>
          <button type="button" className="action-button like" onClick={() => moveDeck('좋아요')}>♥</button>
        </div>

        {flashMessage && <div className="flash-message">{flashMessage}</div>}
      </>
    )
  }

  function renderLikesTab() {
    return (
      <section className="tab-screen">
        <div className="feed-meta">
          <span className="status-badge muted">내가 보낸 좋아요</span>
          <span className="feed-progress">{likedCandidates.length}명</span>
        </div>

        {likedCandidates.length === 0 ? (
          <div className="empty-feed">
            <h3>아직 저장된 좋아요가 없습니다.</h3>
            <p>탐색 탭에서 ♥ 버튼을 누르면 여기에 쌓입니다.</p>
            <button type="button" className="primary-button wide" onClick={() => openTab('discover')}>탐색으로 돌아가기</button>
          </div>
        ) : (
          <div className="likes-grid">
            {likedCandidates.map((candidate) => (
              <article key={candidate.id} className="liked-card">
                <div className="liked-avatar">{createAvatarSeed(candidate.name)}</div>
                <div>
                  <strong>{candidate.name}</strong>
                  <p>{candidate.major} · {candidate.vibe}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    )
  }

  function renderMessagesTab() {
    return (
      <section className="tab-screen">
        <div className="feed-meta">
          <span className="status-badge muted">메시지</span>
          <span className="feed-progress">베타</span>
        </div>

        <div className="empty-feed">
          <h3>채팅 화면은 아직 시범입니다.</h3>
          <p>매칭이 쌓이면 대화방 목록으로 확장할 수 있습니다.</p>
          <button type="button" className="primary-button wide" onClick={() => setDrawerOpen(true)}>내 정보 열기</button>
        </div>
      </section>
    )
  }

  function renderProfileTab() {
    return (
      <section className="tab-screen">
        <div className="feed-meta">
          <span className="status-badge muted">프로필</span>
          <span className="feed-progress">편집 가능</span>
        </div>

        <div className="profile-summary-card">
          <p className="section-label">내 정보</p>
          <h3>설정은 여기서 바로 바꿉니다.</h3>
          <p>자기소개, 사진, 취향 모두 드로어에서 수정할 수 있습니다.</p>
          <div className="profile-summary-actions">
            <button type="button" className="primary-button" onClick={() => setDrawerOpen(true)}>프로필 수정</button>
            <button type="button" className="secondary-button subtle" onClick={onOpenSetup}>설정 다시</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="tinder-shell">
      <header className="tinder-topbar">
        <div className="brand-lockup">
          <div className="brand-mark">D</div>
          <div>
            <p className="section-label">Donga Dating</p>
            <h1>Discover your match</h1>
          </div>
        </div>

        <div className="topbar-actions">
          <button type="button" className="secondary-button subtle" onClick={() => setDrawerOpen(true)}>내 정보</button>
          <button type="button" className="secondary-button subtle" onClick={onOpenSetup}>설정 다시</button>
        </div>
      </header>

      <main className="tinder-main">
        <section
          className="feed-column"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <div className="tab-strip" role="tablist" aria-label="메인 화면 탭">
            <button type="button" role="tab" aria-selected={activeTab === 'discover'} className={activeTab === 'discover' ? 'tab-button active' : 'tab-button'} onClick={() => openTab('discover')}>탐색</button>
            <button type="button" role="tab" aria-selected={activeTab === 'likes'} className={activeTab === 'likes' ? 'tab-button active' : 'tab-button'} onClick={() => openTab('likes')}>좋아요</button>
            <button type="button" role="tab" aria-selected={activeTab === 'messages'} className={activeTab === 'messages' ? 'tab-button active' : 'tab-button'} onClick={() => openTab('messages')}>메시지</button>
            <button type="button" role="tab" aria-selected={activeTab === 'profile'} className={activeTab === 'profile' ? 'tab-button active' : 'tab-button'} onClick={() => openTab('profile')}>프로필</button>
          </div>

          <div className="tab-hint">클릭으로 탭을 이동하고, 모바일에서는 좌우로 밀어도 화면이 바뀝니다.</div>

          {activeTab === 'discover' && renderDiscoverTab()}
          {activeTab === 'likes' && renderLikesTab()}
          {activeTab === 'messages' && renderMessagesTab()}
          {activeTab === 'profile' && renderProfileTab()}
        </section>

        <aside className="insight-column">
          <section className="insight-panel">
            <p className="section-label">내 상태</p>
            <h3>프로필이 완성된 사용자</h3>
            <p>자기소개와 취향을 저장한 뒤 카드 탐색을 시작하세요.</p>
          </section>

          <section className="insight-panel accent">
            <p className="section-label">바로가기</p>
            <h3>내 정보 수정</h3>
            <p>사진, 자기소개, 취향을 언제든 다시 열어서 바꿀 수 있습니다.</p>
            <button type="button" className="primary-button wide" onClick={() => setDrawerOpen(true)}>프로필 열기</button>
          </section>

          <section className="insight-panel compact">
            <p className="section-label">탐색 팁</p>
            <ul className="tip-list">
              <li>좋아요를 누르면 다음 카드로 넘어갑니다.</li>
              <li>내 정보에서는 자기소개와 취향을 바로 수정할 수 있습니다.</li>
              <li>사진은 업로드 후 프로필 카드에 반영됩니다.</li>
            </ul>
          </section>
        </aside>
      </main>

      <nav className="bottom-nav" aria-label="하단 내비게이션">
        <button type="button" className={activeTab === 'discover' ? 'nav-item active' : 'nav-item'} onClick={() => openTab('discover')}>탐색</button>
        <button type="button" className={activeTab === 'likes' ? 'nav-item active' : 'nav-item'} onClick={() => openTab('likes')}>좋아요</button>
        <button type="button" className={activeTab === 'messages' ? 'nav-item active' : 'nav-item'} onClick={() => openTab('messages')}>메시지</button>
        <button type="button" className={activeTab === 'profile' ? 'nav-item active' : 'nav-item'} onClick={() => openTab('profile')}>프로필</button>
      </nav>

      {drawerOpen && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setDrawerOpen(false)}>
          <div className="drawer-shell" onClick={(event) => event.stopPropagation()}>
            <AccountDrawer userId={userId} onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}