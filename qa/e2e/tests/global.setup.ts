import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isAuthEnabled } from "../src/utils/env";

/**
 * Global setup runs before webServer — do not hit the app here.
 * Role storage states are created lazily by auth fixtures after the server is up.
 */
export default async function globalSetup() {
  const authDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../playwright/.auth");
  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(
    path.join(authDir, "anonymous.json"),
    JSON.stringify({ cookies: [], origins: [] })
  );
  console.log(
    `[QA-001 setup] Anonymous state ready. Auth enabled=${isAuthEnabled()} (role sessions via fixtures).`
  );
}
