export type PwaInstallSurface = "apple" | "android" | "desktop" | "standalone" | "unsupported";

export function detectPwaInstallSurface(input: {
  userAgent: string;
  standalone: boolean;
  displayModeStandalone: boolean;
  canPrompt: boolean;
}): PwaInstallSurface {
  if (input.standalone || input.displayModeStandalone) {
    return "standalone";
  }

  const ua = input.userAgent;
  const appleMobile = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua));
  if (appleMobile) {
    return "apple";
  }

  const android = /Android/i.test(ua);
  if (android) {
    return input.canPrompt ? "android" : "android";
  }

  if (input.canPrompt) {
    return "desktop";
  }

  if (/Windows|Macintosh|Linux/i.test(ua)) {
    return "desktop";
  }

  return "unsupported";
}

export function appleInstallSteps(): string[] {
  return ["Open Share", "Add to Home Screen", "Add"];
}
