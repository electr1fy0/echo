import { useEffect, useState } from "react";
import type { Question } from "@/types";

export function useQuestions() {
  const [question, setQuestion] = useState<Question>({
    title: "",
    content: "",
  });

  const limit = 10,
    offset = 0;

  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
  });
  const [questions, setQuestions] = useState<Question[]>([]);

  const updateQuestion = (fields: Partial<Question>) => {
    setQuestion((prev) => {
      return { ...prev, ...fields };
    });
  };

  const fetchQuestions = async () => {
    const resp = await fetch(
      `http://localhost:8080/questions?${params.toString()}`,
    );

    const data = await resp.json();
    setQuestions(data);
    console.log(data);
  };

  const submitQuestion = async () => {
    await fetch("http://localhost:8080/questions", {
      method: "POST",
      body: JSON.stringify(question),
      headers: { "Content-Type": "application/json" },
    });
    fetchQuestions();
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  return {
    fetchQuestions,
    submitQuestion,
    updateQuestion,
    question,
    questions,
  };
}
