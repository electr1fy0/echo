import { useState, useMemo } from "react";
import type { AnswerItem } from "@/types";
import { ReplyItem } from "./reply-item";
import { ReplyForm } from "./reply-form";

type ThreadedRepliesProps = {
  replies: AnswerItem[];
  questionId: string;
  authorUsername: string;
  onDelete: (replyId: string) => void;
};

type TreeNode = {
  item: AnswerItem;
  children: TreeNode[];
};

function buildTree(replies: AnswerItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const reply of replies) {
    map.set(reply.answer.uid, { item: reply, children: [] });
  }

  for (const reply of replies) {
    const node = map.get(reply.answer.uid)!;
    const parentId = reply.answer.parentReplyUid;
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

const depthColors = [
  "border-sky-300 dark:border-sky-600",
  "border-emerald-300 dark:border-emerald-600",
  "border-amber-300 dark:border-amber-600",
  "border-violet-300 dark:border-violet-600",
  "border-rose-300 dark:border-rose-600",
  "border-cyan-300 dark:border-cyan-600",
];

function TreeNodeComponent({
  node,
  depth,
  questionId,
  authorUsername,
  onDelete,
}: {
  node: TreeNode;
  depth: number;
  questionId: string;
  authorUsername: string;
  onDelete: (replyId: string) => void;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const indentLevel = Math.min(depth, 6);
  const indent = indentLevel * 1.25;
  const lineColor = depth > 0 ? depthColors[(depth - 1) % depthColors.length] : "";

  return (
    <div style={{ marginLeft: depth > 0 ? `${indent}rem` : undefined }}>
      <div className={depth > 0 ? `border-l-2 ${lineColor}` : ""}>
        <div style={{ paddingLeft: depth > 0 ? "0.75rem" : undefined }}>
          <ReplyItem
            answerItem={node.item}
            onDelete={() => onDelete(node.item.answer.uid)}
            canAccept={false}
            isOp={node.item.author?.username === authorUsername}
            onReply={() => setIsReplying(true)}
          />
        </div>
      </div>
      {isReplying && (
        <div className="mb-2" style={{ paddingLeft: depth > 0 ? "1rem" : undefined, marginTop: "0.5rem" }}>
          <ReplyForm
            questionId={questionId}
            parentReplyUid={node.item.answer.uid}
            replyingToUsername={node.item.author?.username}
            compact
            onSubmitSuccess={() => setIsReplying(false)}
            onCancel={() => setIsReplying(false)}
          />
        </div>
      )}
      {node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.item.answer.uid}
              node={child}
              depth={depth + 1}
              questionId={questionId}
              authorUsername={authorUsername}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ThreadedReplies({
  replies,
  questionId,
  authorUsername,
  onDelete,
}: ThreadedRepliesProps) {
  const tree = useMemo(() => buildTree(replies), [replies]);

  return (
    <div className="space-y-0">
      {tree.map((node) => (
        <TreeNodeComponent
          key={node.item.answer.uid}
          node={node}
          depth={0}
          questionId={questionId}
          authorUsername={authorUsername}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
