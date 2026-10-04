// Temporary capture/verify harness for the Rashi discovery rebuild.
//   node scripts/_tmp-rashi.mjs <label> [width] [height]
// Boots the dev server, drives /rashi in headless Chrome over CDP, and writes
// screenshots of the catalogue section plus a set of interaction assertions.
import { spawn, execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { findChrome } from "./lib/chrome-webp.mjs";

const LABEL = process.argv[2] ?? "cat";
const W = Number(process.argv[3] ?? 1440);
const H = Number(process.argv[4] ?? 900);
const PORT = 8192;
const CDP = 9334;
const OUT = "scripts/_tmp-out";
mkdirSync(OUT, { recursive: true });

const chrome = findChrome();
if (!chrome) throw new Error("no chrome");
try {
  execSync("taskkill /F /IM chrome.exe", { stdio: "ignore" });
} catch {
  /* nothing running */
}
await sleep(400);

const profile = `${process.env.TEMP}\\rashi-cat-${LABEL}`;
mkdirSync(profile, { recursive: true });

const server = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "dev", "--port", String(PORT), "--strictPort"],
  { stdio: ["ignore", "ignore", "ignore"] },
);
const browser = spawn(
  chrome,
  [
    "--headless=new",
    `--remote-debugging-port=${CDP}`,
    `--user-data-dir=${profile}`,
    `--window-size=${W},${H}`,
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--disable-gpu",
    "--no-first-run",
    "about:blank",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
browser.stdout.on("data", (d) =>
  writeFileSync(`${OUT}\\chrome-${LABEL}.log`, String(d)),
);
browser.stderr.on("data", (d) =>
  writeFileSync(`${OUT}\\chrome-${LABEL}.err`, String(d)),
);
const bail = async (m) => {
  console.error(m);
  try {
    browser.kill();
  } catch {
    /* gone */
  }
  server.kill();
  process.exit(1);
};
process.on("exit", () => {
  try {
    browser.kill();
  } catch {
    /* gone */
  }
  server.kill();
});

let up = false;
for (let i = 0; i < 120; i++) {
  try {
    if ((await fetch(`http://127.0.0.1:${CDP}/json/version`)).ok) {
      up = true;
      break;
    }
  } catch {
    /* not up */
  }
  await sleep(250);
}
if (!up) await bail("devtools never came up");

let target = null;
for (let i = 0; i < 60; i++) {
  const list = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json();
  target = list.find((t) => t.type === "page");
  if (target?.webSocketDebuggerUrl) break;
  target = null;
  await sleep(250);
}
if (!target) await bail("no page target");

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.addEventListener("open", res, { once: true });
  ws.addEventListener("error", rej, { once: true });
});
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) reject(new Error(JSON.stringify(m.error)));
    else resolve(m.result);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails)
    throw new Error(r.exceptionDetails.exception?.description ?? "eval failed");
  return r.result.value;
};

const shoot = async (name, clip) => {
  const params = { format: "jpeg", quality: 84 };
  if (clip) params.clip = { ...clip, scale: 1 };
  const { data } = await send("Page.captureScreenshot", params);
  const file = `${OUT}/${LABEL}-${name}.jpg`;
  writeFileSync(file, Buffer.from(data, "base64"));
  console.log("shot", file);
};

// Screenshot whatever the viewport currently shows, scrolling first.
const shootViewport = async (name) => {
  await sleep(420);
  await shoot(name);
};

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: W,
  height: H,
  deviceScaleFactor: 1,
  mobile: false,
});
const errors = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.method === "Runtime.exceptionThrown")
    errors.push(m.params.exceptionDetails.text);
});
await send("Runtime.addBinding", { name: "__err" }).catch(() => {});
await send("Log.enable").catch(() => {});

