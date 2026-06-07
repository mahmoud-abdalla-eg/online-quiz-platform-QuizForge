package com.quizapp.server;

import com.quizapp.store.Database;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

public class ApiServer {
    private final Database database;
    private final AuthService authService;
    private final HttpServer server;

    public ApiServer(Database database, int port) throws IOException {
        this.database = database;
        this.authService = new AuthService(database);
        this.server = HttpServer.create(new InetSocketAddress(port), 0);
        this.server.createContext("/api", this::handleApi);
    }

    public void start() {
        server.start();
        System.out.println("Online Quiz Platform API is running at http://localhost:8080");
    }

    private void handleApi(HttpExchange exchange) throws IOException {
        try {
            addCorsHeaders(exchange);
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();

            if (method.equals("GET") && path.equals("/api/health")) {
                health(exchange);
            } else if (method.equals("POST") && path.equals("/api/register")) {
                register(exchange);
            } else if (method.equals("POST") && path.equals("/api/teachers/register")) {
                registerTeacher(exchange);
            } else if (method.equals("POST") && path.equals("/api/login")) {
                login(exchange);
            } else if (method.equals("GET") && path.equals("/api/me")) {
                me(exchange);
            } else if (method.equals("GET") && path.equals("/api/quizzes")) {
                Json.send(exchange, 200, database.listQuizzes());
            } else if (method.equals("POST") && path.equals("/api/quizzes")) {
                createQuiz(exchange);
            } else if (method.equals("PUT") && path.matches("/api/quizzes/\\d+")) {
                updateQuiz(exchange, idFromPath(path));
            } else if (method.equals("DELETE") && path.matches("/api/quizzes/\\d+")) {
                deleteQuiz(exchange, idFromPath(path));
            } else if (method.equals("GET") && path.matches("/api/quizzes/\\d+")) {
                quizDetail(exchange, idFromPath(path));
            } else if (method.equals("GET") && path.matches("/api/quizzes/\\d+/review")) {
                quizReview(exchange, quizIdFromReviewPath(path));
            } else if (method.equals("GET") && path.matches("/api/admin/quizzes/\\d+")) {
                adminQuizDetail(exchange, idFromPath(path));
            } else if (method.equals("POST") && path.matches("/api/quizzes/\\d+/questions")) {
                createQuestion(exchange, quizIdFromQuestionPath(path));
            } else if (method.equals("PUT") && path.matches("/api/questions/\\d+")) {
                updateQuestion(exchange, idFromPath(path));
            } else if (method.equals("DELETE") && path.matches("/api/questions/\\d+")) {
                deleteQuestion(exchange, idFromPath(path));
            } else if (method.equals("POST") && path.equals("/api/attempts")) {
                submitAttempt(exchange);
            } else if (method.equals("GET") && path.equals("/api/attempts/mine")) {
                myAttempts(exchange);
            } else {
                Json.error(exchange, 404, "API endpoint not found.");
            }
        } catch (IllegalArgumentException error) {
            Json.error(exchange, 400, error.getMessage());
        } catch (SecurityException error) {
            Json.error(exchange, 401, error.getMessage());
        } catch (SQLException error) {
            error.printStackTrace();
            Json.error(exchange, 500, "Database error: " + error.getMessage());
        } catch (RuntimeException error) {
            error.printStackTrace();
            Json.error(exchange, 500, "Server error: " + error.getMessage());
        } finally {
            exchange.close();
        }
    }

    private void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private int idFromPath(String path) {
        String[] parts = path.split("/");
        return Integer.parseInt(parts[parts.length - 1]);
    }

    private int quizIdFromQuestionPath(String path) {
        String[] parts = path.split("/");
        return Integer.parseInt(parts[3]);
    }

    private int quizIdFromReviewPath(String path) {
        String[] parts = path.split("/");
        return Integer.parseInt(parts[3]);
    }

    private void register(HttpExchange exchange) throws IOException, SQLException {
        RegisterRequest request = Json.read(exchange, RegisterRequest.class);
        Database.User user = database.createStudent(request.name, request.email, request.password);
        Json.send(exchange, 201, Map.of("id", user.id, "name", user.name, "email", user.email, "role", user.role));
    }

