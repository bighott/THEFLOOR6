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
  const timerRef = useRef(null)

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
    clearTimeout(timerRef.current)
    if (isLast) {
      onFinish([...results])
    } else {
      setIdx((i) => i + 1)
      setUserAnswer('')
      setStatus('idle')
    }
  }, [isLast, results, onFinish])

  const handleSubmit = useCallback(() => {
    if (status !== 'idle') { advance(); return }
    if (!userAnswer.trim()) return
    const correct = checkAnswer(userAnswer, current)
    const newResult = { item: current, userAnswer, correct, skipped: false, imageUrl }
    setResults((r) => [...r, newResult])
    setStatus(correct ? 'correct' : 'incorrect')
    timerRef.current = setTimeout(advance, 2200)
  }, [status, userAnswer, current, imageUrl, advance])

  const handleSkip = useCallback(() => {
    if (status !== 'idle') { advance(); return }
    const newResult = { item: current, userAnswer: '', correct: false, skipped: true, imageUrl }
    setResults((r) => [...r, newResult])
    setStatus('skipped')
    timerRef.current = setTimeout(advance, 2200)
  }, [status, current, imageUrl, advance])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (status !== 'idle') advance()
      else handleSubmit()
    }
    if (e.key === 'Escape') handleSkip()
  }

  const correct = results.filter((r) => r.correct).length
  const incorrect = results.filter((r) => !r.correct && !r.skipped).length
  const skipped = results.filter((r) => r.skipped).length
  const pct = Math.round(((idx) / items.length) * 100)

  const feedbackText = status === 'correct'
    ? '✓ Correct!'
    : status === 'skipped'
      ? `Answer: ${current.answer}`
      : status === 'incorrect'
        ? `✗  Answer: ${current.answer}`
        : ''

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

        {status !== 'idle' && (
          <div className={`quiz-feedback-overlay ${status === 'correct' ? 'correct' : 'incorrect'}`}>
            <div>{status === 'correct' ? '✓ Correct!' : status === 'skipped' ? 'Skipped' : '✗ Wrong'}</div>
            {status !== 'correct' && (
              <div className="feedback-correct-answer">Answer: {current.answer}</div>
            )}
          </div>
        )}
      </div>

      {displayTitle && (
        <div className="quiz-display-title">
          {displayTitle.split('_____').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && <span className="blank">{status !== 'idle' ? current.answer : '_____'}</span>}
            </span>
          ))}
        </div>
      )}

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
          onClick={status !== 'idle' ? advance : handleSubmit}
          disabled={status === 'idle' && !userAnswer.trim()}
        >
          {status !== 'idle' ? (isLast && status !== 'idle' ? 'Finish' : 'Next →') : 'Submit'}
        </button>
      </div>

      <div className="quiz-btn-row">
        <button className="quiz-skip-btn" onClick={handleSkip} disabled={status !== 'idle'}>
          Skip (Esc)
        </button>
        <button className="quiz-next-btn" onClick={advance} style={{ visibility: status !== 'idle' ? 'visible' : 'hidden' }}>
          {isLast ? 'See Results' : 'Next →'} (Enter)
        </button>
      </div>

      <div className="quiz-score-bar">
        <div className="score-stat correct"><span className="val">{correct}</span><span className="lbl">Correct</span></div>
        <div className="score-stat incorrect"><span className="val">{incorrect}</span><span className="lbl">Wrong</span></div>
        <div className="score-stat skipped"><span className="val">{skipped}</span><span className="lbl">Skipped</span></div>
      </div>
    </div>
  )
}