await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/rashi` });
await sleep(2000);

// Wait for hydration, and for the door animation to finish so the catalogue is
// reached in its settled state.
let ready = false;
for (let i = 0; i < 200; i++) {
  ready = await evaluate(`(() => {
    const m = document.querySelector('.rashi-doorway-media');
    return !!m && m.dataset.motionReady === 'true';
  })()`);
  if (ready) break;
  await sleep(250);
}
if (!ready) await bail("never hydrated");
await sleep(3200);

const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(pass ? "PASS" : "FAIL", name, detail);
};

// --- structural inventory ------------------------------------------------
const inventory = await evaluate(`(() => ({
  signs: document.querySelectorAll('.rashi-signs button').length,
  signNames: [...document.querySelectorAll('.rashi-signs button')].map(b => b.textContent.trim()),
  cards: document.querySelectorAll('.rashi-product-card').length,
  quickView: document.querySelectorAll('.rashi-quickview-trigger').length,
  compare: document.querySelectorAll('.rashi-compare-toggle').length,
  finder: !!document.querySelector('.rashi-finder'),
  context: !!document.querySelector('.rashi-context'),
  tray: !!document.querySelector('.rashi-compare-tray'),
  drawer: !!document.querySelector('.rashi-drawer'),
  links: [...document.querySelectorAll('.rashi-product-card a[href]')].map(a => a.getAttribute('href')),
  prices: [...document.querySelectorAll('.rashi-card-price strong')].map(p => p.textContent.trim()),
  overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
}))()`);
console.log("inventory", JSON.stringify(inventory, null, 1));

check("12 signs + all + finder button present", inventory.signs === 14, `${inventory.signs} buttons`);
check("12 product cards", inventory.cards === 12, `${inventory.cards}`);
check("quick view on every card", inventory.quickView === 12, `${inventory.quickView}`);
check("compare toggle on every card", inventory.compare === 12, `${inventory.compare}`);
check(
  "every card keeps its product route",
  inventory.links.length >= 12 && inventory.links.every((h) => /\/rakhi\/rashi\//.test(h ?? "")),
  `${inventory.links.length} links`,
);
check("all twelve routes are distinct", new Set(inventory.links).size === 12, `${new Set(inventory.links).size}`);
check("all prices unchanged", inventory.prices.every((p) => p === "₹899"), inventory.prices[0]);
check("no horizontal overflow", inventory.overflowX <= 0, `${inventory.overflowX}px`);

// --- screenshots of the section in its resting state ---------------------
const scrollToSection = async () => {
  await evaluate(`(() => {
    const el = document.querySelector('#rashi-collection');
    const y = el.getBoundingClientRect().top + window.scrollY - 24;
    window.scrollTo(0, y);
  })()`);
  await sleep(500);
};
await scrollToSection();
await shootViewport("section");

await evaluate(`window.scrollBy(0, ${Math.round(H * 0.9)})`);
await shootViewport("section-2");

// --- zodiac switching ----------------------------------------------------
// The label carries its zodiac glyph with no space before the name, so match
// on the substring. Every sign name is unique across the row.
const clickSign = async (label) => {
  const hit = await evaluate(`(() => {
    const b = [...document.querySelectorAll('.rashi-signs button')]
      .find(x => x.textContent.includes(${JSON.stringify(label)}));
    if (!b) return null;
    b.click();
    return b.textContent.trim();
  })()`);
  await sleep(700);
  if (!hit) throw new Error("no sign button matched " + label);
};
await clickSign("Leo");
const afterLeo = await evaluate(`(() => ({
  cards: document.querySelectorAll('.rashi-product-card').length,
  name: document.querySelector('.rashi-context-name')?.textContent?.trim() ?? null,
  sanskrit: document.querySelector('.rashi-context-sanskrit')?.textContent?.trim() ?? null,
  counter: document.querySelector('.rashi-context-count')?.textContent?.trim() ?? null,
  url: location.search,
}))()`);
console.log("afterLeo", JSON.stringify(afterLeo));
check("selecting a sign filters to one card", afterLeo.cards === 1, `${afterLeo.cards}`);
check("context shows the sign", /leo/i.test(afterLeo.name ?? ""), afterLeo.name);
check("context shows a Sanskrit name", !!afterLeo.sanskrit, afterLeo.sanskrit);
check("context shows an NN / 12 counter", /^\d\d\s*\/\s*12$/.test(afterLeo.counter ?? ""), afterLeo.counter);
check("Leo is the 05 / 12 sign", afterLeo.counter === "05 / 12", afterLeo.counter);
check("selection is reflected in the URL", /sign=leo/.test(afterLeo.url), afterLeo.url);
await scrollToSection();
await shootViewport("sign-leo");

// --- finder --------------------------------------------------------------
await clickSign("All 12 signs");
const cardsBack = await evaluate(
  `document.querySelectorAll('.rashi-product-card').length`,
);
check("all-signs restores 12 cards", cardsBack === 12, `${cardsBack}`);

await evaluate(`(() => {
  const b = [...document.querySelectorAll('.rashi-signs button')].find(x => /Not sure/i.test(x.textContent));
  if (b) b.click();
})()`);
await sleep(600);
const finderOpen = await evaluate(`!!document.querySelector('.rashi-finder')`);
check("finder panel opens", finderOpen);
await shootViewport("finder");

// A date inside Taurus' range.
const finderResult = await evaluate(`(() => {
  const f = document.querySelector('.rashi-finder');
  if (!f) return null;
  const d = f.querySelector('input[type="date"]');
  const set = (el, v) => {
    const proto = Object.getPrototypeOf(el);
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  set(d, '1990-05-14');
  f.querySelector('form').requestSubmit();
  return true;
})()`);
await sleep(700);
const finderOut = await evaluate(`(() => ({
  text: document.querySelector('.rashi-finder-result')?.textContent?.trim() ?? null,
  pressed: [...document.querySelectorAll('.rashi-signs button[aria-pressed="true"]')].map(b => b.textContent.trim()),
}))()`);
console.log("finder", JSON.stringify({ finderResult, ...finderOut }));
check(
  "finder resolves a date to a sign",
  !!finderOut.text && /taurus/i.test(finderOut.text),
  finderOut.text?.slice(0, 90),
);
await shootViewport("finder-result");

await evaluate(`document.querySelector('.rashi-finder-close')?.click()`);
await sleep(400);

// --- quick view ----------------------------------------------------------
await evaluate(`document.querySelector('.rashi-quickview-trigger')?.click()`);
await sleep(750);
const qv = await evaluate(`(() => {
  const d = document.querySelector('.rashi-drawer');
  if (!d) return null;
  return {
    name: d.querySelector('.rashi-drawer-name')?.textContent?.trim() ?? null,
    price: d.querySelector('.rashi-drawer-price')?.textContent?.trim() ?? null,
    image: !!d.querySelector('img'),
    accordions: d.querySelectorAll('details').length,
    open: getComputedStyle(d).visibility,
  };
})()`);
console.log("quickview", JSON.stringify(qv));
console.log(
  "scrim",
  JSON.stringify(
    await evaluate(`(() => {
      const s = document.querySelector('.rashi-drawer-scrim');
      if (!s) return null;
      const cs = getComputedStyle(s);
      const r = s.getBoundingClientRect();
      return { background: cs.backgroundColor, z: cs.zIndex, rect: [r.x, r.y, r.width, r.height] };
    })()`),
  ),
);
console.log(
  "drawerBox",
  JSON.stringify(
    await evaluate(`(() => {
      const b = document.querySelector('.rashi-drawer .rashi-compare-box');
      if (!b) return null;
      const cs = getComputedStyle(b);
      return { background: cs.backgroundColor, border: cs.borderTopColor, w: cs.width, h: cs.height };
    })()`),
  ),
);
check("quick view drawer opens", !!qv);
check("drawer shows a name and price", !!qv?.name && /899/.test(qv?.price ?? ""), `${qv?.name} ${qv?.price}`);
check("drawer shows the large image", !!qv?.image);
check("drawer has detail accordions", (qv?.accordions ?? 0) >= 3, `${qv?.accordions}`);
await shootViewport("quickview");

// The detail route must still work.
const qvLink = await evaluate(
  `document.querySelector('.rashi-drawer a[href*="/rakhi/rashi/"]')?.getAttribute('href') ?? null`,
);
console.log("drawer detail link", qvLink);
check("drawer links to the existing product route", !!qvLink, qvLink ?? "none");

await evaluate(`document.querySelector('.rashi-drawer-close')?.click()`);
await sleep(500);
const drawerGone = await evaluate(
  `!document.querySelector('.rashi-drawer') || getComputedStyle(document.querySelector('.rashi-drawer')).visibility === 'hidden'`,
);
check("quick view closes", drawerGone);

// --- compare -------------------------------------------------------------
// Click first, then read: React has to re-render before the tray exists.
await evaluate(`(() => {
  const boxes = [...document.querySelectorAll('.rashi-compare-toggle')];
  boxes[0].click();
  boxes[1].click();
  boxes[2].click();
})()`);
await sleep(700);
await evaluate(`document.querySelectorAll('.rashi-compare-toggle')[3]?.click()`);
await sleep(400);
const compare = await evaluate(`(() => {
  const fourth = document.querySelectorAll('.rashi-compare-toggle')[3];
  return {
    tray: !!document.querySelector('.rashi-compare-tray'),
    count: document.querySelector('.rashi-compare-count')?.textContent?.trim() ?? null,
    items: document.querySelectorAll('.rashi-compare-item').length,
    blocked: fourth ? fourth.disabled === true : null,
    title: document.querySelector('.rashi-compare-title')?.textContent?.trim() ?? null,
  };
})()`);
console.log("compare", JSON.stringify(compare));
check("compare tray appears at 3", compare.tray && compare.items === 3, `${compare.items}`);
check("tray counts the selection", /3/.test(compare.count ?? ""), compare.count);
check("a 4th piece is refused", compare.blocked === true, String(compare.blocked));
await sleep(500);
await shootViewport("compare");

await evaluate(`document.querySelector('.rashi-compare-view')?.click()`);
await sleep(700);
const panel = await evaluate(`(() => {
  const p = document.querySelector('.rashi-compare-panel');
  if (!p) return null;
  return {
    rows: [...p.querySelectorAll('tbody th')].map(t => t.textContent.trim()),
    cols: p.querySelectorAll('thead th').length - 1,
  };
})()`);
console.log("compare panel", JSON.stringify(panel));
check("comparison panel opens", !!panel);
check(
  "comparison is factual only",
  !!panel && panel.rows.every((r) => /rashi|design|material|detail|price/i.test(r)),
  panel?.rows.join(" | "),
);
check("comparison has one column per piece", panel?.cols === 3, `${panel?.cols}`);
await shootViewport("compare-panel");

console.log("\nerrors", JSON.stringify(errors.slice(0, 5)));
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) console.log("FAILED:", failed.map((f) => f.name).join("; "));

ws.close();
browser.kill();
server.kill();
await sleep(300);
process.exit(0);