    private void registerTeacher(HttpExchange exchange) throws IOException, SQLException {
        RegisterRequest request = Json.read(exchange, RegisterRequest.class);
        Database.User user = database.createTeacher(request.name, request.email, request.password);
        Json.send(exchange, 201, Map.of("id", user.id, "name", user.name, "email", user.email, "role", user.role));
    }

    private void login(HttpExchange exchange) throws IOException, SQLException {
        LoginRequest request = Json.read(exchange, LoginRequest.class);
        Database.User user = authService.login(request.email, request.password);
        Json.send(exchange, 200, user);
    }

    private void me(HttpExchange exchange) throws IOException {
        Json.send(exchange, 200, authService.requireUser(exchange));
    }

    private void health(HttpExchange exchange) throws IOException, SQLException {
        Json.send(exchange, 200, Map.of(
                "status", "ok",
                "database", database.databaseName(),
                "users", database.userCount(),
                "quizzes", database.quizCount()
        ));
    }

    private void createQuiz(HttpExchange exchange) throws IOException, SQLException {
        Database.User admin = authService.requireAdmin(exchange);
        QuizRequest request = Json.read(exchange, QuizRequest.class);
        Json.send(exchange, 201, database.createQuiz(request.title, request.description, request.durationMinutes, admin.id));
    }

    private void updateQuiz(HttpExchange exchange, int quizId) throws IOException, SQLException {
        authService.requireAdmin(exchange);
        QuizRequest request = Json.read(exchange, QuizRequest.class);
        Json.send(exchange, 200, database.updateQuiz(quizId, request.title, request.description, request.durationMinutes));
    }

    private void quizDetail(HttpExchange exchange, int quizId) throws IOException, SQLException {
        Json.send(exchange, 200, database.getQuizDetail(quizId));
    }

    private void quizReview(HttpExchange exchange, int quizId) throws IOException, SQLException {
        authService.requireUser(exchange);
        Json.send(exchange, 200, database.getQuizReviewDetail(quizId));
    }

    private void adminQuizDetail(HttpExchange exchange, int quizId) throws IOException, SQLException {
        authService.requireAdmin(exchange);
        Json.send(exchange, 200, database.getAdminQuizDetail(quizId));
    }

    private void createQuestion(HttpExchange exchange, int quizId) throws IOException, SQLException {
        authService.requireAdmin(exchange);
        QuestionRequest request = Json.read(exchange, QuestionRequest.class);
        Json.send(exchange, 201, database.createQuestion(quizId, request.text, request.options));
    }

    private void updateQuestion(HttpExchange exchange, int questionId) throws IOException, SQLException {
        authService.requireAdmin(exchange);
        QuestionRequest request = Json.read(exchange, QuestionRequest.class);
        Json.send(exchange, 200, database.updateQuestion(questionId, request.text, request.options));
    }

    private void deleteQuiz(HttpExchange exchange, int quizId) throws IOException, SQLException {
        authService.requireAdmin(exchange);
        database.deleteQuiz(quizId);
        Json.send(exchange, 200, Map.of("deleted", true));
    }

    private void deleteQuestion(HttpExchange exchange, int questionId) throws IOException, SQLException {
        authService.requireAdmin(exchange);
        database.deleteQuestion(questionId);
        Json.send(exchange, 200, Map.of("deleted", true));
    }

    private void submitAttempt(HttpExchange exchange) throws IOException, SQLException {
        Database.User student = authService.requireUser(exchange);
        AttemptRequest request = Json.read(exchange, AttemptRequest.class);
        Json.send(exchange, 201, database.submitAttempt(student.id, request.quizId, request.answers));
    }

    private void myAttempts(HttpExchange exchange) throws IOException, SQLException {
        Database.User student = authService.requireUser(exchange);
        Json.send(exchange, 200, database.listAttemptsForUser(student.id));
    }

    static class RegisterRequest {
        String name;
        String email;
        String password;
    }

    static class LoginRequest {
        String email;
        String password;
    }

    static class QuizRequest {
        String title;
        String description;
        int durationMinutes;
    }

    static class QuestionRequest {
        String text;
        List<Database.OptionInput> options;
    }

    static class AttemptRequest {
        int quizId;
        List<Database.AnswerInput> answers;
    }
}
