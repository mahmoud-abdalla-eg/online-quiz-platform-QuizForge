import { useEffect, useMemo, useState } from "react";
import { AdminPage } from "./components/admin/AdminPage";
import { AuthPage } from "./components/auth/AuthPage";
import { TeacherSignupPage } from "./components/auth/TeacherSignupPage";
import { StudentDashboard } from "./components/dashboard/StudentDashboard";
import { HomePage } from "./components/home/HomePage";
import { Footer, SiteHeader } from "./components/layout/SiteHeader";
import { QuizTakingPage } from "./components/quiz/QuizTakingPage";
import { buildAnswerFeedback } from "./utils/feedback";
import "./components/shared/shared.css";

const storedUser = JSON.parse(localStorage.getItem("quizUser") || "null");
const storedToken = localStorage.getItem("quizToken");
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

function App() {
  const [user, setUser] = useState(storedUser);
  const [token, setToken] = useState(storedToken);
  const [page, setPage] = useState(storedUser ? "dashboard" : "home");
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [attempts, setAttempts] = useState([]);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [health, setHealth] = useState(null);
  const [adminQuizDetail, setAdminQuizDetail] = useState(null);
  const [examStatus, setExamStatus] = useState(null);
  const isStudent = user?.role === "STUDENT";

  const quizOptions = useMemo(
    () => quizzes.map((quiz) => ({ value: quiz.id, label: quiz.title })),
    [quizzes]
  );

  const stats = useMemo(
    () => ({
      quizzes: quizzes.length,
      questions: quizzes.reduce((total, quiz) => total + Number(quiz.questionCount || 0), 0),
      attempts: attempts.length
    }),
    [quizzes, attempts]
  );

  useEffect(() => {
    bootBackendStatus();
  }, []);

  useEffect(() => {
    if (isStudent) {
      loadAttempts();
    } else {
      setAttempts([]);
    }
  }, [isStudent, token]);

  async function api(path, options = {}) {
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {})
        }
      });
    } catch {
      signOutAfterBackendLoss();
      throw new Error("Connection lost. Please try again after the service is available.");
    }

    const raw = await response.text();
    let data = {};
    if (raw.trim()) {
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error("The service returned an unexpected response. Please try again.");
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        signOutAfterBackendLoss();
        throw new Error("Your session expired. Please log in again.");
      }
      throw new Error(data.error || `Request failed with status ${response.status}.`);
    }
    return data;
  }

  async function bootBackendStatus() {
    const online = await loadHealth();
    if (online) {
      await loadQuizzes();
    } else {
      setQuizzes([]);
    }
  }

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function saveSession(nextUser) {
    setUser(nextUser);
    setToken(nextUser.token);
    localStorage.setItem("quizUser", JSON.stringify(nextUser));
    localStorage.setItem("quizToken", nextUser.token);
    setPage(nextUser.role === "ADMIN" ? "admin" : "dashboard");
  }

  function logout() {
    clearSession();
    setPage("home");
  }

  function clearSession() {
    setUser(null);
    setToken(null);
    setActiveQuiz(null);
    setAnswers({});
    setAttempts([]);
    setResult(null);
    setExamStatus(null);
    localStorage.removeItem("quizUser");
    localStorage.removeItem("quizToken");
  }

  function signOutAfterBackendLoss() {
    if (!user && !localStorage.getItem("quizToken")) {
      return;
    }
    clearSession();
    setBackendOnline(false);
    setPage("login");
    notify("Connection lost. You were signed out. Please log in again when the service is available.");
  }

  async function loadQuizzes() {
    try {
      setQuizzes(await api("/api/quizzes"));
      setBackendOnline(true);
    } catch {
      setQuizzes([]);
      setBackendOnline(false);
    }
  }

  async function loadHealth() {
    try {
      const status = await api("/api/health");
      setHealth(status);
      setBackendOnline(true);
      return true;
    } catch {
      setHealth(null);
      setBackendOnline(false);
      return false;
    }
  }

  async function loadAttempts() {
    try {
      setAttempts(await api("/api/attempts/mine"));
    } catch (error) {
      notify(error.message);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const form = Object.fromEntries(new FormData(event.currentTarget).entries());
      const expectedRole = form.portal === "teacher" ? "ADMIN" : "STUDENT";
      const loggedInUser = await api("/api/login", { method: "POST", body: JSON.stringify(form) });
      if (loggedInUser.role !== expectedRole) {
        throw new Error(expectedRole === "ADMIN" ? "Use a teacher account to enter the teacher area." : "Use a student account to enter the student area.");
      }
      saveSession(loggedInUser);
      notify("Logged in successfully.");
    } catch (error) {
      notify(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const form = Object.fromEntries(new FormData(event.currentTarget).entries());
      await api("/api/register", { method: "POST", body: JSON.stringify(form) });
      event.currentTarget.reset();
      setPage("login");
      notify("Account created. You can log in now.");
    } catch (error) {
      notify(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTeacherRegister(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const form = Object.fromEntries(new FormData(event.currentTarget).entries());
      await api("/api/teachers/register", { method: "POST", body: JSON.stringify(form) });
      event.currentTarget.reset();
      setPage("teacher-login");
      notify("Teacher account created. You can log in now.");
    } catch (error) {
      notify(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function openQuiz(quizId) {
    if (!user) {
      setPage("login");
      notify("Please log in first.");
      return;
    }
    try {
      setActiveQuiz(await api(`/api/quizzes/${quizId}`));
      setAnswers({});
      setResult(null);
      setPage("take-quiz");
    } catch (error) {
      notify(error.message);
    }
  }

  async function submitAttempt(event) {
    event.preventDefault();
    const payload = activeQuiz.questions.map((question) => ({
      questionId: question.id,
      optionId: Number(answers[question.id])
    }));

    try {
      let submitted = await api("/api/attempts", {
        method: "POST",
        body: JSON.stringify({ quizId: activeQuiz.quiz.id, answers: payload })
      });

      if (!submitted.feedback || submitted.feedback.length === 0) {
        submitted = await addFeedbackFallback(submitted);
      }

      setResult(submitted);
      notify("Quiz submitted.");
      loadAttempts();
    } catch (error) {
      notify(error.message);
    }
  }

  async function addFeedbackFallback(submitted) {
    try {
      const review = await api(`/api/quizzes/${activeQuiz.quiz.id}/review`);
      return { ...submitted, feedback: buildAnswerFeedback(review.questions, answers) };
    } catch {
      return { ...submitted, feedback: [] };
    }
  }

  async function createQuiz(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setLoading(true);
    try {
      const form = Object.fromEntries(new FormData(formElement).entries());
      await api("/api/quizzes", {
        method: "POST",
        body: JSON.stringify({ ...form, durationMinutes: Number(form.durationMinutes) })
      });
      formElement.reset();
      await loadQuizzes();
      setAdminQuizDetail(null);
      notify("Quiz created.");
    } catch (error) {
      notify(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateQuiz(quizId, data) {
    setLoading(true);
    try {
      await api(`/api/quizzes/${quizId}`, {
        method: "PUT",
        body: JSON.stringify({ ...data, durationMinutes: Number(data.durationMinutes) })
      });
      await loadQuizzes();
      await loadAdminQuiz(quizId);
      notify("Quiz updated.");
    } catch (error) {
      notify(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function addQuestion(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setLoading(true);
    try {
      const form = Object.fromEntries(new FormData(formElement).entries());
      const correctIndex = Number(form.correctIndex);
      const options = [0, 1, 2, 3].map((index) => ({
        text: form[`option${index}`],
        correct: correctIndex === index
      }));

      await api(`/api/quizzes/${form.quizId}/questions`, {
        method: "POST",
        body: JSON.stringify({ text: form.text, options })
      });
      formElement.reset();
      await loadQuizzes();
      await loadAdminQuiz(Number(form.quizId));
      notify("Question added.");
    } catch (error) {
      notify(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateQuestion(questionId, quizId, data) {
    setLoading(true);
    try {
      await api(`/api/questions/${questionId}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
      await loadQuizzes();
      await loadAdminQuiz(quizId);
      notify("Question updated.");
    } catch (error) {
      notify(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAdminQuiz(quizId) {
    if (!quizId) {
      setAdminQuizDetail(null);
      return;
    }
    try {
      setAdminQuizDetail(await api(`/api/admin/quizzes/${quizId}`));
    } catch (error) {
      notify(error.message);
    }
  }

  async function deleteQuiz(quizId) {
    try {
      await api(`/api/quizzes/${quizId}`, { method: "DELETE" });
      setAdminQuizDetail(null);
      await loadQuizzes();
      notify("Quiz deleted.");
    } catch (error) {
      notify(error.message);
    }
  }

  async function deleteQuestion(questionId, quizId) {
    try {
      await api(`/api/questions/${questionId}`, { method: "DELETE" });
      await loadQuizzes();
      await loadAdminQuiz(quizId);
      notify("Question deleted.");
    } catch (error) {
      notify(error.message);
    }
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader user={user} page={page} setPage={setPage} logout={logout} examStatus={examStatus} />
      <main id="main">
        {page === "home" && (
          <HomePage quizzes={quizzes} stats={stats} backendOnline={backendOnline} health={health} openQuiz={openQuiz} setPage={setPage} />
        )}
        {page === "login" && (
          <AuthPage mode="login" loading={loading} backendOnline={backendOnline} onRetryBackend={bootBackendStatus} setPage={setPage} onSubmit={handleLogin} />
        )}
        {page === "teacher-login" && (
          <AuthPage mode="teacher-login" loading={loading} backendOnline={backendOnline} onRetryBackend={bootBackendStatus} setPage={setPage} onSubmit={handleLogin} />
        )}
        {page === "signup" && (
          <AuthPage mode="signup" loading={loading} backendOnline={backendOnline} onRetryBackend={bootBackendStatus} setPage={setPage} onSubmit={handleRegister} />
        )}
        {page === "become-teacher" && (
          <TeacherSignupPage loading={loading} backendOnline={backendOnline} onRetryBackend={bootBackendStatus} setPage={setPage} onSubmit={handleTeacherRegister} />
        )}
        {page === "dashboard" && (
          <StudentDashboard user={user} quizzes={quizzes} attempts={attempts} openQuiz={openQuiz} refresh={loadQuizzes} backendOnline={backendOnline} />
        )}
        {page === "take-quiz" && (
          <QuizTakingPage
            activeQuiz={activeQuiz}
            answers={answers}
            setAnswers={setAnswers}
            submitAttempt={submitAttempt}
            result={result}
            setPage={setPage}
            setExamStatus={setExamStatus}
          />
        )}
        {page === "admin" && (
          <AdminPage
            user={user}
            quizzes={quizzes}
            stats={stats}
            quizOptions={quizOptions}
            createQuiz={createQuiz}
            updateQuiz={updateQuiz}
            addQuestion={addQuestion}
            updateQuestion={updateQuestion}
            adminQuizDetail={adminQuizDetail}
            loadAdminQuiz={loadAdminQuiz}
            deleteQuiz={deleteQuiz}
            deleteQuestion={deleteQuestion}
            refresh={loadQuizzes}
            loading={loading}
            backendOnline={backendOnline}
            health={health}
          />
        )}
      </main>
      {!["login", "teacher-login", "signup", "become-teacher"].includes(page) && <Footer />}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

export default App;
