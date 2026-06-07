package com.quizapp.store;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.FindOneAndUpdateOptions;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.ReturnDocument;
import com.mongodb.MongoWriteException;
import org.bson.Document;
import org.bson.conversions.Bson;

import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.mongodb.client.model.Filters.and;
import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Updates.inc;

public class Database {
    private final String connectionString;
    private final String databaseName;
    private MongoClient client;
    private MongoDatabase database;
    private MongoCollection<Document> users;
    private MongoCollection<Document> quizzes;
    private MongoCollection<Document> attempts;
    private MongoCollection<Document> counters;

    public Database() {
        this.connectionString = firstPresent(
                System.getenv("MONGODB_URI"),
                System.getProperty("mongodb.uri")
        );
        this.databaseName = firstPresent(
                System.getenv("MONGODB_DATABASE"),
                System.getProperty("mongodb.database"),
                "online_quiz_platform"
        );
    }

    public void initialize() throws SQLException, IOException {
        if (isBlank(connectionString)) {
            throw new IllegalStateException("MONGODB_URI is required. Set it to your MongoDB Atlas connection string.");
        }

        client = MongoClients.create(connectionString);
        database = client.getDatabase(databaseName);
        users = database.getCollection("users");
        quizzes = database.getCollection("quizzes");
        attempts = database.getCollection("attempts");
        counters = database.getCollection("counters");

        users.createIndex(new Document("email", 1), new IndexOptions().unique(true));
        quizzes.createIndex(new Document("createdAt", -1));
        attempts.createIndex(new Document("userId", 1).append("submittedAt", -1));

        DemoDataSeeder.seed(this);
    }

    public String databaseName() {
        return databaseName;
    }

    public long userCount() throws SQLException {
        return users.countDocuments();
    }

    public long quizCount() throws SQLException {
        return quizzes.countDocuments();
    }

    User ensureUser(String name, String email, String password, String role) throws SQLException {
        Optional<User> existing = findUserByEmail(email);
        if (existing.isPresent()) {
            return existing.get();
        }
        return createUser(name, email, password, role);
    }

    void ensureQuizWithQuestions(int adminId, String title, String description, int durationMinutes, List<SeedQuestion> seedQuestions) throws SQLException {
        ensureQuizWithQuestions(adminId, null, title, description, durationMinutes, seedQuestions);
    }

    void ensureQuizWithQuestions(int adminId, String legacyTitle, String title, String description, int durationMinutes, List<SeedQuestion> seedQuestions) throws SQLException {
        Document existing = quizzes.find(eq("title", title)).first();
        Document legacy = isBlank(legacyTitle) ? null : quizzes.find(eq("title", legacyTitle)).first();
        int quizId;
        if (existing == null) {
            if (legacy == null) {
                Quiz created = createQuiz(title, description, durationMinutes, adminId);
                quizId = created.id;
            } else {
                quizId = legacy.getInteger("_id");
                replaceQuiz(quizId, title, description, durationMinutes, seedQuestions);
                return;
            }
        } else {
            quizId = existing.getInteger("_id");
            if (!questionDocuments(existing).isEmpty()) {
                return;
            }
        }

        for (SeedQuestion question : seedQuestions) {
            createQuestion(quizId, question.text, question.options);
        }
    }

    public User createStudent(String name, String email, String password) throws SQLException {
        if (isBlank(name) || isBlank(email) || isBlank(password)) {
            throw new IllegalArgumentException("Name, email, and password are required.");
        }
        return createUser(name.trim(), email.trim().toLowerCase(), password, "STUDENT");
    }

    public User createTeacher(String name, String email, String password) throws SQLException {
        if (isBlank(name) || isBlank(email) || isBlank(password)) {
            throw new IllegalArgumentException("Name, email, and password are required.");
        }
        return createUser(name.trim(), email.trim().toLowerCase(), password, "ADMIN");
    }

    private User createUser(String name, String email, String password, String role) throws SQLException {
        int id = nextId("users");
        Document document = new Document("_id", id)
                .append("name", name)
                .append("email", email.toLowerCase())
                .append("password", password)
                .append("role", role)
                .append("createdAt", now());
        try {
            users.insertOne(document);
        } catch (MongoWriteException error) {
            throw new IllegalArgumentException("Email is already registered.");
        }
        return new User(id, name, email, role);
    }

    public Optional<User> findUserByEmailAndPassword(String email, String password) throws SQLException {
        Document document = users.find(and(
                eq("email", email == null ? "" : email.trim().toLowerCase()),
                eq("password", password == null ? "" : password)
        )).first();
        if (document == null) {
            return Optional.empty();
        }
        return Optional.of(userFrom(document));
    }

