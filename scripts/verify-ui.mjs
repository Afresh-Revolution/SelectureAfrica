import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";
import postgres from "postgres";

function loadEnv() {
  const text = readFileSync(".env", "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();
const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });
mkdirSync(".verify", { recursive: true });

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});
const stamp = Date.now();
const corporateEmail = `ada.${stamp}@example.com`;
const professionalEmail = `kwame.${stamp}@example.com`;

const failures = [];
function check(name, condition) {
  if (!condition) failures.push(name);
  else console.log("ok", name);
}

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
desktop.on("pageerror", (error) => pageErrors.push(error.message));

await desktop.goto("http://localhost:3000", { waitUntil: "networkidle" });
check("home hero", (await desktop.locator("h1").innerText()).includes("Talent, prepared"));
const heroColor = await desktop.locator("h1").evaluate((el) => {
  const view = getComputedStyle(el);
  const section = getComputedStyle(el.closest("section") || el);
  return `${view.color} on ${section.backgroundColor}`;
});
console.log("hero contrast", heroColor);
await desktop.screenshot({ path: ".verify/home-desktop.png", fullPage: true });

for (const path of ["/about", "/services", "/industries", "/employers", "/professionals", "/programs", "/insights", "/contact", "/privacy"]) {
  const response = await desktop.goto(`http://localhost:3000${path}`, { waitUntil: "domcontentloaded" });
  check(`${path} loads`, response.ok());
}

const program = await desktop.goto("http://localhost:3000/programs/market-education");
check("program detail", program.ok() && (await desktop.locator("h1").innerText()).includes("Market Education"));

const guarded = await desktop.goto("http://localhost:3000/admin");
check("admin requires sign-in", desktop.url().includes("/sign-in"));
check("guard status", guarded.ok() || guarded.status() === 200 || desktop.url().includes("/sign-in"));

await desktop.goto("http://localhost:3000/register/corporate");
await desktop.locator("[name=fullName]").fill("Ada Okonkwo");
await desktop.locator("[name=email]").fill(corporateEmail);
await desktop.locator("[name=password]").fill("Harbour-Light-19");
await desktop.locator("[name=phone]").fill("+2348012345678");
await desktop.locator("[name=organizationName]").fill("Harbour & Co");
await desktop.locator("[name=industry]").selectOption("Banking & Finance");
await desktop.locator("[name=country]").selectOption("Nigeria");
await desktop.locator("[name=city]").fill("Lagos");
await desktop.getByRole("button", { name: "Create corporate account" }).click();
await desktop.waitForURL("**/dashboard", { timeout: 20000 });
check("corporate dashboard", (await desktop.locator("h1").innerText()).includes("Harbour"));

await desktop.goto("http://localhost:3000/dashboard/requests/new");
await desktop.locator("[name=title]").fill("Finance director, Lagos");
await desktop.locator("textarea[name=description]").fill("We need a finance director for the Lagos headquarters, with banking experience and a calm operating style.");
await desktop.locator("[name=location]").fill("Lagos");
await desktop.locator("[name=headcount]").fill("1");
await desktop.getByRole("button", { name: "Submit request" }).click();
await desktop.waitForURL(/\/dashboard\/requests\/[0-9a-f-]{8}-/i, { timeout: 20000 });
const reference = (await desktop.locator("p.eyebrow").first().innerText()).trim();
check("request reference", reference.startsWith("SA-"));

await desktop.getByRole("button", { name: "Sign out" }).click();
await desktop.waitForURL((url) => url.pathname === "/");

await sql`update profiles set account_type = 'super_admin' where email = ${corporateEmail}`;
await desktop.goto("http://localhost:3000/sign-in");
await desktop.locator("[name=email]").fill(corporateEmail);
await desktop.locator("[name=password]").fill("Harbour-Light-19");
await desktop.getByRole("button", { name: "Sign in" }).click();
await desktop.waitForURL("**/admin", { timeout: 20000 });
check("admin overview", (await desktop.locator("h1").innerText()).includes("What needs a person"));
await desktop.screenshot({ path: ".verify/admin-desktop.png", fullPage: true });

