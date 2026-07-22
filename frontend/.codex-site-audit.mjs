import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const port = process.argv[2] ?? "9334";
const endpoint = `http://127.0.0.1:${port}`;
const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForBrowser() {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${endpoint}/json/list`);

      if (response.ok) {
        return response.json();
      }
    } catch {
      // Chrome can take a moment to expose its debugging endpoint.
    }

    await delay(150);
  }

  throw new Error("Chrome debugging endpoint did not become ready.");
}

class CdpClient {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.socket = new WebSocket(url);
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });

    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);

      if (!message.id || !this.pending.has(message.id)) {
        return;
      }

      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);

      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result);
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function waitForApp(client) {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    const result = await client.send("Runtime.evaluate", {
      expression: "document.readyState === 'complete' && Boolean(document.querySelector('.app-shell .history-panel'))",
      returnByValue: true,
    });

    if (result.result.value) {
      return;
    }

    await delay(100);
  }

  throw new Error("App did not render.");
}

const pages = await waitForBrowser();
const page = pages.find((target) => target.type === "page");
const client = new CdpClient(page.webSocketDebuggerUrl);

await client.connect();
await client.send("Page.enable");
await client.send("Runtime.enable");
await client.send("Page.bringToFront");

for (const viewport of [
  { label: "desktop", width: 1366, height: 900, mobile: false },
  { label: "tablet", width: 768, height: 1024, mobile: true },
  { label: "mobile", width: 390, height: 844, mobile: true },
]) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
  });
  await client.send("Page.navigate", {
    url: "http://127.0.0.1:4173",
  });
  await waitForApp(client);
  await delay(300);

  const audit = await client.send("Runtime.evaluate", {
    expression: `(() => {
      const rect = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const box = element.getBoundingClientRect();
        return {
          left: Math.round(box.left * 100) / 100,
          top: Math.round((box.top + scrollY) * 100) / 100,
          width: Math.round(box.width * 100) / 100,
          height: Math.round(box.height * 100) / 100,
        };
      };

      return {
        viewport: { width: innerWidth, height: innerHeight },
        page: {
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
          horizontalOverflow:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth + 1,
        },
        hero: rect('.hero-content'),
        workflow: rect('.hero-workflow-card'),
        main: rect('.main-content'),
        step1: rect('.upload-panel'),
        step2: rect('.result-panel'),
        step3: rect('.history-panel'),
        dock: rect('.yolo-bottom-bar-shell'),
      };
    })()`,
    returnByValue: true,
  });

  const metrics = await client.send("Page.getLayoutMetrics");
  const contentSize = metrics.cssContentSize;
  const screenshot = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
    clip: {
      x: 0,
      y: 0,
      width: contentSize.width,
      height: contentSize.height,
      scale: 1,
    },
  });
  const screenshotPath = join(
    tmpdir(),
    `codex-site-${viewport.label}-${Date.now()}.png`
  );
  writeFileSync(screenshotPath, Buffer.from(screenshot.data, "base64"));

  console.log(JSON.stringify({
    label: viewport.label,
    ...audit.result.value,
    screenshotPath,
  }));
}

client.close();
