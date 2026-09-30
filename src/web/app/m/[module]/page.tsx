"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import Runner from "@/components/engine/Runner";
import { MODULES } from "@/lib/modules";
import { useMe } from "@/lib/useMe";

// Client page: module definitions carry small functions (dynamic prompts), so they stay in the browser bundle.
export default function ModulePage() {
  const { module } = useParams<{ module: string }>();
  const { me } = useMe();
  const def = MODULES[module];

  if (!def) {
    return (
      <p className="text-muted">
        없는 과제예요. <Link href="/home" className="underline">홈으로</Link>
      </p>
    );
  }
  if (!me) return <p className="text-muted">불러오는 중…</p>;
  return <Runner key={def.id} def={def} />;
}
