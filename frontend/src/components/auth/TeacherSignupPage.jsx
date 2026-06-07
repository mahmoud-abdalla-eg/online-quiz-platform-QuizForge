import { ArrowRight, BookOpen, ClipboardList, UserPlus } from "lucide-react";
import "./auth.css";

export function TeacherSignupPage({ loading, backendOnline, onRetryBackend, setPage, onSubmit }) {
  return (
    <section className="auth-page teacher-signup-page">
      <div className="auth-art">
        <p className="kicker">Become a teacher</p>
        <h1>Build quizzes your students can practice anytime.</h1>
        <p>
          Create a teacher account to prepare quizzes, add questions, and manage practice material
          for your class.
        </p>
        <div className="teacher-benefits">
          <span><BookOpen size={18} /> Create quiz libraries</span>
          <span><ClipboardList size={18} /> Add answers and review questions</span>
        </div>
      </div>

      <form className="auth-card" onSubmit={onSubmit}>
        <div>
          <p className="kicker">Teacher account</p>
          <h2>Set up teacher access</h2>
        </div>
        {!backendOnline && (
          <div className="inline-alert">
            <div>
              <strong>Service unavailable</strong>
              <p>Please try again when the quiz service is available.</p>
            </div>
            <button type="button" className="mini-link" onClick={onRetryBackend}>
              Check
            </button>
          </div>
        )}
        <label>
          Full name
          <input name="name" type="text" placeholder="Teacher name" required />
        </label>
        <label>
          Email address
          <input name="email" type="email" placeholder="teacher@example.com" required />
        </label>
        <label>
          Password
          <input name="password" type="password" minLength="4" required />
        </label>
        <button className="primary-btn full" type="submit" disabled={loading || !backendOnline}>
          <UserPlus size={18} />
          {loading ? "Please wait..." : !backendOnline ? "Connection unavailable" : "Create teacher account"}
        </button>
        <p className="form-note">
          Already have teacher access?{" "}
          <button type="button" className="text-btn" onClick={() => setPage("teacher-login")}>
            Teacher login
          </button>
        </p>
        <p className="form-note">
          Looking for quizzes?{" "}
          <button type="button" className="text-btn" onClick={() => setPage("login")}>
            Student login <ArrowRight size={14} />
          </button>
        </p>
      </form>
    </section>
  );
}
