"use client";

import { useKeyboardInset } from "../../lib/pwa/use-keyboard-inset";

/** Mount once per authenticated / portal shell — visualViewport → `--mpa-keyboard-inset`. */
export function NativeShellEffects() {
  useKeyboardInset();
  return null;
}
