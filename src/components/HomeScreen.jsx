import { useState, useMemo } from 'react'
import { categories } from '../data/categories'

const SUBJECTS = ['All Subjects', ...new Set(categories.map((c) => c.subject))]
const DIFFS = ['All', 'Easy', 'Medium', 'Hard']

export default function HomeScreen({ onStartQuiz, onStudy }) {
  const [search, setSearch] = useState('')
  const [diffFilter, setDiffFilter] = useState('All')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')

  const filtered = useMemo(() => {
    return categories.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
      const matchDiff = diffFilter === 'All' || c.difficulty === diffFilter
      const matchSubject = subjectFilter === 'All Subjects' || c.subject === subjectFilter
      return matchSearch && matchDiff && matchSubject
    })
  }, [search, diffFilter, subjectFilter])

  const diffColor = { Easy: 'var(--easy)', Medium: 'var(--medium)', Hard: 'var(--hard)' }

  return (
    <div className="home">
      <div className="home-header">
        <div className="logo-badge">The Floor</div>
        <h1>Picture <span>Quiz</span></h1>
        <p>Study all {categories.length} categories · {categories.reduce((n, c) => n + c.items.length, 0).toLocaleString()} flash cards</p>
      </div>

      <div className="home-controls">
        <input
          className="search-input"
          placeholder="Search categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-group">
          {DIFFS.map((d) => (
            <button
              key={d}
              className={`filter-btn ${d.toLowerCase()} ${diffFilter === d ? 'active' : ''}`}
              onClick={() => setDiffFilter(d)}
            >
              {d}
            </button>
          ))}
        </div>
        <select
          className="subject-select"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        >
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="home-stats">{filtered.length} categor{filtered.length === 1 ? 'y' : 'ies'} shown</div>

      <div className="category-grid">
        {filtered.map((cat) => (
          <button
            key={cat.id}
            className="category-card"
            style={{ '--diff-color': diffColor[cat.difficulty] }}
            onClick={(e) => { e.stopPropagation(); onStartQuiz(cat) }}
          >
            <div className="card-tags">
              <span className="tag tag-subject">{cat.subject}</span>
              <span className={`tag tag-${cat.difficulty.toLowerCase()}`}>{cat.difficulty}</span>
            </div>
            <div className="card-name">{cat.name}</div>
            <div className="card-desc">{cat.description}</div>
            <div className="card-footer">
              <span className="card-count">{cat.items.length} {cat.descriptionOnly ? 'descriptions' : 'images'}</span>
              <div className="card-footer-actions">
                <button
                  className="card-study-btn"
                  onClick={(e) => { e.stopPropagation(); onStudy(cat) }}
                >
                  Study
                </button>
                <span className="card-start">Start →</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
