export const BOTTOM_SPACING = {
  appShell: "calc(10rem + env(safe-area-inset-bottom))",
  pageContent: "calc(9rem + env(safe-area-inset-bottom))",
  interactionPanel: "calc(9rem + env(safe-area-inset-bottom))",
  modalContent: "calc(1.5rem + env(safe-area-inset-bottom))",
  navSafeInset: "max(0.5rem, env(safe-area-inset-bottom))",
} as const;
