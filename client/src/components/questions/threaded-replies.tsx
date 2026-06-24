import { useState, useMemo } from "react";
import type { AnswerItem } from "@/types";
import { ReplyItem } from "./reply-item";
import { ReplyForm } from "./reply-form";

type ThreadedRepliesProps = {
  replies: AnswerItem[];
  questionId: string;
  authorUsername: string;
  isAnonymousPost?: boolean;
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
  "border-sky-200 dark:border-sky-700",
  "border-emerald-200 dark:border-emerald-700",
  "border-amber-200 dark:border-amber-700",
  "border-violet-200 dark:border-violet-700",
  "border-rose-200 dark:border-rose-700",
  "border-cyan-200 dark:border-cyan-700",
];

const INDENT_PER_LEVEL = 0.75;
const INDENT_CAP = 5;

function TreeNodeComponent({
  node,
  depth,
  questionId,
  authorUsername,
  isAnonymousPost,
  onDelete,
}: {
  node: TreeNode;
  depth: number;
  questionId: string;
  authorUsername: string;
  isAnonymousPost?: boolean;
  onDelete: (replyId: string) => void;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const showIndent = depth > 0 && depth <= INDENT_CAP;
  const lineColor = depth > 0 ? depthColors[(depth - 1) % depthColors.length] : "";

  return (
    <div>
      <div style={{ marginLeft: showIndent ? `${INDENT_PER_LEVEL}rem` : undefined }}>
        <div
          className={depth > 0 ? `border-l ${lineColor}` : ""}
          style={{ paddingLeft: depth > 0 ? "0.5rem" : undefined }}
        >
          <ReplyItem
            answerItem={node.item}
            onDelete={() => onDelete(node.item.answer.uid)}
            canAccept={false}
            isOp={!isAnonymousPost && node.item.author?.username === authorUsername}
            onReply={() => setIsReplying(true)}
          />
        </div>
        {isReplying && (
          <div className="mb-2" style={{ marginTop: "0.5rem" }}>
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
                isAnonymousPost={isAnonymousPost}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ThreadedReplies({
  replies,
  questionId,
  authorUsername,
  isAnonymousPost,
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
          isAnonymousPost={isAnonymousPost}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
