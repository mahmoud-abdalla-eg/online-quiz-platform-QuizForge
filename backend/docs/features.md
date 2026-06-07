# Online Quiz Platform Features

## Main User Roles

### Student

- Create a new account
- Log in
- View available quizzes
- Read quiz descriptions and question counts
- Take a multiple-choice quiz
- See quiz timer and answer progress
- Submit answers
- Receive automatic score
- View previous quiz attempts

### Admin

- Log in
- Create quizzes
- Set quiz duration
- Add questions
- Add four answer options
- Mark the correct option
- Inspect quiz questions
- Delete wrong questions
- Delete quizzes
- View quizzes in the same dashboard

## Data Source

- Java backend owns all application data
- MongoDB Atlas stores users, quizzes, embedded questions/options, attempts, and counters
- React does not use JSON files as a fake database

## Suggested Future Improvements

- Add quiz timer enforcement
- Add teacher dashboard charts
- Add password hashing
- Add question editing
- Add randomized questions
- Add PDF export for results
- Add chart visualizations for class performance
