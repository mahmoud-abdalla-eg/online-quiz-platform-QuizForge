package com.quizapp.store;

import java.sql.SQLException;
import java.util.List;

final class DemoDataSeeder {
    private DemoDataSeeder() {
    }

    static void seed(Database database) throws SQLException {
        Database.User admin = database.ensureUser("Admin Teacher", "admin@quiz.com", "admin123", "ADMIN");
        database.ensureUser("Demo Student", "student@quiz.com", "student123", "STUDENT");
        database.ensureUser("Amina Hassan", "amina@student.com", "student123", "STUDENT");

        seedEnglishPractice(database, admin.id);
        seedMathPractice(database, admin.id);
        seedSciencePractice(database, admin.id);
        seedWorldKnowledge(database, admin.id);
    }

    private static void seedEnglishPractice(Database database, int adminId) throws SQLException {
        database.ensureQuizWithQuestions(adminId, "Java Basics Quiz", "English Grammar Practice",
                "A short practice quiz about everyday grammar and sentence structure.",
                15,
                List.of(
                        question("Which sentence is written correctly?",
                                option("She goes to class every morning.", true),
                                option("She go to class every morning.", false),
                                option("She going to class every morning.", false),
                                option("She gone to class every morning.", false)),
                        question("Choose the correct past tense of 'write'.",
                                option("wrote", true),
                                option("writed", false),
                                option("writing", false),
                                option("writtening", false)),
                        question("Which word is an adjective?",
                                option("bright", true),
                                option("quickly", false),
                                option("run", false),
                                option("desk", false)),
                        question("Which punctuation mark ends a question?",
                                option("Question mark", true),
                                option("Comma", false),
                                option("Colon", false),
                                option("Apostrophe", false))
                ));
    }

    private static void seedMathPractice(Database database, int adminId) throws SQLException {
        database.ensureQuizWithQuestions(adminId, "Object-Oriented Programming", "Math Skills Check",
                "Practice arithmetic, fractions, and simple problem solving.",
                20,
                List.of(
                        question("What is 12 x 4?",
                                option("48", true),
                                option("44", false),
                                option("52", false),
                                option("36", false)),
                        question("Which fraction is equal to one half?",
                                option("2/4", true),
                                option("1/3", false),
                                option("3/5", false),
                                option("4/6", false)),
                        question("What is 25% of 80?",
                                option("20", true),
                                option("25", false),
                                option("40", false),
                                option("60", false)),
                        question("If a notebook costs 6 yuan, how much do 3 notebooks cost?",
                                option("18 yuan", true),
                                option("12 yuan", false),
                                option("15 yuan", false),
                                option("24 yuan", false))
                ));
    }

    private static void seedSciencePractice(Database database, int adminId) throws SQLException {
        database.ensureQuizWithQuestions(adminId, "JavaScript and React Fundamentals", "Science Review",
                "Review basic science facts about matter, energy, and living things.",
                18,
                List.of(
                        question("What do plants need to make food?",
                                option("Sunlight", true),
                                option("Plastic", false),
                                option("Smoke", false),
                                option("Sand only", false)),
                        question("Which state of matter has a fixed shape?",
                                option("Solid", true),
                                option("Liquid", false),
                                option("Gas", false),
                                option("Steam", false)),
                        question("Which organ pumps blood through the body?",
                                option("Heart", true),
                                option("Lung", false),
                                option("Stomach", false),
                                option("Kidney", false)),
                        question("What force pulls objects toward Earth?",
                                option("Gravity", true),
                                option("Friction only", false),
                                option("Sound", false),
                                option("Light", false))
                ));
    }

    private static void seedWorldKnowledge(Database database, int adminId) throws SQLException {
        database.ensureQuizWithQuestions(adminId, "MongoDB Data Model", "World Knowledge",
                "A quick general knowledge quiz for classroom practice.",
                16,
                List.of(
                        question("Which continent is Egypt in?",
                                option("Africa", true),
                                option("Europe", false),
                                option("Asia", false),
                                option("South America", false)),
                        question("How many days are in a leap year?",
                                option("366", true),
                                option("365", false),
                                option("364", false),
                                option("360", false)),
                        question("Which ocean is the largest?",
                                option("Pacific Ocean", true),
                                option("Atlantic Ocean", false),
                                option("Indian Ocean", false),
                                option("Arctic Ocean", false)),
                        question("Which language is spoken in Brazil?",
                                option("Portuguese", true),
                                option("Spanish", false),
                                option("French", false),
                                option("Italian", false))
                ));
    }

    private static Database.SeedQuestion question(String text, Database.OptionInput... options) {
        return new Database.SeedQuestion(text, List.of(options));
    }

    private static Database.OptionInput option(String text, boolean correct) {
        return new Database.OptionInput(text, correct);
    }
}
