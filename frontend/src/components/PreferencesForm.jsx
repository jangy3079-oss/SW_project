import React, { useEffect, useMemo, useState } from 'react'

function unwrapApiResponse(payload) {
  if (!payload) return null
  if (payload.success === false) {
    throw new Error(payload.error?.message || 'API error')
  }

  return payload.data ?? payload
}

function toPreferenceState(categories, initialPreferences) {
  const nextState = {}

  for (const category of categories || []) {
    const currentValue = initialPreferences?.[category.id]
    nextState[category.id] = category.type === 'multi'
      ? (Array.isArray(currentValue) ? currentValue : [])
      : (typeof currentValue === 'string' ? currentValue : '')
  }

  return nextState
}

export default function PreferencesForm({ userId, onSaved }) {
  const [categories, setCategories] = useState([])
  const [formState, setFormState] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const title = '취향 설정'
  const intro = '프로필만 올린다고 끝이 아니라, 여기서 취향을 입력해야 매칭 기준이 만들어집니다.'
  const saveLabel = typeof onSaved === 'function' ? '저장하고 매칭으로' : '저장하기'

  useEffect(() => {
    let cancelled = false

    async function loadPreferences() {
      setLoading(true)
      setMessage('')

      try {
        const [templateResponse, userResponse] = await Promise.all([
          fetch('/api/preferences/template').then((response) => response.json()),
          fetch(`/api/users/${userId}/preferences`).then((response) => response.json())
        ])

        const template = unwrapApiResponse(templateResponse)
        const current = unwrapApiResponse(userResponse)
        const loadedCategories = template?.categories || []
        const loadedPreferences = current?.preferences || template?.examplePreferences || {}

        if (!cancelled) {
          setCategories(loadedCategories)
          setFormState(toPreferenceState(loadedCategories, loadedPreferences))
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

    loadPreferences()

    return () => {
      cancelled = true
    }
  }, [userId])

  const filledCount = useMemo(() => {
    return categories.reduce((count, category) => {
      const value = formState[category.id]
      if (category.type === 'multi') {
        return count + (Array.isArray(value) && value.length > 0 ? 1 : 0)
      }

      return count + (value ? 1 : 0)
    }, 0)
  }, [categories, formState])

  function setSingleValue(categoryId, value) {
    setFormState((current) => ({
      ...current,
      [categoryId]: value
    }))
  }

  function toggleMultiValue(categoryId, value) {
    setFormState((current) => {
      const selected = Array.isArray(current[categoryId]) ? current[categoryId] : []
      const nextValues = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]

      return {
        ...current,
        [categoryId]: nextValues
      }
    })
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch(`/api/users/${userId}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences: formState })
      })

      const json = await response.json()
      const result = unwrapApiResponse(json)
      setFormState(toPreferenceState(categories, result?.preferences || formState))
      setMessage('취향 설정 저장 완료. 다음 단계로 넘어갈 준비가 됐습니다.')
      if (typeof onSaved === 'function') {
        onSaved(result?.preferences || formState)
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>취향 설정 불러오는 중...</div>
  }

  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="section-label">취향</p>
          <h2>{title}</h2>
        </div>
        <span className="status-badge muted">{filledCount}/{categories.length}</span>
      </div>

      <p className="profile-bio">{intro}</p>

      <div className="preference-list">
        {categories.map((category) => {
          const currentValue = formState[category.id]

          return (
            <article key={category.id} className="preference-card">
              <div className="preference-card-header">
                <h3>{category.label}</h3>
                <span>{category.type === 'multi' ? '복수 선택' : '단일 선택'}</span>
              </div>

              <div className="option-grid">
                {category.options.map((option) => {
                  const isActive = category.type === 'multi'
                    ? Array.isArray(currentValue) && currentValue.includes(option.value)
                    : currentValue === option.value

                  return (
                    <button
                      type="button"
                      key={option.value}
                      className={isActive ? 'option-chip active' : 'option-chip'}
                      onClick={() => {
                        if (category.type === 'multi') {
                          toggleMultiValue(category.id, option.value)
                        } else {
                          setSingleValue(category.id, option.value)
                        }
                      }}
                    >
                      <span className="option-emoji">{option.emoji || '•'}</span>
                      <span>{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </article>
          )
        })}
      </div>

      <div className="next-action preference-actions">
        <button type="button" className="primary-button" onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : saveLabel}
        </button>
        <p>{typeof onSaved === 'function' ? '원하는 항목만 채우고 저장하면 됩니다.' : '바뀐 취향은 바로 저장됩니다.'}</p>
      </div>

      {message && <div className="msg">{message}</div>}
    </section>
  )
}