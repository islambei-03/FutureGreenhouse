import fs from "fs";

const p = new URL("../src/lib/i18n.ts", import.meta.url);
let s = fs.readFileSync(p, "utf8");
const ruMatch = s.match(/const RU: Record<I18nKey, string> = \{([\s\S]*?)\n\};/);
const kkMatch = s.match(/const KK: Record<I18nKey, string> = \{([\s\S]*?)\n\};/);
if (!ruMatch || !kkMatch) throw new Error("RU/KK blocks not found");

function parse(block) {
  const o = {};
  const re = /"([^"]+)": "((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(block))) {
    o[m[1]] = m[2].replace(/\\"/g, '"');
  }
  return o;
}

const RU = parse(ruMatch[1]);
const KK = parse(kkMatch[1]);
for (const k of Object.keys(RU)) {
  if (!(k in KK)) KK[k] = RU[k];
}

const kkBody = Object.entries(KK)
  .map(([k, v]) => `  "${k}": "${v.replace(/"/g, '\\"')}",`)
  .join("\n");

s = s.replace(/const KK: Record<I18nKey, string> = \{[\s\S]*?\n\};/, `const KK: Record<I18nKey, string> = {\n${kkBody}\n};`);
fs.writeFileSync(p, s);
console.log("KK synced", Object.keys(KK).length, "keys");