    private Optional<User> findUserByEmail(String email) throws SQLException {
        Document document = users.find(eq("email", email == null ? "" : email.trim().toLowerCase())).first();
        if (document == null) {
            return Optional.empty();
        }
        return Optional.of(userFrom(document));
    }

    public List<Quiz> listQuizzes() throws SQLException {
        List<Quiz> result = new ArrayList<>();
        for (Document document : quizzes.find().sort(new Document("createdAt", -1))) {
            result.add(quizFrom(document));
        }
        return result;
    }

    public Quiz createQuiz(String title, String description, int durationMinutes, int createdBy) throws SQLException {
        if (isBlank(title) || isBlank(description) || durationMinutes <= 0) {
            throw new IllegalArgumentException("Quiz title, description, and positive duration are required.");
        }

        int id = nextId("quizzes");
        String createdAt = now();
        Document document = new Document("_id", id)
                .append("title", title.trim())
                .append("description", description.trim())
                .append("durationMinutes", durationMinutes)
                .append("createdBy", createdBy)
                .append("createdAt", createdAt)
                .append("questions", new ArrayList<Document>());
        quizzes.insertOne(document);
        return new Quiz(id, title.trim(), description.trim(), durationMinutes, createdAt);
    }

    public Quiz updateQuiz(int quizId, String title, String description, int durationMinutes) throws SQLException {
        if (isBlank(title) || isBlank(description) || durationMinutes <= 0) {
            throw new IllegalArgumentException("Quiz title, description, and positive duration are required.");
        }
        Document update = new Document("$set", new Document("title", title.trim())
                .append("description", description.trim())
                .append("durationMinutes", durationMinutes));
        long matched = quizzes.updateOne(eq("_id", quizId), update).getMatchedCount();
        if (matched == 0) {
            throw new IllegalArgumentException("Quiz not found.");
        }
        return quizFrom(quizDocument(quizId));
    }

    public QuizDetail getQuizDetail(int quizId) throws SQLException {
        Document document = quizDocument(quizId);
        return quizDetailFrom(document, false);
    }

    public QuizDetail getQuizReviewDetail(int quizId) throws SQLException {
        Document document = quizDocument(quizId);
        return quizDetailFrom(document, true);
    }

    public QuizDetail getAdminQuizDetail(int quizId) throws SQLException {
        Document document = quizDocument(quizId);
        return quizDetailFrom(document, true);
    }

    public Question createQuestion(int quizId, String text, List<OptionInput> options) throws SQLException {
        validateQuestionInput(text, options);
        quizDocument(quizId);
        int questionId = nextId("questions");
        Question question = new Question(questionId, text.trim());
        List<Document> optionDocs = optionDocumentsFrom(options, question);

        Document questionDoc = new Document("id", questionId)
                .append("text", text.trim())
                .append("options", optionDocs);
        quizzes.updateOne(eq("_id", quizId), new Document("$push", new Document("questions", questionDoc)));
        return question;
    }

    public Question updateQuestion(int questionId, String text, List<OptionInput> options) throws SQLException {
        validateQuestionInput(text, options);
        Document quiz = quizzes.find(eq("questions.id", questionId)).first();
        if (quiz == null) {
            throw new IllegalArgumentException("Question not found.");
        }

        Question question = new Question(questionId, text.trim());
        List<Document> optionDocs = optionDocumentsFrom(options, question);
        Document update = new Document("$set", new Document("questions.$.text", text.trim())
                .append("questions.$.options", optionDocs));
        quizzes.updateOne(eq("questions.id", questionId), update);
        return question;
    }

    public void deleteQuiz(int quizId) throws SQLException {
        long deleted = quizzes.deleteOne(eq("_id", quizId)).getDeletedCount();
        if (deleted == 0) {
            throw new IllegalArgumentException("Quiz not found.");
        }
        attempts.deleteMany(eq("quizId", quizId));
    }

    public void deleteQuestion(int questionId) throws SQLException {
        Document quiz = quizzes.find(eq("questions.id", questionId)).first();
        if (quiz == null) {
            throw new IllegalArgumentException("Question not found.");
        }
        quizzes.updateOne(eq("_id", quiz.getInteger("_id")), new Document("$pull", new Document("questions", new Document("id", questionId))));
        attempts.updateMany(new Document(), new Document("$pull", new Document("answers", new Document("questionId", questionId))));
    }

