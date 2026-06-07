import { useEffect, useMemo, useState } from "react";
import { BookOpen, ClipboardList, Edit3, LayoutDashboard, Plus, RefreshCcw, Save, Trash2, WifiOff, X } from "lucide-react";
import { EmptyState } from "../shared/EmptyState";
import { PanelTitle } from "../shared/PanelTitle";
import { StatCard } from "../shared/StatCard";
import "./admin.css";

const emptyQuizDraft = {
  title: "",
  durationMinutes: 20,
  description: ""
};

function questionToDraft(question) {
  const options = [...question.options];
  while (options.length < 4) {
    options.push({ text: "", correct: false });
  }
  const correctIndex = Math.max(0, options.findIndex((option) => option.correct));
  return {
    text: question.text,
    option0: options[0]?.text || "",
    option1: options[1]?.text || "",
    option2: options[2]?.text || "",
    option3: options[3]?.text || "",
    correctIndex
  };
}

export function AdminPage({
  user,
  quizzes,
  stats,
  quizOptions,
  createQuiz,
  updateQuiz,
  addQuestion,
  updateQuestion,
  adminQuizDetail,
  loadAdminQuiz,
  deleteQuiz,
  deleteQuestion,
  refresh,
  loading,
  backendOnline
}) {
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [quizDraft, setQuizDraft] = useState(emptyQuizDraft);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionDraft, setQuestionDraft] = useState(null);

  const selectedQuizId = adminQuizDetail?.quiz?.id || quizOptions[0]?.value || "";
  const formMode = editingQuizId ? "edit" : "create";

  const selectedQuizLabel = useMemo(() => {
    if (!selectedQuizId) {
      return "No quiz selected";
    }
    return quizOptions.find((quiz) => String(quiz.value) === String(selectedQuizId))?.label || "Selected quiz";
  }, [quizOptions, selectedQuizId]);

  useEffect(() => {
    if (!adminQuizDetail || editingQuizId !== adminQuizDetail.quiz.id) {
      return;
    }
    setQuizDraft({
      title: adminQuizDetail.quiz.title,
      durationMinutes: adminQuizDetail.quiz.durationMinutes,
      description: adminQuizDetail.quiz.description
    });
  }, [adminQuizDetail, editingQuizId]);

  function updateQuizDraft(field, value) {
    setQuizDraft((current) => ({ ...current, [field]: value }));
  }

  function startCreateQuiz() {
    setEditingQuizId(null);
    setQuizDraft(emptyQuizDraft);
  }

  async function startEditQuiz(quiz) {
    setEditingQuizId(quiz.id);
    setQuizDraft({
      title: quiz.title,
      durationMinutes: quiz.durationMinutes,
      description: quiz.description || ""
    });
    await loadAdminQuiz(quiz.id);
  }

  async function submitQuiz(event) {
    if (!editingQuizId) {
      await createQuiz(event);
      setQuizDraft(emptyQuizDraft);
      return;
    }
    event.preventDefault();
    await updateQuiz(editingQuizId, quizDraft);
  }

  function startEditQuestion(question) {
    setEditingQuestionId(question.id);
    setQuestionDraft(questionToDraft(question));
  }

  function cancelQuestionEdit() {
    setEditingQuestionId(null);
    setQuestionDraft(null);
  }

  function updateQuestionDraft(field, value) {
    setQuestionDraft((current) => ({ ...current, [field]: value }));
  }

  async function submitQuestionEdit(event, questionId) {
    event.preventDefault();
    const correctIndex = Number(questionDraft.correctIndex);
    const options = [0, 1, 2, 3].map((index) => ({
      text: questionDraft[`option${index}`],
      correct: correctIndex === index
    }));
    await updateQuestion(questionId, adminQuizDetail.quiz.id, {
      text: questionDraft.text,
      options
    });
    cancelQuestionEdit();
  }

  return (
    <section className="admin-page">
      <div className="admin-header">
        <div>
          <p className="kicker">Teacher workspace</p>
          <h1>Build and manage classroom quizzes.</h1>
          <p>Logged in as {user?.name || "teacher"}. Create new quizzes, update existing ones, and keep questions ready for students.</p>
        </div>
        <button className="ghost-btn" onClick={refresh}>
          <RefreshCcw size={18} />
          Refresh
        </button>
      </div>

      {!backendOnline && (
        <div className="offline-strip">
          <WifiOff size={18} />
          The quiz service is temporarily unavailable. Teacher tools will work again soon.
        </div>
      )}

      <div className="stat-grid">
        <StatCard icon={<BookOpen />} value={stats.quizzes} label="Quizzes" />
        <StatCard icon={<ClipboardList />} value={stats.questions} label="Questions" />
        <StatCard icon={<LayoutDashboard />} value={backendOnline ? "Ready" : "Offline"} label="Workspace" />
      </div>

      <div className="admin-grid">
        <section className="content-panel">
          <PanelTitle
            icon={formMode === "edit" ? <Edit3 /> : <Plus />}
            title={formMode === "edit" ? "Edit quiz" : "Create quiz"}
            subtitle={formMode === "edit" ? "Update the selected quiz details." : "Set the details students see before starting."}
          />
          <form className="form" onSubmit={submitQuiz}>
            <label>
              Quiz title
              <input
                name="title"
                type="text"
                placeholder="Weekly review"
                value={quizDraft.title}
                onChange={(event) => updateQuizDraft("title", event.target.value)}
                required
              />
            </label>
            <label>
              Duration in minutes
              <input
                name="durationMinutes"
                type="number"
                min="1"
                value={quizDraft.durationMinutes}
                onChange={(event) => updateQuizDraft("durationMinutes", event.target.value)}
                required
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                rows="4"
                placeholder="Short note students will read before starting."
                value={quizDraft.description}
                onChange={(event) => updateQuizDraft("description", event.target.value)}
                required
              />
            </label>
            <div className="form-actions">
              {formMode === "edit" && (
                <button className="ghost-btn" type="button" onClick={startCreateQuiz}>
                  <X size={18} />
                  Cancel
                </button>
              )}
              <button className="primary-btn full" type="submit" disabled={loading}>
                {formMode === "edit" ? <Save size={18} /> : <Plus size={18} />}
                {loading ? "Saving..." : formMode === "edit" ? "Save quiz" : "Create quiz"}
              </button>
            </div>
          </form>
        </section>

        <section className="content-panel">
          <PanelTitle icon={<ClipboardList />} title="Add question" subtitle="Choose a quiz and add a new question." />
          <form className="form" onSubmit={addQuestion}>
            <label>
              Select quiz
              <select
                name="quizId"
                value={selectedQuizId}
                onChange={(event) => loadAdminQuiz(Number(event.target.value))}
                required
              >
                {quizOptions.length === 0 && <option value="">Create a quiz first</option>}
                {quizOptions.map((quiz) => (
                  <option value={quiz.value} key={quiz.value}>
                    {quiz.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Question text
              <textarea name="text" rows="3" placeholder="Write the question students will answer." required />
            </label>
            <div className="option-grid">
              {["A", "B", "C", "D"].map((label, index) => (
                <label key={label}>
                  Answer {label}
                  <input name={`option${index}`} type="text" required />
                </label>
              ))}
            </div>
            <label>
              Correct answer
              <select name="correctIndex" defaultValue="0">
                <option value="0">A</option>
                <option value="1">B</option>
                <option value="2">C</option>
                <option value="3">D</option>
              </select>
            </label>
            <button className="primary-btn full" type="submit" disabled={loading || quizOptions.length === 0}>
              <ClipboardList size={18} />
              {loading ? "Saving..." : "Add question"}
            </button>
          </form>
        </section>
      </div>

      <section className="content-panel">
        <PanelTitle icon={<BookOpen />} title="Quiz library" subtitle="Edit or remove quizzes available to students." />
        <div className="admin-quiz-table">
          {quizzes.length === 0 ? (
            <EmptyState title="No quizzes yet" text="Create the first quiz using the form above." />
          ) : (
            quizzes.map((quiz) => (
              <div className={`table-row ${selectedQuizId === quiz.id ? "selected" : ""}`} key={quiz.id}>
                <strong>{quiz.title}</strong>
                <span>{quiz.durationMinutes} min</span>
                <span>{quiz.questionCount} questions</span>
                <div className="row-actions">
                  <button className="mini-btn" onClick={() => startEditQuiz(quiz)} title="Edit quiz">
                    <Edit3 size={16} />
                  </button>
                  <button className="mini-btn danger" onClick={() => deleteQuiz(quiz.id)} title="Delete quiz">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="content-panel">
        <PanelTitle icon={<Edit3 />} title="Question editor" subtitle={`Selected: ${selectedQuizLabel}`} />
        {!adminQuizDetail ? (
          <EmptyState title="Select a quiz" text="Use the edit button in the quiz library to manage its questions." />
        ) : (
          <div className="manager-list">
            <div className="manager-heading">
              <div>
                <p className="kicker">Selected quiz</p>
                <h3>{adminQuizDetail.quiz.title}</h3>
              </div>
              <span className="badge">{adminQuizDetail.questions.length} questions</span>
            </div>
            {adminQuizDetail.questions.length === 0 ? (
              <EmptyState title="No questions yet" text="Use the add-question form above to build this quiz." />
            ) : (
              adminQuizDetail.questions.map((question, index) => (
                <article className="manage-question" key={question.id}>
                  {editingQuestionId === question.id && questionDraft ? (
                    <form className="form question-edit-form" onSubmit={(event) => submitQuestionEdit(event, question.id)}>
                      <label>
                        Question text
                        <textarea
                          rows="3"
                          value={questionDraft.text}
                          onChange={(event) => updateQuestionDraft("text", event.target.value)}
                          required
                        />
                      </label>
                      <div className="option-grid">
                        {["A", "B", "C", "D"].map((label, optionIndex) => (
                          <label key={label}>
                            Answer {label}
                            <input
                              type="text"
                              value={questionDraft[`option${optionIndex}`]}
                              onChange={(event) => updateQuestionDraft(`option${optionIndex}`, event.target.value)}
                              required
                            />
                          </label>
                        ))}
                      </div>
                      <label>
                        Correct answer
                        <select
                          value={questionDraft.correctIndex}
                          onChange={(event) => updateQuestionDraft("correctIndex", event.target.value)}
                        >
                          <option value="0">A</option>
                          <option value="1">B</option>
                          <option value="2">C</option>
                          <option value="3">D</option>
                        </select>
                      </label>
                      <div className="form-actions">
                        <button className="ghost-btn" type="button" onClick={cancelQuestionEdit}>
                          <X size={18} />
                          Cancel
                        </button>
                        <button className="primary-btn" type="submit" disabled={loading}>
                          <Save size={18} />
                          Save question
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="manage-question-head">
                        <h3>{index + 1}. {question.text}</h3>
                        <div className="row-actions">
                          <button className="mini-btn" onClick={() => startEditQuestion(question)} title="Edit question">
                            <Edit3 size={16} />
                          </button>
                          <button className="mini-btn danger" onClick={() => deleteQuestion(question.id, adminQuizDetail.quiz.id)} title="Delete question">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="manage-options">
                        {question.options.map((option, optionIndex) => (
                          <span className={option.correct ? "correct-option" : ""} key={option.id}>
                            <small>{String.fromCharCode(65 + optionIndex)}</small>
                            {option.text}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </section>
  );
}
