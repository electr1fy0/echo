import type { Answer } from "@/types";
import { useState } from "react";

export function useReplies() {
  const [replyContent, setReplyContent] = useState("");
  const [repliesByQid, setRepliesByQid] = useState<Record<string, Answer[]>>(
    {},
  );
  const [openQids, setOpenQids] = useState<string[]>([]);

  const submitReply = async (qid: string) => {
    const reply: Answer = { content: replyContent };
    if (!replyContent.trim()) return;
    const resp = await fetch(
      `http://localhost:8080/questions/${encodeURIComponent(qid)}/replies`,
      {
        method: "POST",
        body: JSON.stringify(reply),
        headers: { "Content-Type": "application/json" },
      },
    );
    console.log(await resp.text());
    console.log(replyContent);
  };
  const getReplies = async (qid: string) => {
    const resp = await fetch(
      `http://localhost:8080/questions/${encodeURIComponent(qid)}/replies`,
      {
        method: "GET",
      },
    );
    console.log(resp);
    const data = resp.json();

    return data;
  };

  return {
    submitReply,
    getReplies,
    setReplyContent,
    setRepliesByQid,
    openQids,
    repliesByQid,
    setOpenQids,
    replyContent,
  };
}
