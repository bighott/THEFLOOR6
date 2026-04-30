const GRADES = [
  { min: 90, label: 'Floor Champion!', emoji: '🏆' },
  { min: 75, label: 'Strong Performance', emoji: '⭐' },
  { min: 60, label: 'Getting There', emoji: '📈' },
  { min: 0, label: 'Keep Studying', emoji: '📚' },
]

export default function ScoreScreen({ results, category, onRetake, onHome }) {
  const total = results.length
  const correct = results.filter((r) => r.correct).length
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const grade = GRADES.find((g) => pct >= g.min)

  return (
    <div className="score-screen">
      <div className="score-hero">
        <div className="score-circle">
          <div className="score-num">{correct}</div>
          <div className="score-denom">out of {total}</div>
        </div>
        <h2>{grade.emoji} {grade.label}</h2>
        <p style={{ color: 'var(--text-muted)' }}>{pct}% correct on <strong style={{ color: 'var(--text)' }}>{category.name}</strong></p>
      </div>

      <div className="score-buttons">
        <button className="btn-retake" onClick={onRetake}>🔄 Retake Quiz</button>
        <button className="btn-home" onClick={onHome}>← Back to Categories</button>
      </div>

      <div className="score-breakdown">
        <h3>Question Breakdown</h3>
        <div className="score-item-list">
          {results.map((r, i) => (
            <div
              key={i}
              className={`score-item ${r.correct ? 'correct-item' : r.skipped ? 'skipped-item' : 'incorrect-item'}`}
            >
              {r.imageUrl ? (
                <img className="score-item-thumb" src={r.imageUrl} alt={r.item.answer} />
              ) : (
                <div className="score-item-thumb-placeholder">🖼️</div>
              )}
              <div className="score-item-info">
                <div className="score-item-answer">{r.item.answer}</div>
                <div className="score-item-user">
                  {r.skipped
                    ? 'Skipped'
                    : r.correct
                      ? `You said: "${r.userAnswer}"`
                      : `You said: "${r.userAnswer || '—'}"  ·  Correct: ${r.item.answer}`}
                </div>
              </div>
              <div className="score-item-icon">
                {r.correct ? '✅' : r.skipped ? '⏭️' : '❌'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
