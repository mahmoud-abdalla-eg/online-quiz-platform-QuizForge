import { LogIn, LogOut, UserPlus } from "lucide-react";
import { formatTime } from "../../utils/format";
import "./layout.css";

export function SiteHeader({ user, page, setPage, logout, examStatus }) {
  const isExam = page === "take-quiz" && examStatus;
  const navProgress = isExam ? examStatus.progress : 0;
  const goToHomeSection = (sectionId) => {
    setPage("home");
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" }), 30);
  };

  return (
    <header className="site-header">
      <button className="brand" onClick={() => setPage("home")}>
        <span className="brand-mark">Q</span>
        <span>QuizForge</span>
      </button>
      <nav className="nav-links" aria-label="Main navigation">
        <button className={page === "home" ? "active" : ""} onClick={() => setPage("home")}>
          Home
        </button>
        {!user && (
          <>
            <button onClick={() => goToHomeSection("teachers")}>For teachers</button>
            <button onClick={() => setPage("become-teacher")}>Become a teacher</button>
            <button onClick={() => goToHomeSection("contact")}>Contact</button>
          </>
        )}
        {user?.role === "STUDENT" && (
          <button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>
            Dashboard
          </button>
        )}
        {user?.role === "ADMIN" && (
          <button className={page === "admin" ? "active" : ""} onClick={() => setPage("admin")}>
            Admin
          </button>
        )}
      </nav>
      <div className="header-actions">
        {user ? (
          <>
            <span className="user-chip">{user.name}</span>
            <button className="ghost-btn" onClick={logout}>
              <LogOut size={18} />
              Log out
            </button>
          </>
        ) : (
          <>
            <button className="ghost-btn" onClick={() => setPage("login")}>
              <LogIn size={18} />
              Student login
            </button>
            <button className="ghost-btn" onClick={() => setPage("teacher-login")}>
              <LogIn size={18} />
              Teacher login
            </button>
            <button className="primary-btn" onClick={() => setPage("signup")}>
              <UserPlus size={18} />
              Sign up
            </button>
          </>
        )}
      </div>
      {isExam && (
        <div className="nav-progress-panel exam-mode">
          <div className="nav-progress-meta">
            <span>
              {examStatus.questionsLeft} question{examStatus.questionsLeft === 1 ? "" : "s"} left
            </span>
            <span>Time left: {formatTime(examStatus.timeLeft)}</span>
          </div>
          <div className="nav-data-bar" aria-label="Exam answer progress">
            <span style={{ width: `${navProgress}%` }} />
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <span>QuizForge online learning</span>
      <span>Quizzes, practice, and progress in one place</span>
    </footer>
  );
}
