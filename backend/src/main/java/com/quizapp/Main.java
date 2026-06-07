package com.quizapp;

import com.quizapp.server.ApiServer;
import com.quizapp.store.Database;

public class Main {
    public static void main(String[] args) throws Exception {
        Database database = new Database();
        database.initialize();

        if (args.length > 0 && "--seed-only".equals(args[0])) {
            System.out.println("MongoDB seed data is ready in database: " + database.databaseName());
            return;
        }

        ApiServer server = new ApiServer(database, 8080);
        server.start();
    }
}
