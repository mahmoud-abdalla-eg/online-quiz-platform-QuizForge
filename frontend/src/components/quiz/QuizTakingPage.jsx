import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardList, Sparkles, TimerReset } from "lucide-react";
import { EmptyState } from "../shared/EmptyState";
import { formatTime } from "../../utils/format";
import "./quiz.css";

export function QuizTakingPage({ activeQuiz, answers, setAnswers, submitAttempt, result, setPage, setExamStatus }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const totalQuestions = activeQuiz?.questions.length || 0;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100);
  const feedbackByQuestion = useMemo(() => {
    const feedback = {};
    (result?.feedback || []).forEach((item) => {
      feedback[item.questionId] = item;
    });
    return feedback;
  }, [result]);

  useEffect(() => {
    if (!activeQuiz) {
      return;
    }
    setExamStarted(false);
    setTimeLeft(activeQuiz.quiz.durationMinutes * 60);
  }, [activeQuiz?.quiz.id]);

  useEffect(() => {
    if (!activeQuiz || !examStarted || result || timeLeft <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeQuiz, examStarted, result, timeLeft]);

  useEffect(() => {
    if (!examStarted) {
      setExamStatus(null);
      return;
    }
    setExamStatus({
      answeredCount,
      totalQuestions,
      questionsLeft: Math.max(totalQuestions - answeredCount, 0),
      timeLeft,
      progress
    });
  }, [answeredCount, totalQuestions, timeLeft, progress, examStarted, setExamStatus]);

  useEffect(() => () => setExamStatus(null), [setExamStatus]);

  if (!activeQuiz) {
    return (
      <section className="app-shell">
        <EmptyState title="No quiz selected" text="Return to the dashboard and choose a quiz." />
      </section>
    );
  }

  if (!examStarted) {
    return (
      <section className="app-shell narrow">
        <button className="text-btn back-btn" onClick={() => setPage("dashboard")}>
          Back to dashboard
        </button>
        <div className="exam-ready-card">
          <p className="kicker">Ready check</p>
          <h1>{activeQuiz.quiz.title}</h1>
          <p>{activeQuiz.quiz.description}</p>
          <div className="exam-ready-grid">
            <div>
              <TimerReset size={21} />
              <span>Quiz time</span>
              <strong>{activeQuiz.quiz.durationMinutes} minutes</strong>
            </div>
            <div>
              <ClipboardList size={21} />
              <span>Questions</span>
              <strong>{totalQuestions}</strong>
            </div>
            <div>
              <CheckCircle2 size={21} />
              <span>Scoring</span>
              <strong>Instant result</strong>
            </div>
          </div>
          {totalQuestions === 0 ? (
            <EmptyState title="No questions yet" text="Ask the admin to add questions before starting this quiz." />
          ) : (
            <button className="primary-btn large full" onClick={() => setExamStarted(true)}>
              Start now
              <ArrowRight size={19} />
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="app-shell narrow">
      <button className="text-btn back-btn" onClick={() => setPage("dashboard")}>
        Back to dashboard
      </button>
      <div className="content-panel">
        <div className="section-title">
          <div>
            <p className="kicker">Quiz attempt</p>
            <h1>{activeQuiz.quiz.title}</h1>
            <p className="muted-copy">{activeQuiz.quiz.description}</p>
          </div>
          <div className="attempt-meta">
            <span className="badge">
              <TimerReset size={17} />
              {formatTime(timeLeft)}
            </span>
            <span className="badge">
              {answeredCount}/{totalQuestions} answered
            </span>
          </div>
        </div>
        <div className="answer-progress" aria-label="Answer progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        {activeQuiz.questions.length === 0 ? (
          <EmptyState title="No questions yet" text="Ask the admin to add questions before students take this quiz." />
        ) : (
          <form className="question-list" onSubmit={submitAttempt}>
            {activeQuiz.questions.map((question, index) => (
              <article className="question-card" key={question.id}>
                <h3>
                  {index + 1}. {question.text}
                </h3>
                {question.options.map((option) => (
                  <label className="option-row" key={option.id}>
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option.id}
                      required
                      checked={Number(answers[question.id]) === option.id}
                      onChange={() => setAnswers({ ...answers, [question.id]: option.id })}
                    />
                    <span>{option.text}</span>
                  </label>
                ))}
                {feedbackByQuestion[question.id] && (
                  <AnswerFeedback feedback={feedbackByQuestion[question.id]} />
                )}
              </article>
            ))}
            {result && (!result.feedback || result.feedback.length === 0) && (
              <div className="answer-feedback wrong">
                <div>
                  <strong>Answer feedback is not available yet.</strong>
                  <p>Please try again soon so the quiz can show the full answer review.</p>
                </div>
              </div>
            )}
            <button className="primary-btn full" type="submit">
              <CheckCircle2 size={18} />
              Submit answers
            </button>
          </form>
        )}

        {result && (
          <div className="result-banner">
            <Sparkles size={22} />
            <span>
              Score: <strong>{result.score}</strong> / {result.totalQuestions}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function AnswerFeedback({ feedback }) {
  if (feedback.correct) {
    return (
      <div className="answer-feedback correct">
        <CheckCircle2 size={18} />
        <strong>Correct.</strong>
      </div>
    );
  }

  return (
    <div className="answer-feedback wrong">
      <div>
        <strong>Correct answer: {feedback.correctAnswer}</strong>
        <p>{feedback.explanation}</p>
      </div>
    </div>
  );
}