    private void replaceQuiz(int quizId, String title, String description, int durationMinutes, List<SeedQuestion> seedQuestions) throws SQLException {
        List<Document> questionDocs = new ArrayList<>();
        for (SeedQuestion seedQuestion : seedQuestions) {
            Question question = new Question(nextId("questions"), seedQuestion.text.trim());
            List<Document> optionDocs = optionDocumentsFrom(seedQuestion.options, question);
            questionDocs.add(new Document("id", question.id)
                    .append("text", question.text)
                    .append("options", optionDocs));
        }
        quizzes.updateOne(eq("_id", quizId), new Document("$set", new Document("title", title.trim())
                .append("description", description.trim())
                .append("durationMinutes", durationMinutes)
                .append("questions", questionDocs)));
    }

    private void validateQuestionInput(String text, List<OptionInput> options) {
        if (isBlank(text) || options == null || options.size() < 2) {
            throw new IllegalArgumentException("A question needs text and at least two options.");
        }
        long correctCount = options.stream().filter(option -> option.correct).count();
        if (correctCount != 1) {
            throw new IllegalArgumentException("Each question must have exactly one correct option.");
        }
        for (OptionInput option : options) {
            if (option == null || isBlank(option.text)) {
                throw new IllegalArgumentException("Option text is required.");
            }
        }
    }

    private List<Document> optionDocumentsFrom(List<OptionInput> options, Question question) {
        List<Document> optionDocs = new ArrayList<>();
        for (OptionInput option : options) {
            int optionId = nextId("options");
            optionDocs.add(new Document("id", optionId)
                    .append("text", option.text.trim())
                    .append("correct", option.correct));
            question.options.add(new Option(optionId, option.text.trim(), option.correct));
        }
        return optionDocs;
    }

    public Attempt submitAttempt(int userId, int quizId, List<AnswerInput> answers) throws SQLException {
        if (answers == null || answers.isEmpty()) {
            throw new IllegalArgumentException("Please answer at least one question.");
        }

        Document quiz = quizDocument(quizId);
        List<Document> questions = questionDocuments(quiz);
        int totalQuestions = questions.size();
        if (totalQuestions == 0) {
            throw new IllegalArgumentException("This quiz has no questions yet.");
        }

        int score = 0;
        List<Document> answerDocs = new ArrayList<>();
        List<AnswerFeedback> feedback = new ArrayList<>();
        for (AnswerInput answer : answers) {
            boolean correct = isCorrectOption(questions, answer.questionId, answer.optionId);
            Document question = questionById(questions, answer.questionId);
            Document correctOption = question == null ? null : correctOptionDocument(question);
            Document selectedOption = question == null ? null : optionById(question, answer.optionId);
            String correctText = correctOption == null ? "Not available" : correctOption.getString("text");
            String selectedText = selectedOption == null ? "No answer selected" : selectedOption.getString("text");
            String questionText = question == null ? "" : question.getString("text");
            if (correct) {
                score++;
            }
            answerDocs.add(new Document("questionId", answer.questionId)
                    .append("optionId", answer.optionId)
                    .append("correct", correct));
            feedback.add(new AnswerFeedback(
                    answer.questionId,
                    answer.optionId,
                    correctOption == null ? 0 : correctOption.getInteger("id"),
                    selectedText,
                    correctText,
                    correct,
                    correct ? "Correct." : explanationFor(questionText, correctText, selectedText)
            ));
        }

        int attemptId = nextId("attempts");
        String submittedAt = now();
        attempts.insertOne(new Document("_id", attemptId)
                .append("userId", userId)
                .append("quizId", quizId)
                .append("score", score)
                .append("totalQuestions", totalQuestions)
                .append("submittedAt", submittedAt)
                .append("answers", answerDocs));

        Attempt attempt = new Attempt(attemptId, quizId, quiz.getString("title"), score, totalQuestions, submittedAt);
        attempt.feedback = feedback;
        return attempt;
    }

    public List<Attempt> listAttemptsForUser(int userId) throws SQLException {
        List<Attempt> result = new ArrayList<>();
        for (Document document : attempts.find(eq("userId", userId)).sort(new Document("submittedAt", -1))) {
            Document quiz = quizzes.find(eq("_id", document.getInteger("quizId"))).first();
            String quizTitle = quiz == null ? "Deleted quiz" : quiz.getString("title");
            result.add(new Attempt(
                    document.getInteger("_id"),
                    document.getInteger("quizId"),
                    quizTitle,
                    document.getInteger("score"),
                    document.getInteger("totalQuestions"),
                    document.getString("submittedAt")
            ));
        }
        return result;
    }

