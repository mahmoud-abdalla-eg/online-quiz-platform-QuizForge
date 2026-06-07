import { BookOpen, ClipboardList, RefreshCcw, WifiOff } from "lucide-react";
import { EmptyState } from "../shared/EmptyState";
import { PanelTitle } from "../shared/PanelTitle";
import { QuizCard } from "../shared/QuizCard";
import "./dashboard.css";

export function StudentDashboard({ user, quizzes, attempts, openQuiz, refresh, backendOnline }) {
  return (
    <section className="app-shell">
      <div className="dashboard-hero">
        <div>
          <p className="kicker">Student dashboard</p>
          <h1>Good to see you, {user?.name || "student"}.</h1>
          <p>Choose a quiz, submit your answers, and review your previous scores.</p>
        </div>
        <button className="ghost-btn" onClick={refresh}>
          <RefreshCcw size={18} />
          Refresh
        </button>
      </div>
      {!backendOnline && (
        <div className="offline-strip">
          <WifiOff size={18} />
          The quiz service is temporarily unavailable. Please try again soon.
        </div>
      )}

      <div className="dashboard-grid">
        <section className="content-panel large-panel">
          <PanelTitle icon={<BookOpen />} title="Available quizzes" subtitle="Open one to start an attempt." />
          <div className="quiz-list">
            {quizzes.length === 0 ? (
              <EmptyState title="No quizzes available" text="Please check back later or ask your teacher for a new quiz." />
            ) : (
              quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} actionLabel="Take quiz" onOpen={() => openQuiz(quiz.id)} />
              ))
            )}
          </div>
        </section>
        <section className="content-panel">
          <PanelTitle icon={<ClipboardList />} title="Recent attempts" subtitle="Your submitted quiz results." />
          <AttemptList attempts={attempts} />
        </section>
      </div>
    </section>
  );
}

function AttemptList({ attempts }) {
  if (attempts.length === 0) {
    return <EmptyState title="No attempts yet" text="Your submitted quiz scores will appear here." />;
  }

  return (
    <div className="attempt-list">
      {attempts.map((attempt) => (
        <article className="attempt-card" key={attempt.id}>
          <div>
            <h3>{attempt.quizTitle}</h3>
            <p>{attempt.submittedAt}</p>
          </div>
          <strong>
            {attempt.score}/{attempt.totalQuestions}
          </strong>
        </article>
      ))}
    </div>
  );
}
