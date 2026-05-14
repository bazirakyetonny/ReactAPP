import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { chromium, Browser, Page } from "playwright";

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
