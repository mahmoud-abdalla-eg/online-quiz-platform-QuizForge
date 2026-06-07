package com.quizapp.server;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public final class Json {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();

    private Json() {
    }

    public static <T> T read(HttpExchange exchange, Class<T> type) throws IOException {
        try (InputStreamReader reader = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)) {
            return GSON.fromJson(reader, type);
        }
    }

    public static void send(HttpExchange exchange, int statusCode, Object body) throws IOException {
        byte[] response = GSON.toJson(body).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(statusCode, response.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(response);
        }
    }

    public static void error(HttpExchange exchange, int statusCode, String message) throws IOException {
        send(exchange, statusCode, Map.of("error", message));
    }
}
