# QuizForge Online Quiz Platform

QuizForge is an online quiz website with separate student and teacher areas.
Students can sign up, take quizzes, and review scores. Teachers can create quiz
sets, add multiple-choice questions, mark correct answers, and manage the quiz
library.

Live website:

```text
https://online-quiz-platform-quiz-forge.vercel.app/
```

To use the hosted website, download this project and run the Java backend on
your computer first. The Vercel website is the frontend, and it needs the local
backend API running at `http://localhost:8080` for login, quizzes, teacher tools,
and MongoDB data.

## Features

- Student signup and student login
- Separate teacher signup and teacher login
- Teacher dashboard for creating and editing quizzes
- Teacher tools for adding, editing, and deleting questions
- Public quiz listing on the home page
- Quiz ready screen before the timer starts
- Timed quiz attempts
- Automatic scoring after submission
- Correct/wrong answer feedback with explanations
- Student attempt history
- Contact form on the home page
- Automatic sign-out if the backend connection is lost
- Demo data seeding for first-time setup

## Demo Accounts

```text
Teacher: admin@quiz.com / admin123
Student: student@quiz.com / student123
```

You can also create new teacher and student accounts from the website.

## Use The Website

1. Download or clone this project.
2. Install Java JDK and Maven.
3. Create `backend/.env` from `backend/.env.example`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/
MONGODB_DATABASE=online_quiz_platform
```

4. Run the backend:

```powershell
powershell -ExecutionPolicy Bypass -File backend/run-backend.ps1
```

5. Open the hosted website:

```text
https://online-quiz-platform-quiz-forge.vercel.app/
```

The backend must stay running while using the website.

## Project Structure

```text
Project 2/
|-- README.md
|-- backend/
|   |-- .env.example
|   |-- .gitignore
|   |-- pom.xml
|   |-- run-backend.ps1
|   |-- docs/
|   |   |-- api-endpoints.md
|   |   |-- database-schema.md
|   |   `-- features.md
|   `-- src/
|       `-- main/
|           `-- java/
|               `-- com/
|                   `-- quizapp/
|                       |-- Main.java
|                       |-- server/
|                       |   |-- ApiServer.java
|                       |   |-- AuthService.java
|                       |   `-- Json.java
|                       `-- store/
|                           |-- Database.java
|                           `-- DemoDataSeeder.java
`-- frontend/
    |-- index.html
    |-- package.json
    |-- vite.config.js
    `-- src/
        |-- App.jsx
        |-- main.jsx
        |-- styles.css
        |-- components/
        |   |-- admin/
        |   |-- auth/
        |   |-- dashboard/
        |   |-- home/
        |   |-- layout/
        |   |-- quiz/
        |   `-- shared/
        `-- utils/
```

## Backend Setup

Manual backend commands:

```bash
cd backend
mvn package
java -jar target/online-quiz-platform-1.0.0.jar
```

The backend runs at:

```text
http://localhost:8080
```

Health check:

```text
http://localhost:8080/api/health
```

Seed/check demo data without starting the server:

```bash
cd backend
mvn package
java -jar target/online-quiz-platform-1.0.0.jar --seed-only
```

## Frontend Setup

Install and run the frontend locally:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The frontend calls the backend at `http://localhost:8080` by default. To change
it, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080
```

## API Summary

```text
GET    /api/health
POST   /api/register
POST   /api/teachers/register
POST   /api/login
GET    /api/me

GET    /api/quizzes
POST   /api/quizzes
PUT    /api/quizzes/{id}
DELETE /api/quizzes/{id}
GET    /api/quizzes/{id}
GET    /api/quizzes/{id}/review
GET    /api/admin/quizzes/{id}

POST   /api/quizzes/{id}/questions
PUT    /api/questions/{id}
DELETE /api/questions/{id}

POST   /api/attempts
GET    /api/attempts/mine
```

## Notes

- Students use the student login page.
- Teachers use the teacher login page.
- Teacher signup creates an account with teacher permissions.
- If the backend stops while a user is logged in, the frontend signs the user out
  automatically to avoid a broken session.
