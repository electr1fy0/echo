import type { Conversation, QuestionDraft, QuestionItem } from "@/types";
import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";

export async function fetchQuestion(questionId: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}`,
    {
      headers: {
        ...getAuthHeaders(),
      },
    },
  );
  if (!res.ok) throw new Error("Failed to fetch question");
  return res.json() as Promise<QuestionItem>;
}

export async function fetchQuestions(
  sort?: "votes" | "time_created" | "hot",
  filter?: "joined",
  chamberId?: string,
  author?: string,
  limit?: number,
  offset?: number,
  postType?: string,
  pinned?: boolean,
  searchQuery?: string,
  channelUid?: string,
  channelName?: string,
) {
  const params = new URLSearchParams({
    ...(sort ? { sort } : {}),
    ...(filter ? { filter } : {}),
    ...(chamberId ? { chamber_uid: chamberId } : {}),
    ...(author ? { author } : {}),
    ...(limit !== undefined ? { limit: limit.toString() } : {}),
    ...(offset !== undefined ? { offset: offset.toString() } : {}),
    ...(postType ? { post_type: postType } : {}),
    ...(pinned !== undefined ? { pinned: pinned.toString() } : {}),
    ...(searchQuery ? { q: searchQuery } : {}),
    ...(channelUid ? { channel_uid: channelUid } : {}),
    ...(channelName ? { channel_name: channelName } : {}),
  });
  const res = await fetch(`${API_URL}/questions?${params}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch questions");
  return res.json() as Promise<QuestionItem[]>;
}

export async function fetchUserQuestions(limit?: number, offset?: number) {
  const params = new URLSearchParams({
    ...(limit !== undefined ? { limit: limit.toString() } : {}),
    ...(offset !== undefined ? { offset: offset.toString() } : {}),
  });
  const res = await fetch(`${API_URL}/users/me/questions?${params}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch user questions");
  return res.json() as Promise<QuestionItem[]>;
}

export async function createQuestion(draft: QuestionDraft) {
  const res = await fetch(`${API_URL}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(draft),
  });
  if (!res.ok) throw new Error("Failed to create question");
}

export async function deleteQuestion(questionId: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    },
  );
  if (!res.ok) throw new Error("Failed to delete question");
}

export async function searchQuestions(query: string) {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`${API_URL}/questions/search?${params}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to search questions");
  return res.json() as Promise<QuestionItem[]>;
}

export async function updateVotes(qid: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(qid)}/votes`,
    {
      method: "post",
      headers: {
        ...getAuthHeaders(),
      },
    },
  );
  if (!res.ok) throw new Error("Failed to update votes");
}

export async function updateQuestion(
  questionId: string,
  payload: {
    content?: string;
    tradePrice?: number;
    tradeCondition?: string;
    tradeBookIsbn?: string;
    tradeStatus?: string;
    partnerSlotsNeeded?: number;
    partnerStatus?: string;
    partnerTargetGrade?: string;
    partnerWorkstyle?: string;
    taxiDeparture?: string;
    taxiDestination?: string;
    taxiDatetime?: string;
    taxiSeatsAvailable?: number;
    taxiStatus?: string;
  }
) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error("Failed to update question");
}

export async function pinQuestion(questionId: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}/pin`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
    }
  );
  if (!res.ok) throw new Error("Failed to pin question");
}

export async function unpinQuestion(questionId: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}/pin`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    }
  );
  if (!res.ok) throw new Error("Failed to unpin question");
}

export async function expressInterest(questionId: string, message?: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}/interest`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ message }),
    }
  );
  if (!res.ok) throw new Error("Failed to express interest");
}

export async function expressInterestViaDM(authorUsername: string, templateMessage: string) {
  const convRes = await fetch(`${API_URL}/dms/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ username: authorUsername }),
  });
  if (!convRes.ok) {
    const data = await convRes.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Failed to create conversation");
  }
  const conv = await convRes.json() as Conversation;

  const msgRes = await fetch(`${API_URL}/dms/conversations/${conv.uid}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ content: templateMessage }),
  });
  if (!msgRes.ok) throw new Error("Failed to send message");

  return conv;
}

export async function applyToPartner(questionId: string, pitch: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}/apply`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ pitch }),
    }
  );
  if (!res.ok) throw new Error("Failed to apply to partner project");
  return res.json() as Promise<{ uid: string }>;
}

export async function fetchPartnerApplications(questionId: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}/applications`,
    {
      headers: {
        ...getAuthHeaders(),
      },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch partner applications");
  return res.json() as Promise<any[]>;
}

export async function votePoll(questionId: string, optionIndex: number) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}/poll/vote`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ optionIndex }),
    }
  );
  if (!res.ok) throw new Error("Failed to vote on poll");
}

export async function updatePartnerApplicationStatus(
  questionId: string,
  appUid: string,
  status: "accepted" | "declined"
) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}/applications/${encodeURIComponent(appUid)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    }
  );
  if (!res.ok) throw new Error(`Failed to update application status to ${status}`);
}
