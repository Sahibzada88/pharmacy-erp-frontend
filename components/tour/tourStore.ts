"use client";

import { create } from "zustand";

const SEEN_KEY = "pharmacy_erp_tour_seen_v1";

interface TourStore {
  run: boolean;
  startTour: () => void;
  stopTour: () => void;
  hasSeenTour: () => boolean;
  markSeen: () => void;
}

export const useTourStore = create<TourStore>((set) => ({
  run: false,
  startTour: () => set({ run: true }),
  stopTour: () => set({ run: false }),
  hasSeenTour: () => (typeof window === "undefined" ? true : localStorage.getItem(SEEN_KEY) === "1"),
  markSeen: () => {
    if (typeof window !== "undefined") localStorage.setItem(SEEN_KEY, "1");
  },
}));
