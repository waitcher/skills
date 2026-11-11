import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("visitor sees the Waitcher landing page", async ({ app, screen }) => {
  await app.open("/");
  await expect(screen.getByRole("heading", "Know when your site breaks, and why.")).toBeVisible();
  await expect(screen.getByRole("heading", "Get the Waitcher CLI")).toBeVisible();
  await app.screenshot("landing");
});