    private Document quizDocument(int quizId) {
        Document document = quizzes.find(eq("_id", quizId)).first();
        if (document == null) {
            throw new IllegalArgumentException("Quiz not found.");
        }
        return document;
    }

    private QuizDetail quizDetailFrom(Document document, boolean includeCorrect) {
        QuizDetail detail = new QuizDetail(quizFrom(document));
        for (Document questionDoc : questionDocuments(document)) {
            Question question = new Question(questionDoc.getInteger("id"), questionDoc.getString("text"));
            for (Document optionDoc : optionDocuments(questionDoc)) {
                question.options.add(new Option(
                        optionDoc.getInteger("id"),
                        optionDoc.getString("text"),
                        includeCorrect && optionDoc.getBoolean("correct", false)
                ));
            }
            detail.questions.add(question);
        }
        return detail;
    }

    private boolean isCorrectOption(List<Document> questions, int questionId, int optionId) {
        for (Document question : questions) {
            if (question.getInteger("id") == questionId) {
                for (Document option : optionDocuments(question)) {
                    if (option.getInteger("id") == optionId) {
                        return option.getBoolean("correct", false);
                    }
                }
            }
        }
        return false;
    }

    private Document questionById(List<Document> questions, int questionId) {
        for (Document question : questions) {
            if (question.getInteger("id") == questionId) {
                return question;
            }
        }
        return null;
    }

    private Document optionById(Document question, int optionId) {
        for (Document option : optionDocuments(question)) {
            if (option.getInteger("id") == optionId) {
                return option;
            }
        }
        return null;
    }

    private Document correctOptionDocument(Document question) {
        for (Document option : optionDocuments(question)) {
            if (option.getBoolean("correct", false)) {
                return option;
            }
        }
        return null;
    }

    private String explanationFor(String questionText, String correctAnswer, String selectedAnswer) {
        String normalized = questionText == null ? "" : questionText.toLowerCase();
        if (normalized.contains("react hook stores component state")) {
            return "useState is the React hook designed to store and update state inside a function component. " + selectedAnswer + " is not a React state hook.";
        }
        if (normalized.contains("fetch() do in the frontend")) {
            return "fetch() is used by browser code to send HTTP requests and receive responses from a service. " + selectedAnswer + " does not describe what fetch() does.";
        }
        if (normalized.contains("jsx used for")) {
            return "JSX lets React components write interface markup inside JavaScript. " + selectedAnswer + " is not the purpose of JSX.";
        }
        if (normalized.contains("vite development server")) {
            return "npm run dev is the command used to start the local development server for the frontend. " + selectedAnswer + " would not start that server.";
        }
        if (normalized.contains("keyword is used to create a class")) {
            return "The class keyword declares a new class. " + selectedAnswer + " is not the Java keyword for declaring a class.";
        }
        if (normalized.contains("entry point of a java console program")) {
            return "main() is the method Java runs first when a console program starts. " + selectedAnswer + " is not the standard entry point.";
        }
        if (normalized.contains("file extension is used for java source files")) {
            return ".java files contain source code before it is compiled. " + selectedAnswer + " is not the normal source-file extension.";
        }
        if (normalized.contains("symbol ends most java statements")) {
            return "Most Java statements end with a semicolon. " + selectedAnswer + " is not the standard statement terminator.";
        }
        if (normalized.contains("what does oop stand for")) {
            return "OOP stands for Object-Oriented Programming, a style based on classes and objects. " + selectedAnswer + " is not what OOP means.";
        }
        if (normalized.contains("hides internal details")) {
            return "Encapsulation keeps internal data and behavior protected behind a public interface. " + selectedAnswer + " does not describe hiding internal details.";
        }
        if (normalized.contains("inherit another class")) {
            return "extends is used when one Java class inherits from another class. " + selectedAnswer + " is not the inheritance keyword for classes.";
        }
        if (normalized.contains("constructor used for")) {
            return "A constructor runs when an object is created and sets its initial state. " + selectedAnswer + " is not what a constructor does.";
        }
        if (normalized.contains("similar to a table in sql")) {
            return "A collection groups related documents, similar to how a table groups rows. " + selectedAnswer + " is not the equivalent structure.";
        }
        if (normalized.contains("format does mongodb use for records")) {
            return "MongoDB stores records as documents, which hold fields and values. " + selectedAnswer + " is not the record format.";
        }
        if (normalized.contains("stores submitted quiz results")) {
            return "Attempts are the records of submitted quizzes and scores. " + selectedAnswer + " would not store quiz submissions.";
        }
        if (normalized.contains("index on user email")) {
            return "An email index helps keep account emails unique and easy to find. " + selectedAnswer + " is not why the email field is indexed.";
        }
        return "Your answer was " + selectedAnswer + ", but the answer key marks " + correctAnswer + " as correct for this question.";
    }

