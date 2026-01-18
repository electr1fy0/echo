import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useListChambers } from "@/hooks/use-chamber";
import {
  ChamberList,
  CreateChamberButton,
} from "@/components/chambers/chamber-list";
import { CreateChamberDialog } from "@/components/chambers/create-chamber-dialog";
import { useNavigate } from "react-router";
export function AllChambers() {
  const [query, setQuery] = useState("");
  const [createChamberOpen, setCreateChamberOpen] = useState(false);
  const navigate = useNavigate();
  const { data: chambers = [], isLoading } = useListChambers(query);
  return (
    <div className="max-w-[40rem] w-full mt-24 space-y-8 mb-40 relative px-4 pb-20 md:pb-0">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
        </Button>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          All Chambers
        </h1>
      </div>
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
          <p className="text-sm text-neutral-500">Loading chambers...</p>
        ) : chambers.length > 0 ? (
          <ChamberList chambers={chambers} />
        ) : (
          <p className="text-sm text-neutral-500 text-center py-10">
            No chambers found matching "{query}"
          </p>
        )}
      </div>
      <CreateChamberDialog
        open={createChamberOpen}
        onOpenChange={setCreateChamberOpen}
      />
    </div>
  );
}
