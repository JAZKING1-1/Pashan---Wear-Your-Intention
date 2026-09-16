// Mechanical removal: these retired classes have no references in active TS/TSX.
import fs from "node:fs";
import postcss from "postcss";
const file = "src/styles.css";
const tree = postcss.parse(fs.readFileSync(file, "utf8"));
const retired =
  /\.(?:composer-[\w-]+|bracelet-composer|bracelet-3d-[\w-]+|wrist-size-guide|fit-source-grid|fit-choice-grid|measure-panel|known-size-panel|assistance-panel|measurement-row|fit-error|selected-bead-toolbar|design-actions|accessible-bead-list|mirror-pattern)(?![\w-])/;
let removed = 0;
tree.walkRules((rule) => {
  const keep = rule.selectors.filter((selector) => !retired.test(selector));
  removed += rule.selectors.length - keep.length;
  if (keep.length) rule.selectors = keep;
  else rule.remove();
});
tree.walkAtRules((rule) => {
  if (rule.nodes?.length === 0) rule.remove();
});
fs.writeFileSync(file, tree.toString());
console.log(
  `Removed ${removed} obsolete selector branches; unrelated selectors preserved.`,
);
