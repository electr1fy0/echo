import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search01Icon, ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useListChambers } from "@/hooks/use-chamber";
import {
  ChamberList,
  CreateChamberButton,
} from "@/components/chambers/chamber-list";
import { CreateChamberDialog } from "@/components/chambers/create-chamber-dialog";
import { useNavigate } from "react-router";
import { ChamberListSkeleton } from "@/components/ui/skeletons";
import { PageTransition } from "@/components/page-transition";

export default function AllChambers() {
  const [query, setQuery] = useState("");
  const [createChamberOpen, setCreateChamberOpen] = useState(false);
  const navigate = useNavigate();
  const { data: chambersData, isLoading } = useListChambers(query);
  const chambers = chambersData || [];
  return (
    <PageTransition className="max-w-[40rem] w-full md:mt-24 mt-16 space-y-4 pb-36 md:pb-16 relative px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-2 transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
        Back
      </button>

      <div className="space-y-4 mb-8">
        <div>
          <h1 className="text-neutral-800 dark:text-neutral-200 text-lg py-0 my-0 text-balance">
            All Chambers
          </h1>
          <h2 className="text-neutral-600 dark:text-neutral-400 text-sm text-balance">
            Browse and join specialized discussion communities
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 size-5"
          />
          <Input
            placeholder="Search chambers..."
            className="pl-10 h-10 bg-neutral-100 dark:bg-neutral-800/50 border-transparent focus-visible:bg-transparent border-neutral-200 dark:border-neutral-700 rounded-2xl"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <CreateChamberButton onClick={() => setCreateChamberOpen(true)} />
        <div>
          {isLoading ? (
            <ChamberListSkeleton count={4} />
          ) : chambers.length > 0 ? (
            <ChamberList chambers={chambers} />
          ) : (
            <p className="text-sm text-neutral-500 text-center py-10">
              No chambers found matching "{query}"
            </p>
          )}
        </div>
      </div>
      <CreateChamberDialog
        open={createChamberOpen}
        onOpenChange={setCreateChamberOpen}
      />
    </PageTransition>
  );
}
