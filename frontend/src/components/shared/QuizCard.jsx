import { ArrowRight } from "lucide-react";

export function QuizCard({ quiz, actionLabel, onOpen }) {
  return (
    <article className="quiz-card">
      <div>
        <h3>{quiz.title}</h3>
        <p>{quiz.description}</p>
        <span className="meta-line">
          {quiz.durationMinutes} minutes / {quiz.questionCount} questions
        </span>
      </div>
      <button className="primary-btn small" onClick={onOpen}>
        {actionLabel}
        <ArrowRight size={17} />
      </button>
    </article>
  );
}
