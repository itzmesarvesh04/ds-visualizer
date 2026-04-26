import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dsConfig } from '../data/dsConfig';

export default function DSQuiz() {
  const { ds } = useParams();
  const config = dsConfig[ds.toLowerCase()];
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  if (!config) return <div>Not Found</div>;

  const questions = config.quiz;

  const handleOptionSelect = (index) => {
    if (showFeedback) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setShowFeedback(true);
    if (selectedOption === questions[currentQuestion].answer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="quiz-page" style={{ padding: '120px 5% 60px', minHeight: '80vh' }}>
      <div className="quiz-container glass" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{config.title} <span className="text-gradient">Quiz</span></h2>
          <div className="badge">Question {currentQuestion + 1} / {questions.length}</div>
        </div>

        {!quizFinished ? (
          <div className="question-section">
            <h3 style={{ fontSize: '1.4rem', marginBottom: '2rem' }}>{questions[currentQuestion].question}</h3>
            
            <div className="options-grid" style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              {questions[currentQuestion].options.map((option, index) => {
                let statusClass = "";
                if (showFeedback) {
                  if (index === questions[currentQuestion].answer) statusClass = "correct";
                  else if (index === selectedOption) statusClass = "wrong";
                } else if (selectedOption === index) {
                  statusClass = "selected";
                }

                return (
                  <div 
                    key={index} 
                    className={`quiz-option glass interactive ${statusClass}`}
                    onClick={() => handleOptionSelect(index)}
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      border: '1px solid var(--glass-border)',
                      transition: 'all 0.3s ease',
                      background: statusClass === 'selected' ? 'rgba(59, 130, 246, 0.1)' : 'var(--glass-bg)',
                      borderColor: statusClass === 'correct' ? '#10B981' : (statusClass === 'wrong' ? '#EF4444' : (statusClass === 'selected' ? 'var(--primary-color)' : 'var(--glass-border)')),
                      color: (statusClass === 'correct' || statusClass === 'wrong' || statusClass === 'selected') ? 'var(--text-main)' : 'var(--text-muted)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--input-bg)', border: '1px solid var(--glass-border)',
                        fontWeight: '700'
                      }}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      {option}
                    </div>
                  </div>
                );
              })}
            </div>

            {showFeedback && (
              <div className={`explanation-box glass ${selectedOption === questions[currentQuestion].answer ? 'success' : 'error'}`} 
                style={{ 
                  padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem',
                  borderLeft: `4px solid ${selectedOption === questions[currentQuestion].answer ? '#10B981' : '#EF4444'}`,
                  background: 'rgba(255, 255, 255, 0.02)'
                }}
              >
                <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: selectedOption === questions[currentQuestion].answer ? '#10B981' : '#EF4444' }}>
                  {selectedOption === questions[currentQuestion].answer ? 'Correct!' : 'Incorrect'}
                </p>
                <p style={{ fontSize: '0.95rem' }}>{questions[currentQuestion].explanation}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              {!showFeedback ? (
                <button className="btn btn-primary" onClick={handleSubmit} disabled={selectedOption === null}>
                  Submit Answer
                </button>
              ) : (
                <button className="btn btn-primary glow-btn" onClick={handleNext}>
                  {currentQuestion < questions.length - 1 ? 'Next Question' : 'View Results'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="results-section" style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {score >= questions.length / 2 ? '🎉' : '📚'}
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Quiz Completed!</h2>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
              Your Score: <span className="text-gradient" style={{ fontWeight: '700', fontSize: '2rem' }}>{score} / {questions.length}</span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
              <button className="btn btn-secondary glass" onClick={restartQuiz}>
                Try Again
              </button>
              <Link to={`/${ds}`} className="btn btn-primary">
                Back to Path
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
