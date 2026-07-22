import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/erickcastillo/mpa/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright");

const cert = JSON.parse(fs.readFileSync("/tmp/mpa-a04-checkout.json", "utf8"));
const cardNumber = (process.env.MPA_A04_CARD || "4242424242424242").replace(/\s/g, "");
const expectPaid = process.env.MPA_A04_EXPECT_PAID !== "0";
const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("STRIPE_SECRET_KEY required");

const result = {
  ok: false,
  steps: [],
  finalUrl: null,
  error: null,
  sessionId: cert.checkoutSessionId,
  paymentStatus: null,
  sessionStatus: null,
  subscriptionId: null,
  invoiceId: null,
  frames: [],
  bodySnippet: null
};

async function stripeGet(path) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${secretKey}` }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Stripe GET ${path}: ${res.status} ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

async function pollSession(wantPaid, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await stripeGet(`/checkout/sessions/${cert.checkoutSessionId}`);
    result.paymentStatus = last.payment_status;
    result.sessionStatus = last.status;
    result.subscriptionId = typeof last.subscription === "string" ? last.subscription : last.subscription?.id || null;
    result.invoiceId = typeof last.invoice === "string" ? last.invoice : last.invoice?.id || null;
    if (wantPaid && last.payment_status === "paid" && last.status === "complete") return last;
    if (last.status === "complete" || last.status === "expired") return last;
    await new Promise((r) => setTimeout(r, 2500));
  }
  return last;
}

const browser = await chromium.launch({
  headless: true,
  slowMo: 40,
  args: ["--disable-dev-shm-usage", "--no-sandbox", "--disable-gpu"]
});
const context = await browser.newContext({
  viewport: { width: 1400, height: 1600 },
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
});
const page = await context.newPage();
page.on("crash", () => result.steps.push("page_crash"));
page.on("close", () => result.steps.push("page_close"));
browser.on("disconnected", () => result.steps.push("browser_disconnected"));

try {
  await page.goto(cert.checkoutUrl, { waitUntil: "load", timeout: 90000 });
  await page.waitForTimeout(4000);
  result.steps.push("loaded");
  result.frames = page.frames().map((f) => f.url().slice(0, 120));

  // Prefer card radio if present
  const cardRadio = page.getByRole("radio", { name: /^Card$/i }).first();
  if (await cardRadio.count()) {
    await cardRadio.click({ force: true }).catch(() => {});
    result.steps.push("selected_card");
  }

  // Uncheck save/link
  for (const re of [/save my information/i, /securely save/i]) {
    const el = page.getByLabel(re).first();
    if ((await el.count()) > 0) {
      const checked = await el.isChecked().catch(() => false);
      if (checked) {
        await el.click({ force: true });
        result.steps.push("unchecked_save");
      }
    }
  }

  async function fillInAnyFrame(selectors, value, label) {
    // refresh frames each attempt
    for (let attempt = 0; attempt < 3; attempt++) {
      for (const frame of page.frames()) {
        for (const sel of selectors) {
          const loc = frame.locator(sel).first();
          const n = await loc.count().catch(() => 0);
          if (!n) continue;
          try {
            await loc.waitFor({ state: "visible", timeout: 3000 });
            await loc.click({ force: true });
            await loc.fill(value);
            result.steps.push(`${label}=ok:${sel.slice(0, 40)}`);
            return true;
          } catch {
            try {
              await loc.click({ force: true });
              await page.keyboard.type(value, { delay: 15 });
              result.steps.push(`${label}=typed`);
              return true;
            } catch {
              /* next */
            }
          }
        }
      }
      await page.waitForTimeout(800);
    }
    result.steps.push(`${label}=missing`);
    return false;
  }

  await fillInAnyFrame(
    ['input[name="cardnumber"]', 'input[autocomplete="cc-number"]', 'input[name="number"]', '#cardNumber'],
    cardNumber,
    "card"
  );
  await fillInAnyFrame(
    ['input[name="exp-date"]', 'input[autocomplete="cc-exp"]', 'input[name="expiry"]'],
    "12 / 34",
    "exp"
  );
  await fillInAnyFrame(
    ['input[name="cvc"]', 'input[autocomplete="cc-csc"]', 'input[name="securityCode"]'],
    "123",
    "cvc"
  );
  await fillInAnyFrame(
    ['input[name="name"]', 'input[autocomplete="cc-name"]', 'input[name="billingName"]'],
    "BILL001 Cert",
    "name"
  );
  await fillInAnyFrame(
    ['input[name="postal"]', 'input[autocomplete="postal-code"]', 'input[placeholder="ZIP"]', 'input[name="billingPostalCode"]'],
    "94105",
    "zip"
  );
  // Address/city optional — customer already has billing address via API.
  // Filling address fields previously crashed Chromium in this environment.
  if (process.env.MPA_A04_FILL_ADDRESS === "1") {
    await fillInAnyFrame(
      ['input[name="addressLine1"]', 'input[autocomplete="address-line1"]', 'input[placeholder="Address"]'],
      "123 Market St",
      "address"
    );
    await fillInAnyFrame(
      ['input[name="locality"]', 'input[autocomplete="address-level2"]', 'input[placeholder="City"]'],
      "San Francisco",
      "city"
    );
  }

  await page.screenshot({ path: "/tmp/mpa-a04-checkout-before-submit.png", fullPage: true });

  const button = (await page.locator('[data-testid="hosted-payment-submit-button"]').count())
    ? page.locator('[data-testid="hosted-payment-submit-button"]').first()
    : page.getByRole("button", { name: /^Subscribe$/i }).first();

  await button.scrollIntoViewIfNeeded();
  for (let i = 0; i < 40; i++) {
    if (!(await button.isDisabled().catch(() => false))) break;
    await page.waitForTimeout(250);
  }
  await button.click({ timeout: 30000 });
  result.steps.push("clicked_subscribe");

  // Wait for either redirect or Stripe to mark paid
  await Promise.race([
    page.waitForURL(/saas=success|session_id=/i, { timeout: 90000 }).catch(() => null),
    pollSession(expectPaid, 90000)
  ]);

  result.finalUrl = page.url();
  await page.screenshot({ path: "/tmp/mpa-a04-checkout-after-submit.png", fullPage: true });
  result.bodySnippet = (await page.locator("body").innerText().catch(() => "")).slice(0, 900);

  // Final authoritative poll
  const session = await pollSession(expectPaid, 15000);
  if (expectPaid) {
    result.ok = session?.payment_status === "paid" && session?.status === "complete";
  } else {
    result.ok = session?.payment_status !== "paid";
  }
} catch (err) {
  result.error = err instanceof Error ? err.message : String(err);
  await page.screenshot({ path: "/tmp/mpa-a04-checkout-error.png", fullPage: true }).catch(() => {});
  try {
    const session = await stripeGet(`/checkout/sessions/${cert.checkoutSessionId}`);
    result.paymentStatus = session.payment_status;
    result.sessionStatus = session.status;
    result.subscriptionId = session.subscription || null;
  } catch {
    /* ignore */
  }
} finally {
  fs.writeFileSync("/tmp/mpa-a04-checkout-result.json", JSON.stringify(result, null, 2));
  await browser.close().catch(() => {});
}

console.log(JSON.stringify(result, null, 2));
process.exitCode = result.ok ? 0 : 1;
