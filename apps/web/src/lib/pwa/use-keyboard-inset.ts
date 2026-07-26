"use client";

import { useEffect } from "react";
import {
  applyKeyboardInsetCssVar,
  clearKeyboardInsetCssVar,
  readKeyboardInsetFromVisualViewport
} from "./visual-viewport";

/**
 * Publishes `--mpa-keyboard-inset` from `visualViewport` so bottom-fixed chrome
 * can lift above the soft keyboard without layout jumps on desktop.
 */
export function useKeyboardInset(): void {
  useEffect(() => {
    const sync = () => {
      applyKeyboardInsetCssVar(readKeyboardInsetFromVisualViewport(window));
    };

    sync();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);

    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      clearKeyboardInsetCssVar();
    };
  }, []);
}
