import { useState } from "react";
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, Clock3, ClipboardList, Mail, Send, ShieldCheck, UsersRound, WifiOff } from "lucide-react";
import { EmptyState } from "../shared/EmptyState";
import { Feature } from "../shared/Feature";
import { Metric } from "../shared/Metric";
import { QuizCard } from "../shared/QuizCard";
import "./home.css";

export function HomePage({ quizzes, stats, backendOnline, health, openQuiz, setPage }) {
  const featured = backendOnline ? quizzes.slice(0, 3) : [];
  const [contactSent, setContactSent] = useState(false);

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="kicker">Online learning made simple</p>
          <h1>Practice smarter with clear online quizzes.</h1>
          <p className="hero-text">
            QuizForge helps students prepare with focused quizzes, instant scoring, and a simple
            dashboard for tracking progress after every attempt.
          </p>
          <div className="hero-actions single-action">
            <button
              className="primary-btn large"
              onClick={() => document.getElementById("quizzes")?.scrollIntoView({ behavior: "smooth" })}
            >
              Browse quizzes
              <ArrowRight size={19} />
            </button>
          </div>
          <div className="hero-metrics">
            <Metric value={health?.quizzes ?? stats.quizzes ?? 0} label="available quizzes" />
            <Metric value={stats.questions || 0} label="practice questions" />
            <Metric value="Fast" label="instant scoring" />
          </div>
          {!backendOnline && (
            <div className="offline-note">
              <WifiOff size={18} />
              The quiz service is temporarily unavailable. Please try again soon.
            </div>
          )}
        </div>
        <div className="hero-visual" aria-label="QuizForge system preview">
          <div className="visual-shell">
            <div className="visual-topline">
              <span className={backendOnline ? "status-dot online" : "status-dot"} />
              <strong>{backendOnline ? "Quiz library ready" : "Quiz library offline"}</strong>
              <small>Student practice center</small>
            </div>
            <div className="visual-score">
              <span>Available quizzes</span>
              <strong>{health?.quizzes ?? stats.quizzes ?? 0}</strong>
            </div>
            <div className="visual-lanes">
              <div>
                <span>Students</span>
                <strong>Practice anytime</strong>
                <p>guided questions, timer, instant score</p>
              </div>
              <div>
                <span>Teachers</span>
                <strong>Create lessons</strong>
                <p>organized quizzes, answers, review tools</p>
              </div>
            </div>
            <div className="visual-flow">
              <div><BookOpen size={18} /> Quiz</div>
              <div><ClipboardList size={18} /> Answers</div>
              <div><CheckCircle2 size={18} /> Score</div>
            </div>
          </div>
          <div className="visual-mini-panel">
            <UsersRound size={20} />
            <span>Learning spaces</span>
            <strong>Students / Teachers</strong>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <p className="kicker">Why students use it</p>
          <h2>Everything needed to practice with confidence.</h2>
        </div>
        <div className="feature-grid">
          <Feature icon={<ShieldCheck />} title="Focused practice" text="Students answer clear multiple-choice questions without distractions." />
          <Feature icon={<Clock3 />} title="Timed attempts" text="Each quiz can include a time limit so learners can prepare realistically." />
          <Feature icon={<BarChart3 />} title="Progress history" text="Past scores stay available so students can see how they improve." />
        </div>
      </section>

      <section className="section-block teacher-section" id="teachers">
        <div>
          <p className="kicker">For teachers</p>
          <h2>Become a teacher and build quizzes for your class.</h2>
          <p className="muted-copy">
            Teachers can create quizzes, add questions, mark correct answers, and keep materials
            ready for students to practice.
          </p>
        </div>
        <div className="teacher-actions">
          <button className="primary-btn large" onClick={() => setPage("teacher-login")}>
            Teacher login
            <ArrowRight size={19} />
          </button>
          <button className="ghost-btn large" onClick={() => setPage("become-teacher")}>
            Become a teacher
          </button>
        </div>
      </section>

      <section className="section-block split-section" id="quizzes">
        <div>
          <p className="kicker">Available quizzes</p>
          <h2>Choose a quiz and start practicing.</h2>
          <p className="muted-copy">
            Pick a quiz, review the details, and start when you are ready.
          </p>
        </div>
        <div className="public-quiz-list">
          {featured.length === 0 ? (
            <EmptyState
              title={backendOnline ? "No quizzes yet" : "Service unavailable"}
              text={backendOnline ? "New quizzes will appear here soon." : "The quiz service is temporarily unavailable."}
            />
          ) : (
            featured.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} actionLabel="Open quiz" onOpen={() => openQuiz(quiz.id)} />
            ))
          )}
        </div>
      </section>

      <section className="section-block contact-section" id="contact">
        <div>
          <p className="kicker">Contact us</p>
          <h2>Need help or want teacher access?</h2>
          <p className="muted-copy">
            Send a message and the school team can help with accounts, quizzes, or classroom setup.
          </p>
        </div>
        <form
          className="contact-form"
          onSubmit={(event) => {
            event.preventDefault();
            event.currentTarget.reset();
            setContactSent(true);
          }}
        >
          <label>
            Full name
            <input name="name" type="text" placeholder="Your name" required />
          </label>
          <label>
            Email address
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>
          <label>
            Message
            <textarea name="message" rows="5" placeholder="How can we help?" required />
          </label>
          <button className="primary-btn full" type="submit">
            <Send size={18} />
            Send message
          </button>
          {contactSent && (
            <p className="contact-success">
              <Mail size={17} />
              Thanks. Your message has been prepared.
            </p>
          )}
        </form>
      </section>
    </>
  );
}
