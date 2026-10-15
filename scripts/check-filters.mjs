import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";

const root = process.cwd();
for (const line of readFileSync(join(root, ".env"), "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
  const index = trimmed.indexOf("=");
  const key = trimmed.slice(0, index).trim();
  if (!process.env[key]) process.env[key] = trimmed.slice(index + 1).trim();
}

mkdirSync(join(root, ".verify"), { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3001/sign-in", { waitUntil: "networkidle" });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/\/admin/, { timeout: 30000 });
await page.goto("http://localhost:3001/admin/requests", { waitUntil: "networkidle" });
const filters = page.locator(".status-filters");
await filters.screenshot({ path: join(root, ".verify", "filters-all.png") });
const current = await filters.locator('[aria-current="page"]').innerText();
console.log("current", current);
await filters.getByRole("link", { name: "Submitted" }).click();
await page.waitForURL(/status=submitted/);
console.log("after", await filters.locator('[aria-current="page"]').innerText());
await filters.screenshot({ path: join(root, ".verify", "filters-submitted.png") });
await browser.close();
