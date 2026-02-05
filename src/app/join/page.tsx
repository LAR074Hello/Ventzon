"use client";

import { Suspense } from "react";
import JoinInner from "./JoinInner";

export default function JoinPage() {
  return (
    <Suspense fallback={<div />}>
      <JoinInner />
    </Suspense>
  );
}