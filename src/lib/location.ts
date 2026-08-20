"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Device-location state machine for the customer app.
 *
 * Distinguishes the six states the product actually cares about:
 *   not_requested  — permission has never been asked
 *   asking         — a request is in flight
 *   granted        — coordinates are available
 *   denied         — the user refused (or the browser will not re-ask)
 *   unavailable    — permission granted but no fix could be obtained
 *   error          — anything else (e.g. services off, timeout)
 *
 * There is deliberately NO manual fallback: no city picker, no choose-a-
 * city. The caller renders the honest state and lets the user act.
 */
export type LocationState =
  | { status: "not_requested" }
  | { status: "asking" }
  | { status: "granted"; lat: number; lng: number }
  | { status: "denied" }
  | { status: "unavailable" }
  | { status: "error" };

export function useLocationPermission() {
  const [state, setState] = useState<LocationState>({ status: "not_requested" });
  const inflight = useRef(false);

  const request = useCallback(() => {
    if (inflight.current) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unavailable" });
      return;
    }
    inflight.current = true;
    setState({ status: "asking" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        inflight.current = false;
        setState({ status: "granted", lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        inflight.current = false;
        if (err.code === err.PERMISSION_DENIED) setState({ status: "denied" });
        else if (err.code === err.POSITION_UNAVAILABLE) setState({ status: "unavailable" });
        else setState({ status: "error" });
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // On mount, reflect an already-decided permission without re-prompting:
  // granted → read the position silently; denied → say so; prompt → leave
  // as not_requested (the user taps to ask). Where the permissions API is
  // absent (older Safari / WKWebView) nothing is inferred — the first tap
  // both asks and answers.
  useEffect(() => {
    const nav = navigator as Navigator & {
      permissions?: { query: (d: { name: string }) => Promise<{ state: string }> };
    };
    if (typeof navigator === "undefined" || !nav.permissions?.query) return;
    nav.permissions
      .query({ name: "geolocation" })
      .then((p) => {
        if (p.state === "granted") request();
        else if (p.state === "denied") setState({ status: "denied" });
      })
      .catch(() => {});
  }, [request]);

  return { state, request };
}
