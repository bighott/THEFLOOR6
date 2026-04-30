import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import QuizScreen from './components/QuizScreen'
import ScoreScreen from './components/ScoreScreen'
import StudyScreen from './components/StudyScreen'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [quizResults, setQuizResults] = useState(null)

  const startQuiz = (category) => {
    setSelectedCategory(category)
    setQuizResults(null)
    setScreen('quiz')
  }

  const startStudy = (category) => {
    setSelectedCategory(category)
    setScreen('study')
  }

  const finishQuiz = (results) => {
    setQuizResults(results)
    setScreen('score')
  }

  const retakeQuiz = () => {
    setQuizResults(null)
    setScreen('quiz')
  }

  const goHome = () => {
    setScreen('home')
    setSelectedCategory(null)
    setQuizResults(null)
  }

  return (
    <div className="app">
      {screen === 'home' && <HomeScreen onStartQuiz={startQuiz} onStudy={startStudy} />}
      {screen === 'quiz' && (
        <QuizScreen
          key={selectedCategory?.id + (quizResults ? '-retake-' + Date.now() : '')}
          category={selectedCategory}
          onFinish={finishQuiz}
          onHome={goHome}
        />
      )}
      {screen === 'score' && (
        <ScoreScreen
          results={quizResults}
          category={selectedCategory}
          onRetake={retakeQuiz}
          onHome={goHome}
        />
      )}
      {screen === 'study' && (
        <StudyScreen
          category={selectedCategory}
          onHome={goHome}
          onSwitchCategory={startStudy}
        />
      )}
    </div>
  )
}
