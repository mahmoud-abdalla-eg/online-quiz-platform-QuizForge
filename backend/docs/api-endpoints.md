# API Endpoints

Base URL:

```text
http://localhost:8080
```

## Public

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Checks backend and MongoDB connection status |
| POST | `/api/register` | Creates a student account |
| POST | `/api/login` | Logs in admin or student |
| GET | `/api/quizzes` | Lists quizzes |
| GET | `/api/quizzes/{id}` | Gets quiz questions without correct answers |

## Student

Requires `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/me` | Gets current logged-in user |
| POST | `/api/attempts` | Submits quiz answers and calculates score |
| GET | `/api/attempts/mine` | Lists current student's attempts |

## Admin

Requires admin token.

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/quizzes` | Creates a quiz |
| DELETE | `/api/quizzes/{id}` | Deletes a quiz and related attempts |
| GET | `/api/admin/quizzes/{id}` | Gets quiz details with correct answers |
| POST | `/api/quizzes/{id}/questions` | Adds a question and answer options |
| DELETE | `/api/questions/{id}` | Deletes a question |
