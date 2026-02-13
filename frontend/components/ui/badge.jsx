import { cn } from "../../lib/utils";

export function Badge({ className, status, ...props }) {
  const tone =
    status === "done"
      ? "bg-emerald-100 text-emerald-800"
      : status === "failed"
        ? "bg-rose-100 text-rose-800"
        : "bg-amber-100 text-amber-800";

  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", tone, className)} {...props} />;
}
