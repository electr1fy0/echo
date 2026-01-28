import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

export function LoadingSpinner() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <HugeiconsIcon
        icon={Loading03Icon}
        className="size-8 animate-spin text-neutral-400"
      />
    </div>
  );
}
