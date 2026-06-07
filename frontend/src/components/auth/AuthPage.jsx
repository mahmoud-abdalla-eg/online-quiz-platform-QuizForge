import { LogIn, UserPlus, WifiOff } from "lucide-react";
import "./auth.css";

export function AuthPage({ mode, loading, backendOnline, onRetryBackend, setPage, onSubmit }) {
  const isLogin = mode === "login";
  const isTeacherLogin = mode === "teacher-login";
  const isSignup = mode === "signup";
  const title = isTeacherLogin ? "Teacher login" : isLogin ? "Student login" : "Create your student account";
  const heading = isTeacherLogin ? "Manage your quizzes" : isLogin ? "Continue learning" : "Start practicing today";
  const emailDefault = isTeacherLogin ? "admin@quiz.com" : isLogin ? "student@quiz.com" : "";
  const passwordDefault = isTeacherLogin ? "admin123" : isLogin ? "student123" : "";

  return (
    <section className="auth-page">
      <div className="auth-art">
        <p className="kicker">{isTeacherLogin ? "Teacher area" : "Student area"}</p>
        <h1>{isTeacherLogin ? "Create, review, and improve classroom quizzes." : "Practice with clear quizzes and instant results."}</h1>
        <p>
          QuizForge keeps learning simple: choose a quiz, answer carefully, and see your score when
          you finish.
        </p>
      </div>

      <form className="auth-card" onSubmit={onSubmit}>
        <div>
          <p className="kicker">{title}</p>
          <h2>{heading}</h2>
        </div>
        {!backendOnline && (
          <div className="inline-alert">
            <WifiOff size={18} />
            <div>
              <strong>Service unavailable</strong>
              <p>Please try again when the quiz service is available.</p>
            </div>
            <button type="button" className="mini-link" onClick={onRetryBackend}>
              Check
            </button>
          </div>
        )}
        <input type="hidden" name="portal" value={isTeacherLogin ? "teacher" : "student"} />
        {isSignup && (
          <label>
            Full name
            <input name="name" type="text" placeholder="Chen Wei" required />
          </label>
        )}
        <label>
          Email address
          <input name="email" type="email" defaultValue={emailDefault} placeholder="you@example.com" required />
        </label>
        <label>
          Password
          <input name="password" type="password" defaultValue={passwordDefault} minLength="4" required />
        </label>
        <button className="primary-btn full" type="submit" disabled={loading || !backendOnline}>
          {isSignup ? <UserPlus size={18} /> : <LogIn size={18} />}
          {loading ? "Please wait..." : !backendOnline ? "Connection unavailable" : isSignup ? "Create account" : "Login"}
        </button>
        <p className="form-note">
          {isTeacherLogin ? "Looking for student access?" : isSignup ? "Already have an account?" : "Need a student account?"}{" "}
          <button type="button" className="text-btn" onClick={() => setPage(isTeacherLogin || isSignup ? "login" : "signup")}>
            {isTeacherLogin ? "Student login" : isSignup ? "Login" : "Sign up"}
          </button>
        </p>
        {!isTeacherLogin && (
          <p className="form-note">
            Are you a teacher?{" "}
            <button type="button" className="text-btn" onClick={() => setPage("teacher-login")}>
              Teacher login
            </button>
          </p>
        )}
      </form>
    </section>
  );
}
