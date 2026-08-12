export type DismissibleMenuState = {
  open: boolean;
  pathname: string;
};

export type DismissibleMenuAction =
  | { type: "toggle" }
  | { type: "open" }
  | { type: "close" }
  | { type: "pathname"; pathname: string };

/** Controlled menu reducer — closes on route change (PPS1-005 / PPS1-030). */
export function reduceDismissibleMenu(
  state: DismissibleMenuState,
  action: DismissibleMenuAction
): DismissibleMenuState {
  switch (action.type) {
    case "toggle":
      return { ...state, open: !state.open };
    case "open":
      return { ...state, open: true };
    case "close":
      return { ...state, open: false };
    case "pathname":
      if (action.pathname === state.pathname) {
        return state;
      }
      return { open: false, pathname: action.pathname };
    default:
      return state;
  }
}
