"use client";

import { useEffect, useState } from "react";

type City = { name: string; neighborhoods: number; places: number };

/**
 * Coverage pills, rendered from /api/marketing/coverage. City-agnostic by
 * design: the section renders whatever the data returns, so a new metro
 * appears here the day its places are imported — no site copy changes.
 */
export default function Coverage() {
  const [cities, setCities] = useState<City[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/marketing/coverage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive) setCities(d?.cities ?? []);
      })
      .catch(() => {
        if (alive) setCities([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
      {(cities ?? []).map((c) => (
        <span
          key={c.name}
          className="inline-flex items-center rounded-full bg-sage-soft px-5 py-2.5 text-[15px] font-medium text-sage"
        >
          {c.name}
          <span className="ml-2 text-xs font-normal text-taupe">
            {c.places.toLocaleString()} places
          </span>
        </span>
      ))}
      {cities !== null && cities.length === 0 && (
        <p className="text-[15px] text-taupe">Launching metro by metro — yours next?</p>
      )}
    </div>
  );
}
