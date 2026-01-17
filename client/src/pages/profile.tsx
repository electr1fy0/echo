import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuestionList } from "@/components/questions/question-list";
import { useQuestionsQuery, useDeleteQuestion } from "@/hooks/use-questions";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const INITIAL_USER = {
  name: "Ayush",
  email: "ayush@example.com",
  bio: "Full-stack developer | Open source enthusiast | Building cool things",
  avatar: "https://github.com/electr1fy0.png",
  stats: {
    answered: 42,
    posted: 12,
  },
};

export function Profile() {
  const [user, setUser] = useState(INITIAL_USER);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { data: questions = [], isLoading, error } = useQuestionsQuery(0, 10);
  const { mutate: deleteQuestion } = useDeleteQuestion();

  const [editForm, setEditForm] = useState(user);

  const handleSave = () => {
    setUser(editForm);
    setIsEditOpen(false);
  };

  return (
    <div className="max-w-xl w-full mt-20 space-y-8 mb-40 relative px-4 pb-20 md:pb-0">
      <div className="flex flex-col items-start gap-4">
        <div className="flex w-full justify-between items-start">
          <div className="size-24 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <img
              src={user.avatar}
              alt={user.name}
              className="size-full object-cover"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              setEditForm(user);
              setIsEditOpen(true);
            }}
          >
            <HugeiconsIcon icon={PencilEdit02Icon} className="mr-2 size-4" />
            Edit Profile
          </Button>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {user.name}
          </h1>
          <div className="flex items-center gap-2 text-neutral-500 text-sm">
            <HugeiconsIcon icon={Mail01Icon} className="size-4" />
            <span>{user.email}</span>
          </div>
        </div>

        <p className="text-neutral-600 dark:text-neutral-400 text-sm max-w-md whitespace-pre-wrap">
          {user.bio}
        </p>

        <div className="flex gap-6 pt-2">
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {user.stats.answered}
            </span>
            <span className="text-xs text-neutral-500">Answered</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {questions.length}
            </span>
            <span className="text-xs text-neutral-500">Posted</span>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800" />

      <div className="space-y-4">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
          Recent Activity
        </h3>

        {isLoading ? (
          <p className="text-neutral-500 text-sm">Loading activity...</p>
        ) : error ? (
          <p className="text-red-500 text-sm">Failed to load activity</p>
        ) : (
          <QuestionList
            questions={questions}
            onDelete={(id) => deleteQuestion(id)}
          />
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="select-text"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="bio" className="text-sm font-medium">
                Bio
              </label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                }
                className="h-24 select-text"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="avatar" className="text-sm font-medium">
                Avatar URL
              </label>
              <Input
                id="avatar"
                value={editForm.avatar}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, avatar: e.target.value }))
                }
                className="select-text"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
