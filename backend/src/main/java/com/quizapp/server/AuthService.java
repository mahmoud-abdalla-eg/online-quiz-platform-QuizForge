package com.quizapp.server;

import com.quizapp.store.Database;
import com.sun.net.httpserver.HttpExchange;

import java.sql.SQLException;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class AuthService {
    private final Database database;
    private final Map<String, Database.User> sessions = new ConcurrentHashMap<>();

    public AuthService(Database database) {
        this.database = database;
    }

    public Database.User login(String email, String password) throws SQLException {
        Database.User user = database.findUserByEmailAndPassword(email, password)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));
        String token = UUID.randomUUID().toString();
        user.token = token;
        sessions.put(token, user);
        return user;
    }

    public Optional<Database.User> currentUser(HttpExchange exchange) {
        String header = exchange.getRequestHeaders().getFirst("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return Optional.empty();
        }
        return Optional.ofNullable(sessions.get(header.substring("Bearer ".length())));
    }

    public Database.User requireUser(HttpExchange exchange) {
        return currentUser(exchange).orElseThrow(() -> new SecurityException("Please log in first."));
    }

    public Database.User requireAdmin(HttpExchange exchange) {
        Database.User user = requireUser(exchange);
        if (!"ADMIN".equals(user.role)) {
            throw new SecurityException("Admin access required.");
        }
        return user;
    }
}
