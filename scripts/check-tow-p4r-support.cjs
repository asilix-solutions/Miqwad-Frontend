const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const load = (file) => fs.readFileSync(path.join(root, file), "utf8");
const prefix = "src/modules/tow-truck/components/";
const names = ["TowTruckIntraCityWorkspace.tsx", "TowTruckInterCityWorkspace.tsx"];
for (const name of names) {
  const source = load(prefix + name);
  assert.match(source, /TowTruckSupportingInformationSheet order=\{order\}/);
  assert.match(source, /order\.notes\?\.trim\(\)/);
  assert.match(source, /\{order\.notes\}/);
  assert.doesNotMatch(source, /<TowTruckAdditionalInfoSection order=\{order\}/);
  assert.equal((source.match(/<TowTruckSupportingInformationSheet /g) || []).length, 1);
  assert.equal((source.match(/<TowTruck(?:Driver|InterCity)DispatchSection\b/g) || []).length, 1);
  console.log(`PASS notes visibly retained, one support sheet, one action owner: ${name}`);
}
const sheet = load(prefix + "TowTruckSupportingInformationSheet.tsx");
for (const term of ["<SheetTrigger", "<SheetContent", "<SheetClose", "<SheetTitle", "attachmentsKnown", "openAttachment", "rel=\"noopener noreferrer\""]) {
  assert.ok(sheet.includes(term), `Missing ${term}`);
}
assert.doesNotMatch(sheet, /useMutation|\.mutate\(|fetch\(|axios\.|submit\(/);
assert.doesNotMatch(sheet, /scenario|DEMO-|mockOrder/);
const css = load(prefix + "towTruckSupportSheet.css");
assert.match(css, /max-width:\s*640px/);
assert.match(css, /inset-inline-end/);
assert.match(css, /max-height:\s*85dvh/);
const i18n = load("src/modules/tow-truck/i18n.ts");
assert.match(i18n, /p4CloseAttachments:\s*"إغلاق المرفقات"/);
assert.match(i18n, /p4CloseAttachments:\s*"Close attachments"/);
console.log("PASS sheet behavior markers, RTL/mobile CSS and bilingual close strings");
console.log("Static checks passed. This does NOT verify rendering, TypeScript or browser behavior.");