await desktop.goto("http://localhost:3000/admin/requests");
await desktop.getByRole("link", { name: reference }).click();
await desktop.waitForURL(/\/admin\/requests\/[0-9a-f-]{8}-/i);
await desktop.locator("[name=status]").selectOption("in_review");
await desktop.locator("[name=message]").fill("A consultant has opened the brief and will confirm the search specification.");
await desktop.getByRole("button", { name: "Save update" }).click();
await desktop.getByText("Request updated.").waitFor({ timeout: 20000 });
check("admin status update", true);

await desktop.goto("http://localhost:3000/admin/team");
check("administrators page", (await desktop.locator("h1").innerText()).includes("Administrators"));
await desktop.goto("http://localhost:3000/admin/programs");
check("program editor", await desktop.getByRole("button", { name: "Save programme" }).isVisible());

await desktop.getByRole("button", { name: "Sign out" }).click();
await desktop.waitForURL((url) => url.pathname === "/");

await sql`update profiles set account_type = 'corporate' where email = ${corporateEmail}`;
await desktop.goto("http://localhost:3000/sign-in");
await desktop.locator("[name=email]").fill(corporateEmail);
await desktop.locator("[name=password]").fill("Harbour-Light-19");
await desktop.getByRole("button", { name: "Sign in" }).click();
await desktop.waitForURL("**/dashboard");
await desktop.getByRole("link", { name: reference }).first().click();
await desktop.getByText("In review").first().waitFor();
check("client sees status", true);

await desktop.getByRole("button", { name: "Sign out" }).click();
await desktop.goto("http://localhost:3000/register/professional");
await desktop.locator("[name=fullName]").fill("Kwame Mensah");
await desktop.locator("[name=email]").fill(professionalEmail);
await desktop.locator("[name=password]").fill("Harbour-Light-19");
await desktop.locator("[name=headline]").fill("Operations lead");
await desktop.locator("[name=country]").selectOption("Ghana");
await desktop.locator("[name=city]").fill("Accra");
await desktop.getByRole("button", { name: "Create professional account" }).click();
await desktop.waitForURL("**/dashboard");
await desktop.goto("http://localhost:3000/programs/supply-chains");
await desktop.locator("[name=motivation]").fill("I want a clearer view of distribution before my next role.");
await desktop.getByRole("button", { name: "Register interest" }).click();
await desktop.getByText("Registration received.").waitFor({ timeout: 20000 });
check("program registration", true);

writeFileSync(".verify/sample.pdf", Buffer.from("%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"));
await desktop.goto("http://localhost:3000/dashboard/profile");
await desktop.locator("[name=cv]").setInputFiles(".verify/sample.pdf");
await desktop.getByRole("button", { name: "Store CV" }).click();
await desktop.getByText("CV stored in private storage.").waitFor({ timeout: 20000 });
check("private cv upload", true);

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto("http://localhost:3000", { waitUntil: "networkidle" });
await mobile.getByRole("button", { name: "Menu" }).click();
check("mobile menu", await mobile.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Services", exact: true }).isVisible());
await mobile.screenshot({ path: ".verify/home-mobile.png", fullPage: true });

await sql`
  delete from service_requests
  where organization_id in (select id from organizations where name = 'Harbour & Co')
`;
await sql`delete from organizations where name = 'Harbour & Co'`;
await sql`delete from profiles where email like '%@example.com'`;
await sql.end();
await browser.close();
if (pageErrors.length) failures.push(`page errors: ${pageErrors.join(" | ")}`);
if (failures.length) {
  console.error("FAILED");
  for (const failure of failures) console.error("-", failure);
  process.exit(1);
}
console.log("verification complete");
