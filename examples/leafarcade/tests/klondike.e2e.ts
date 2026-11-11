import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("visitor can open Klondike", async ({ app, browser, screen }) => {
  await app.open("/games/klondike/");
  await expect(browser.locator("main h1")).toContainText("Solitaire");
  await expect(screen.getByRole("button", "New game")).toBeVisible();
  await app.screenshot("klondike");
});
