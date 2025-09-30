// scripts/generate-sitemap.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== 설정 =====
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data.js");
const OUT_PATH = path.join(ROOT_DIR, "sitemap.xml");
const BASE_URL = process.env.BASE_URL || "https://jangdaeun.com";

// ===== 유틸 =====
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ===== data.js 읽기 (브라우저 전용 포맷도 대응) =====
if (!fs.existsSync(DATA_PATH)) {
    console.error(`[sitemap] data.js not found at ${DATA_PATH}`);
    process.exit(1);
}
const code = fs.readFileSync(DATA_PATH, "utf8");

// data.js는 보통 window.contents = [...] 형태이므로 VM 샌드박스에서 실행해 추출
const sandbox = { window: {}, globalThis: {} };
vm.createContext(sandbox);
try {
    vm.runInContext(code, sandbox, { filename: "data.js" });
} catch (e) {
    console.error("[sitemap] Failed to execute data.js:", e);
    process.exit(1);
}
const contents =
    sandbox.window?.contents ||
    sandbox.globalThis?.contents ||
    sandbox.contents;

if (!Array.isArray(contents)) {
    console.error("[sitemap] contents array not found in data.js");
    process.exit(1);
}

// ===== URL 만들기 =====
const urls = new Set();

// 루트와 detail 베이스는 항상 포함
urls.add(`${BASE_URL}/`);
urls.add(`${BASE_URL}/detail.html`);

for (const it of contents) {
    if (!it || !it.id) continue;

    const nav = it.nav || "art";
    const subnav = it.subnav || (nav === "text" ? "text" : "works");

    const u = new URL("/detail.html", BASE_URL);
    u.searchParams.set("id", String(it.id));
    u.searchParams.set("nav", String(nav));
    u.searchParams.set("subnav", String(subnav));

    urls.add(u.toString());
}

// ===== XML 생성 =====
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls]
        .map((u) => `  <url>\n    <loc>${esc(u)}</loc>\n  </url>`)
        .join("\n")}
</urlset>
`;

// ===== 저장 =====
fs.writeFileSync(OUT_PATH, xml, "utf8");
console.log(`[sitemap] Wrote ${OUT_PATH} with ${urls.size} URLs`);