    private int nextId(String name) {
        Bson filter = eq("_id", name);
        FindOneAndUpdateOptions options = new FindOneAndUpdateOptions()
                .upsert(true)
                .returnDocument(ReturnDocument.AFTER);
        Document counter = counters.findOneAndUpdate(filter, inc("seq", 1), options);
        if (counter == null) {
            throw new IllegalStateException("Could not generate id for " + name);
        }
        return counter.getInteger("seq");
    }

    private User userFrom(Document document) {
        return new User(
                document.getInteger("_id"),
                document.getString("name"),
                document.getString("email"),
                document.getString("role")
        );
    }

    private Quiz quizFrom(Document document) {
        Quiz quiz = new Quiz(
                document.getInteger("_id"),
                document.getString("title"),
                document.getString("description"),
                document.getInteger("durationMinutes", 0),
                document.getString("createdAt")
        );
        quiz.questionCount = questionDocuments(document).size();
        return quiz;
    }

    @SuppressWarnings("unchecked")
    private List<Document> questionDocuments(Document quiz) {
        Object value = quiz.get("questions");
        if (value instanceof List<?>) {
            return (List<Document>) value;
        }
        return new ArrayList<>();
    }

    @SuppressWarnings("unchecked")
    private List<Document> optionDocuments(Document question) {
        Object value = question.get("options");
        if (value instanceof List<?>) {
            return (List<Document>) value;
        }
        return new ArrayList<>();
    }

    private String firstPresent(String... values) {
        for (String value : values) {
            if (!isBlank(value)) {
                return value;
            }
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String now() {
        return LocalDateTime.now().toString();
    }

    static class SeedQuestion {
        String text;
        List<OptionInput> options;

        SeedQuestion(String text, List<OptionInput> options) {
            this.text = text;
            this.options = options;
        }
    }

    public static class User {
        public int id;
        public String name;
        public String email;
        public String role;
        public String token;

        public User(int id, String name, String email, String role) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.role = role;
        }
    }

    public static class Quiz {
        public int id;
        public String title;
        public String description;
        public int durationMinutes;
        public String createdAt;
        public int questionCount;

        public Quiz(int id, String title, String description, int durationMinutes, String createdAt) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.durationMinutes = durationMinutes;
            this.createdAt = createdAt;
        }
    }

    public static class QuizDetail {
        public Quiz quiz;
        public List<Question> questions = new ArrayList<>();

        public QuizDetail(Quiz quiz) {
            this.quiz = quiz;
        }
    }

    public static class Question {
        public int id;
        public String text;
        public List<Option> options = new ArrayList<>();

        public Question(int id, String text) {
            this.id = id;
            this.text = text;
        }
    }

    public static class Option {
        public int id;
        public String text;
        public boolean correct;

        public Option(int id, String text) {
            this.id = id;
            this.text = text;
        }

        public Option(int id, String text, boolean correct) {
            this.id = id;
            this.text = text;
            this.correct = correct;
        }
    }

    public static class OptionInput {
        public String text;
        public boolean correct;

        public OptionInput(String text, boolean correct) {
            this.text = text;
            this.correct = correct;
        }
    }

    public static class AnswerInput {
        public int questionId;
        public int optionId;
    }

    public static class Attempt {
        public int id;
        public int quizId;
        public String quizTitle;
        public int score;
        public int totalQuestions;
        public String submittedAt;
        public List<AnswerFeedback> feedback = new ArrayList<>();

        public Attempt(int id, int quizId, String quizTitle, int score, int totalQuestions, String submittedAt) {
            this.id = id;
            this.quizId = quizId;
            this.quizTitle = quizTitle;
            this.score = score;
            this.totalQuestions = totalQuestions;
            this.submittedAt = submittedAt;
        }
    }

    public static class AnswerFeedback {
        public int questionId;
        public int selectedOptionId;
        public int correctOptionId;
        public String selectedAnswer;
        public String correctAnswer;
        public boolean correct;
        public String explanation;

        public AnswerFeedback(int questionId, int selectedOptionId, int correctOptionId, String selectedAnswer, String correctAnswer, boolean correct, String explanation) {
            this.questionId = questionId;
            this.selectedOptionId = selectedOptionId;
            this.correctOptionId = correctOptionId;
            this.selectedAnswer = selectedAnswer;
            this.correctAnswer = correctAnswer;
            this.correct = correct;
            this.explanation = explanation;
        }
    }
}
