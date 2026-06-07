export function buildAnswerFeedback(questions, answers) {
  return questions.map((question) => {
    const selectedOptionId = Number(answers[question.id]);
    const selectedOption = question.options.find((option) => option.id === selectedOptionId);
    const correctOption = question.options.find((option) => option.correct);
    const selectedAnswer = selectedOption?.text || "No answer selected";
    const correctAnswer = correctOption?.text || "Not available";
    const correct = selectedOptionId === correctOption?.id;

    return {
      questionId: question.id,
      selectedOptionId,
      correctOptionId: correctOption?.id || 0,
      selectedAnswer,
      correctAnswer,
      correct,
      explanation: correct
        ? "Correct."
        : explanationFor(question.text, correctAnswer, selectedAnswer)
    };
  });
}

function explanationFor(questionText, correctAnswer, selectedAnswer) {
  const normalized = (questionText || "").toLowerCase();

  if (normalized.includes("react hook stores component state")) {
    return `useState is the React hook designed to store and update state inside a function component. ${selectedAnswer} is not a React state hook.`;
  }
  if (normalized.includes("fetch() do in the frontend")) {
    return `fetch() is used by browser code to send HTTP requests and receive responses from a service. ${selectedAnswer} does not describe what fetch() does.`;
  }
  if (normalized.includes("jsx used for")) {
    return `JSX lets React components write interface markup inside JavaScript. ${selectedAnswer} is not the purpose of JSX.`;
  }
  if (normalized.includes("vite development server")) {
    return `npm run dev is the command used to start the local development server for the frontend. ${selectedAnswer} would not start that server.`;
  }
  if (normalized.includes("keyword is used to create a class")) {
    return `The class keyword declares a new class. ${selectedAnswer} is not the Java keyword for declaring a class.`;
  }
  if (normalized.includes("entry point of a java console program")) {
    return `main() is the method Java runs first when a console program starts. ${selectedAnswer} is not the standard entry point.`;
  }
  if (normalized.includes("file extension is used for java source files")) {
    return `.java files contain source code before it is compiled. ${selectedAnswer} is not the normal source-file extension.`;
  }
  if (normalized.includes("symbol ends most java statements")) {
    return `Most Java statements end with a semicolon. ${selectedAnswer} is not the standard statement terminator.`;
  }
  if (normalized.includes("what does oop stand for")) {
    return `OOP stands for Object-Oriented Programming, a style based on classes and objects. ${selectedAnswer} is not what OOP means.`;
  }
  if (normalized.includes("hides internal details")) {
    return `Encapsulation keeps internal data and behavior protected behind a public interface. ${selectedAnswer} does not describe hiding internal details.`;
  }
  if (normalized.includes("inherit another class")) {
    return `extends is used when one Java class inherits from another class. ${selectedAnswer} is not the inheritance keyword for classes.`;
  }
  if (normalized.includes("constructor used for")) {
    return `A constructor runs when an object is created and sets its initial state. ${selectedAnswer} is not what a constructor does.`;
  }
  if (normalized.includes("similar to a table in sql")) {
    return `A collection groups related documents, similar to how a table groups rows. ${selectedAnswer} is not the equivalent structure.`;
  }
  if (normalized.includes("format does mongodb use for records")) {
    return `MongoDB stores records as documents, which hold fields and values. ${selectedAnswer} is not the record format.`;
  }
  if (normalized.includes("stores submitted quiz results")) {
    return `Attempts are the records of submitted quizzes and scores. ${selectedAnswer} would not store quiz submissions.`;
  }
  if (normalized.includes("index on user email")) {
    return `An email index helps keep account emails unique and easy to find. ${selectedAnswer} is not why the email field is indexed.`;
  }

  return `Your answer was ${selectedAnswer}, but the answer key marks ${correctAnswer} as correct for this question.`;
}
