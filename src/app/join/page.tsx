import { Suspense } from "react";
import JoinInner from "./JoinInner";

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <JoinInner />
    </Suspense>
  );
}