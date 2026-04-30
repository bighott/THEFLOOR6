import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchWikiImage, checkAnswer } from '../utils/imageUtils'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function QuizScreen({ category, onFinish, onHome }) {
  const [items] = useState(() => shuffle(category.items))
  const [idx, setIdx] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [status, setStatus] = useState('idle') // idle | correct | incorrect | skipped
  const [results, setResults] = useState([])
  const [imageUrl, setImageUrl] = useState(null)
  const [imageLoading, setImageLoading] = useState(true)
  const inputRef = useRef(null)

  const current = items[idx]
  const isLast = idx === items.length - 1

  useEffect(() => {
    setImageUrl(null)
    setImageLoading(true)
    if (current?.imageUrl) {
      setImageUrl(current.imageUrl)
      setImageLoading(false)
    } else if (current?.wikiTitle) {
      fetchWikiImage(current.wikiTitle).then((url) => {
        setImageUrl(url)
        setImageLoading(false)
      })
    } else {
      setImageLoading(false)
    }
    if (inputRef.current) inputRef.current.focus()
  }, [idx, current])

  const advance = useCallback(() => {
    if (isLast) {
      onFinish([...results])
    } else {
      setIdx((i) => i + 1)
      setUserAnswer('')
      setStatus('idle')
    }
  }, [isLast, results, onFinish])

  const handleSubmit = useCallback(() => {
    if (status !== 'idle') return
    if (!userAnswer.trim()) return
    const correct = checkAnswer(userAnswer, current)
    const newResult = { item: current, userAnswer, correct, skipped: false, imageUrl }
    setResults((r) => [...r, newResult])
    setStatus(correct ? 'correct' : 'incorrect')
  }, [status, userAnswer, current, imageUrl])

  const handleSkip = useCallback(() => {
    if (status !== 'idle') return
    const newResult = { item: current, userAnswer: '', correct: false, skipped: true, imageUrl }
    setResults((r) => [...r, newResult])
    setStatus('skipped')
  }, [status, current, imageUrl])

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (status !== 'idle') advance()
      else handleSubmit()
    }
    if (e.key === 'Escape' && status === 'idle') handleSkip()
  }

  const correctCount = results.filter((r) => r.correct).length
  const incorrectCount = results.filter((r) => !r.correct && !r.skipped).length
  const skippedCount = results.filter((r) => r.skipped).length
  const pct = Math.round((idx / items.length) * 100)

  const displayTitle = current?.displayTitle

  return (
    <div className="quiz">
      <div className="quiz-header">
        <button className="quiz-back-btn" onClick={onHome}>← Home</button>
        <div className="quiz-title-block">
          <h2>{category.name}</h2>
          <div className="quiz-subject">{category.subject}</div>
        </div>
        <div className="quiz-progress-label">{idx + 1} / {items.length}</div>
      </div>

      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Image — always fully visible, no overlay */}
      <div className="quiz-image-wrap">
        {imageLoading ? (
          <div className="quiz-image-placeholder">
            <div className="spinner" />
            <span>Loading image…</span>
          </div>
        ) : imageUrl ? (
          <img className="quiz-image" src={imageUrl} alt={status !== 'idle' ? current.answer : 'Quiz image'} />
        ) : (
          <div className="quiz-image-placeholder">
            <span style={{ fontSize: 48 }}>🖼️</span>
            <span>No image available</span>
          </div>
        )}
      </div>

      {/* Answer reveal banner — shown after submit/skip, sits between image and input */}
      {status !== 'idle' && (
        <div className={`answer-reveal ${status}`}>
          {status === 'correct' && <span className="reveal-icon">✅</span>}
          {status === 'incorrect' && <span className="reveal-icon">❌</span>}
          {status === 'skipped' && <span className="reveal-icon">⏭️</span>}
          <span className="reveal-label">
            {status === 'correct'
              ? `Correct! — ${current.answer}`
              : `Answer: ${current.answer}`}
          </span>
          <button className="reveal-next-btn" onClick={advance}>
            {isLast ? 'See Results →' : 'Next →'} <kbd>Enter</kbd>
          </button>
        </div>
      )}

      {/* Fill-in-the-blank title */}
      {displayTitle && (
        <div className="quiz-display-title">
          {displayTitle.split('_____').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="blank">
                  {status !== 'idle' ? current.answer : '_____'}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="quiz-input-row">
        <input
          ref={inputRef}
          className={`quiz-answer-input ${status}`}
          placeholder={displayTitle ? 'Type the missing word…' : 'Type your answer…'}
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={handleKey}
          disabled={status !== 'idle'}
        />
        <button
          className="quiz-submit-btn"
          onClick={handleSubmit}
          disabled={status !== 'idle' || !userAnswer.trim()}
        >
          Submit
        </button>
      </div>

      <div className="quiz-btn-row">
        <button className="quiz-skip-btn" onClick={handleSkip} disabled={status !== 'idle'}>
          Skip (Esc)
        </button>
      </div>

      <div className="quiz-score-bar">
        <div className="score-stat correct"><span className="val">{correctCount}</span><span className="lbl">Correct</span></div>
        <div className="score-stat incorrect"><span className="val">{incorrectCount}</span><span className="lbl">Wrong</span></div>
        <div className="score-stat skipped"><span className="val">{skippedCount}</span><span className="lbl">Skipped</span></div>
      </div>
    </div>
  )
}
