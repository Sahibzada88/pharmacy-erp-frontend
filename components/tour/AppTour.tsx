"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import type { CallBackProps } from "react-joyride";
import { useAuth } from "@/lib/auth";
import { useTourStore } from "./tourStore";
import { getTourSteps } from "./tourSteps";

// react-joyride touches `document` at import time in some versions — must be
// client-only, loaded dynamically so Next.js never tries to render it on the
// server (would crash the build otherwise).
const Joyride = dynamic(() => import("react-joyride"), { ssr: false });

const JOYRIDE_STYLES = {
  options: {
    primaryColor: "#0F9D74", // emerald — matches the app's brand color
    backgroundColor: "#141D2B", // ink-800
    textColor: "#F5F8F7", // cloud
    arrowColor: "#141D2B",
    overlayColor: "rgba(11, 18, 32, 0.75)",
    zIndex: 1000,
  },
  tooltip: {
    borderRadius: 16,
    fontFamily: "var(--font-body), sans-serif",
  },
  buttonNext: {
    backgroundColor: "#0F9D74",
    borderRadius: 12,
    padding: "8px 16px",
  },
  buttonBack: {
    color: "#F5F8F7",
    marginRight: 8,
  },
  buttonSkip: {
    color: "#8C98A4",
  },
};

export function AppTour() {
  const { user } = useAuth();
  const { run, startTour, stopTour, hasSeenTour, markSeen } = useTourStore();

  useEffect(() => {
    if (!user) return;
    if (!hasSeenTour()) {
      // Small delay so the dashboard has finished rendering before the
      // first spotlight tries to find its target element.
      const timer = setTimeout(() => startTour(), 800);
      return () => clearTimeout(timer);
    }
  }, [user, hasSeenTour, startTour]);

  if (!user) return null;

  function handleCallback(data: CallBackProps) {
    const { status } = data;
    if (status === "finished" || status === "skipped") {
      stopTour();
      markSeen();
    }
  }

  return (
    <Joyride
      run={run}
      steps={getTourSteps(user.role)}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      callback={handleCallback}
      styles={JOYRIDE_STYLES}
      locale={{ back: "Back", close: "Close", last: "Done", next: "Next", skip: "Skip tour" }}
    />
  );
}
