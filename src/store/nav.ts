"use client";

import { create } from "zustand";
import type { View, NavParams } from "@/lib/types";

interface NavState {
  view: View;
  params: NavParams;
  history: { view: View; params: NavParams }[];
  navigate: (view: View, params?: NavParams) => void;
  back: () => void;
  canGoBack: () => boolean;
}

export const useNav = create<NavState>((set, get) => ({
  view: "home",
  params: {},
  history: [],
  navigate: (view, params = {}) => {
    const { view: curView, params: curParams, history } = get();
    if (curView === view && JSON.stringify(curParams) === JSON.stringify(params)) return;
    set({
      view,
      params,
      history: [...history, { view: curView, params: curParams }].slice(-20),
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
  back: () => {
    const { history } = get();
    if (history.length === 0) {
      set({ view: "home", params: {} });
      return;
    }
    const prev = history[history.length - 1];
    set({
      view: prev.view,
      params: prev.params,
      history: history.slice(0, -1),
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
  canGoBack: () => get().history.length > 0,
}));
