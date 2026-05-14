import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { chromium, Browser, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

const SCREENSHOTS_DIR = path.resolve("e:/ReactAPP/screenshots");

interface LogEntry {
  type: string;
  text: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  stack?: string;
}

interface NetworkError {
  method: string;
  url: string;
  errorText: string;
}

interface CaptureResult {
  url: string;
  title: string;
  logs: LogEntry[];
  networkErrors: NetworkError[];
  errorCount: number;
  warnCount: number;
}

let browser: Browser | null = null;
let page: Page | null = null;

async function getPage(): Promise<Page> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({ headless: true });
  }
  if (!page || page.isClosed()) {
    page = await browser.newPage();
  }
  return page;
}

async function visitAndCaptureLogs(url: string): Promise<CaptureResult> {
  const pg = await getPage();
  const logs: LogEntry[] = [];
  const networkErrors: NetworkError[] = [];

  pg.removeAllListeners("console");
  pg.removeAllListeners("pageerror");
  pg.removeAllListeners("requestfailed");

  pg.on("console", (msg) => {
    const location = msg.location();
    logs.push({
      type: msg.type(),
      text: msg.text(),
      url: location.url,
      lineNumber: location.lineNumber,
      columnNumber: location.columnNumber,
    });
  });

  pg.on("pageerror", (err) => {
    logs.push({
      type: "pageerror",
      text: err.message,
      stack: err.stack,
    });
  });

  pg.on("requestfailed", (req) => {
    networkErrors.push({
      method: req.method(),
      url: req.url(),
      errorText: req.failure()?.errorText ?? "unknown error",
    });
  });

  await pg.goto(url, { waitUntil: "networkidle", timeout: 30000 });

  const title = await pg.title();

  return {
    url,
    title,
    logs,
    networkErrors,
    errorCount: logs.filter((l) => l.type === "error" || l.type === "pageerror").length,
    warnCount: logs.filter((l) => l.type === "warning").length,
  };
}

async function takeScreenshot(): Promise<string> {
  const pg = await getPage();
  const buffer = await pg.screenshot({ type: "png", fullPage: false });
  return buffer.toString("base64");
}

async function getPageSource(): Promise<string> {
  const pg = await getPage();
  return await pg.content();
}

async function screenshotXdScreen(screenNumber: number): Promise<{ base64: string; filePath: string }> {
  const XD_GRID_URL =
    "https://xd.adobe.com/view/69ef15d5-8d52-44a5-a8fe-bc1e64d0ac10-3cbc/grid/";
  const pg = await getPage();

  await pg.setViewportSize({ width: 1440, height: 900 });
  await pg.goto(XD_GRID_URL, { waitUntil: "networkidle", timeout: 60000 });

  await pg.waitForSelector('a[href*="/screen/"]', { timeout: 30000 });
  const links = await pg.locator('a[href*="/screen/"]').all();

  if (screenNumber < 1 || screenNumber > links.length) {
    throw new Error(
      `Screen ${screenNumber} not found. Grid contains ${links.length} screens.`
    );
  }

  await links[screenNumber - 1].click();
  await pg.waitForURL(/\/screen\//, { timeout: 15000 });
  await pg.waitForLoadState("networkidle", { timeout: 30000 });

  const buffer = await pg.screenshot({ type: "png", fullPage: false });

  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const filePath = path.join(SCREENSHOTS_DIR, `screen-${screenNumber}.png`);
  fs.writeFileSync(filePath, buffer);

  return { base64: buffer.toString("base64"), filePath };
}

const server = new Server(
  { name: "mcp-browser", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "visit_and_capture_logs",
      description:
        "Launches a headless Chromium browser, navigates to the given URL, and captures all console messages (error/warn/log/info), JavaScript exceptions, and failed network requests. Returns structured JSON with all captured data.",
      inputSchema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The full URL to visit (e.g. http://localhost:8082/...)",
          },
        },
        required: ["url"],
      },
    },
    {
      name: "take_screenshot",
      description:
        "Takes a screenshot of the currently loaded page and returns it as a base64-encoded PNG string.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "get_page_source",
      description: "Returns the full HTML source of the currently loaded page.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "screenshot_xd_screen",
      description:
        "Navigates to a specific screen in the Adobe XD prototype grid and returns a screenshot as base64 PNG.",
      inputSchema: {
        type: "object",
        properties: {
          screen_number: {
            type: "number",
            description:
              "1-based index of the screen in the XD grid (e.g. 27 for the 27th screen)",
          },
        },
        required: ["screen_number"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "visit_and_capture_logs") {
      const url = (args as { url: string }).url;
      if (!url) throw new Error("url parameter is required");
      const result = await visitAndCaptureLogs(url);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === "take_screenshot") {
      const base64 = await takeScreenshot();
      return {
        content: [
          {
            type: "image",
            data: base64,
            mimeType: "image/png",
          },
        ],
      };
    }

    if (name === "get_page_source") {
      const html = await getPageSource();
      return {
        content: [
          {
            type: "text",
            text: html,
          },
        ],
      };
    }

    if (name === "screenshot_xd_screen") {
      const screenNumber = (args as { screen_number: number }).screen_number;
      if (!screenNumber) throw new Error("screen_number parameter is required");
      const { base64, filePath } = await screenshotXdScreen(screenNumber);
      return {
        content: [
          { type: "image", data: base64, mimeType: "image/png" },
          { type: "text", text: `Saved to: ${filePath}` },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

process.on("SIGINT", async () => {
  if (browser) await browser.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  if (browser) await browser.close();
  process.exit(0);
});

const transport = new StdioServerTransport();
await server.connect(transport);
