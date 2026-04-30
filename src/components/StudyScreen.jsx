import { useState, useEffect, useRef } from 'react'
import { fetchStudyData } from '../utils/imageUtils'

function StudyCard({ item, index }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const cardRef = useRef(null)
  const observerRef = useRef(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !data && !loading) {
          setLoading(true)
          fetchStudyData(item).then((result) => {
            setData(result)
            setLoading(false)
          })
          // Disconnect after triggering load
          observerRef.current?.disconnect()
        }
      },
      { rootMargin: '400px' }
    )

    if (cardRef.current) {
      observerRef.current.observe(cardRef.current)
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [item]) // eslint-disable-line react-hooks/exhaustive-deps

  const displayName = item.displayTitle || item.answer
  const alts = item.alternates || []

  // Build "what to look for" clues
  const clues = []
  if (data?.extract) {
    const firstSentence = data.extract.split(/(?<=[.!?])\s+/)[0] || data.extract.slice(0, 150)
    clues.push(firstSentence)
  }
  if (alts.length > 0) {
    alts.forEach((alt) => clues.push(`Also accepted as: "${alt}"`))
  }

  return (
    <div className="study-card" ref={cardRef}>
      <div className="study-item-name">{displayName}</div>
      {alts.length > 0 && (
        <div className="study-item-alts">Also accepted: {alts.join(', ')}</div>
      )}

      {(loading || !data) ? (
        <div className="study-card-skeleton">
          {loading && (
            <div className="quiz-image-placeholder">
              <div className="spinner" />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Images */}
          <div className="study-images">
            {data.images.length > 0 ? (
              data.images.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                  <img
                    className="study-img"
                    src={src}
                    alt={`${displayName} image ${i + 1}`}
                    loading="lazy"
                  />
                </a>
              ))
            ) : (
              <div className="study-no-image">🖼</div>
            )}
          </div>

          {/* About section */}
          {data.extract && (
            <div className="study-about">
              <strong>About</strong>
              {data.extract.length >= 600
                ? data.extract.slice(0, 600) + '…'
                : data.extract}
            </div>
          )}

          {/* What to look for */}
          {clues.length > 0 && (
            <div className="study-clues">
              <strong>What to look for</strong>
              <ul>
                {clues.map((clue, i) => (
                  <li key={i}>{clue}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const DIFF_COLORS = { Easy: 'var(--easy)', Medium: 'var(--medium)', Hard: 'var(--hard)' }

export default function StudyScreen({ category, onHome, onSwitchCategory }) {
  return (
    <div className="study-screen">
      {/* Header */}
      <div className="study-header">
        <button className="study-back-btn quiz-back-btn" onClick={onHome}>← Home</button>
        <div className="study-title-block">
          <h2>{category.name} — Study Mode</h2>
          <div className="quiz-subject">{category.subject}</div>
        </div>
        <span
          className={`tag tag-${category.difficulty.toLowerCase()}`}
          style={{ alignSelf: 'center' }}
        >
          {category.difficulty}
        </span>
      </div>

      {/* Count */}
      <div className="study-count">{category.items.length} items in this category</div>

      {/* Card list */}
      <div className="study-list">
        {category.items.map((item, index) => (
          <StudyCard key={item.answer + index} item={item} index={index} />
        ))}
      </div>
    </div>
  )
}
