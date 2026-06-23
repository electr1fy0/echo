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

  return (
    <div>
      <div className={depth > 0 ? "ml-6 pl-3 border-l-2 border-neutral-100 dark:border-neutral-800" : ""}>
        <ReplyItem
          answerItem={node.item}
          onDelete={() => onDelete(node.item.answer.uid)}
          canAccept={false}
          isOp={node.item.author?.username === authorUsername}
          onReply={() => setIsReplying(true)}
        />
        {isReplying && (
          <div className="ml-8 mb-2">
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
      </div>
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
