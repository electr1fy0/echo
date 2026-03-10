import { useParams } from "react-router";
import { useFetchPublicProfile } from "@/hooks/use-profile";
import { useQuestionsQuery } from "@/hooks/use-questions";
import { UserAvatar } from "@/components/ui/user-avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link01Icon } from "@hugeicons/core-free-icons";
import { QuestionList } from "@/components/questions/question-list";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";
import { ProfileSkeleton } from "@/components/ui/skeletons";
import { PageTransition } from "@/components/page-transition";

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();

  const {
    data: user,
    isLoading: isProfileLoading,
    error: profileError,
  } = useFetchPublicProfile(username);

  const { data: qnData, isLoading: isQnLoading } = useQuestionsQuery(
    undefined,
    undefined,
    undefined,
    username,
  );
  const questions = qnData || [];

  if (isProfileLoading) {
    return <ProfileSkeleton />;
  }

  if (profileError || !user) {
    return (
      <div className="mt-20 text-sm text-red-500 px-4">Profile not found</div>
    );
  }
  const resolvedLink = (() => {
    const raw = (user.link || "").trim();
    if (!raw) return null;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
      return raw;
    }
    return `https://${raw}`;
  })();

  return (
    <PageTransition className="max-w-[40rem] w-full md:mt-24 mt-16 space-y-8 mb-40 relative px-4 pb-20 md:pb-0">
      <div className="flex flex-col items-start gap-4">
        <div className="flex w-full justify-between items-start">
          <UserAvatar
            src={user.avatar}
            name={user.username}
            className="size-24"
          />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {user.username}
          </h1>
          <div className="flex flex-col gap-1 text-neutral-500 text-sm">
            {resolvedLink && (
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Link01Icon} className="size-4" />
                <a
                  href={resolvedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-foreground transition-colors"
                >
                  {user.link}
                </a>
              </div>
            )}
          </div>
        </div>

        {user.bio && (
          <p className="text-neutral-600 dark:text-neutral-400 text-sm max-w-md whitespace-pre-wrap">
            {user.bio}
          </p>
        )}

        <div className="flex gap-6 pt-2">
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {user.answered}
            </span>
            <span className="text-xs text-neutral-500">Answered</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {user.posted}
            </span>
            <span className="text-xs text-neutral-500">Posted</span>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800" />

      <div className="space-y-4">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
          Questions
        </h3>
        {isQnLoading ? (
          <QuestionListSkeleton count={3} />
        ) : questions.length > 0 ? (
          <QuestionList questions={questions} />
        ) : (
          <p className="text-neutral-500 text-sm">No questions posted yet.</p>
        )}
      </div>
    </PageTransition>
  );
}
