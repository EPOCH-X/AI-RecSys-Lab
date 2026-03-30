import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const html = path.join(root, "public", "compare-snapshot.html");
const out = path.join(root, "public", "experiment-snapshot.png");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(pathToFileURL(html).href, { waitUntil: "networkidle" });
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log("Wrote", out);
