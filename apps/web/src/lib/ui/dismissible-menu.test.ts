import { describe, expect, it } from "vitest";
import { reduceDismissibleMenu } from "./dismissible-menu";

describe("reduceDismissibleMenu (PPS1-005 / PPS1-030)", () => {
  it("toggles open state", () => {
    const closed = { open: false, pathname: "/pricing" };
    const opened = reduceDismissibleMenu(closed, { type: "toggle" });
    expect(opened.open).toBe(true);
    expect(reduceDismissibleMenu(opened, { type: "toggle" }).open).toBe(false);
  });

  it("closes on explicit close and on pathname change", () => {
    const open = { open: true, pathname: "/pricing" };
    expect(reduceDismissibleMenu(open, { type: "close" }).open).toBe(false);
    expect(
      reduceDismissibleMenu(open, { type: "pathname", pathname: "/demo" })
    ).toEqual({ open: false, pathname: "/demo" });
  });

  it("keeps open state when pathname is unchanged", () => {
    const open = { open: true, pathname: "/pricing" };
    expect(reduceDismissibleMenu(open, { type: "pathname", pathname: "/pricing" })).toEqual(
      open
    );
  });
});
