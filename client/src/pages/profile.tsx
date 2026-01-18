import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuestionList } from "@/components/questions/question-list";
import {
  useUserQuestionsQuery,
  useDeleteQuestion,
} from "@/hooks/use-questions";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  PencilEdit02Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
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
import { useFetchProfile, useUpdateProfile } from "@/hooks/use-profile";
import type { User } from "@/types";
import { useListChambers } from "@/hooks/use-chamber";
import { CreateChamberDialog } from "@/components/chambers/create-chamber-dialog";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";

export function Profile() {
  const {
    data: user,
    isLoading: isProfileLoading,
    error: profileError,
  } = useFetchProfile();
  const { mutate: updateProfile } = useUpdateProfile();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [createChamberOpen, setCreateChamberOpen] = useState(false);
  const {
    data: questions = [],
    isLoading: isQnLoading,
    error: qnError,
  } = useUserQuestionsQuery(0, 10);

  const { mutate: deleteQuestion } = useDeleteQuestion();

  const [editForm, setEditForm] = useState<User>({
    username: "",
    email: "",
    bio: "",
    avatar: "",
    answered: 0,
    posted: 0,
  });

  const { data: chambers = [] } = useListChambers();
  const JOINED_CHAMBERS = chambers.filter((c) => c.isJoined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(editForm);
    setIsEditOpen(false);
  };

  const updateDraft = (fields: Partial<User>) => {
    setEditForm((prev) => {
      return { ...prev, ...fields };
    });
  };

  if (isProfileLoading) {
    return (
      <div className="mt-20 text-sm text-neutral-500">Loading profile…</div>
    );
  }

  if (profileError || !user) {
    return (
      <div className="mt-20 text-sm text-red-500">Failed to load profile</div>
    );
  }

  return (
    <div className="max-w-[40rem] w-full mt-24 space-y-8 mb-40 relative px-4 pb-20 md:pb-0">
      <div className="flex flex-col items-start gap-4">
        <div className="flex w-full justify-between items-start">
          <UserAvatar
            src={user.avatar}
            name={user.username}
            className="size-24"
          />
          <div className="flex gap-2">
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
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {user.username}
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
              {user.answered}
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
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
            My Chambers
          </h3>
          <Button
            variant="outline"
            size="default"
            className="h-7 text-xs gap-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            onClick={() => setCreateChamberOpen(true)}
          >
            <HugeiconsIcon icon={Add01Icon} className="size-3" />
            Create Chamber
          </Button>
        </div>
        {JOINED_CHAMBERS.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {JOINED_CHAMBERS.map((chamber, i) => (
              <a
                key={chamber.uid || i}
                href={`/chamber/${chamber.uid}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div
                  className={cn(
                    "size-4 rounded-md",
                    CHAMBER_COLORS[
                      (chamber.colorIndex || 0) % CHAMBER_COLORS.length
                    ],
                  )}
                />
                <span className="text-sm text-neutral-900 dark:text-neutral-100">
                  {chamber.name}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No chambers joined yet.</p>
        )}
      </div>

      <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800" />

      <div className="space-y-4">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
          Recent Activity
        </h3>

        {isQnLoading ? (
          <p className="text-neutral-500 text-sm">Loading activity...</p>
        ) : qnError ? (
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
          <form className="grid gap-4 py-4" onSubmit={(e) => handleSubmit(e)}>
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => {
                  updateDraft({ email: e.target.value });
                }}
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
                onChange={(e) => {
                  updateDraft({ bio: e.target.value });
                }}
                className="h-24 select-text"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="avatar" className="text-sm font-medium">
                Avatar URL
              </label>
              <Input
                id="avatar"
                className="select-text"
                value={editForm.avatar}
                onChange={(e) => {
                  updateDraft({ avatar: e.target.value });
                }}
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>

              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CreateChamberDialog
        open={createChamberOpen}
        onOpenChange={setCreateChamberOpen}
      />
    </div>
  );
}
