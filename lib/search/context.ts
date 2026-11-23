import "server-only";

import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";

const INITIAL_CONTEXT_TTL_MS = 5 * 60 * 1000;
const ALLOWED_TOOL_NAMES = new Set([
  "initial_context",
  "schema_explorer",
  "groq_query",
  "array_field_reader",
]);

type InitialContextCache = {
  endpoint: string;
  value: string;
  expiresAt: number;
};

let initialContextCache: InitialContextCache | null = null;

export type SearchEnvironment = {
  mcpUrl: string;
  organizationToken: string;
  geminiApiKey: string;
  geminiModel: string;
};

function requiredEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Search configuration is missing ${name}.`);
  }

  return value;
}

function validateMcpUrl(value: string) {
  const url = new URL(value);

  if (
    url.protocol !== "https:" ||
    url.hostname !== "api.sanity.io" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/v\d{4}-\d{2}-\d{2}\/context\/organizations\/[^/]+\/mcp\/[^/]+\/?$/.test(
      url.pathname,
    )
  ) {
    throw new Error("SANITY_CONTEXT_MCP_URL is not a trusted Context endpoint.");
  }

  return url.toString().replace(/\/$/, "");
}

export function getSearchEnvironment(): SearchEnvironment {
  return {
    mcpUrl: validateMcpUrl(requiredEnvironmentValue("SANITY_CONTEXT_MCP_URL")),
    organizationToken: requiredEnvironmentValue("SANITY_ORGANIZATION_TOKEN"),
    geminiApiKey: requiredEnvironmentValue("GEMINI_API_KEY"),
    geminiModel:
      process.env.GEMINI_SEARCH_MODEL?.trim() || "gemini-2.5-flash",
  };
}

async function fetchInitialContext(
  environment: SearchEnvironment,
  signal: AbortSignal,
) {
  const cached = initialContextCache;

  if (
    cached &&
    cached.endpoint === environment.mcpUrl &&
    cached.expiresAt > Date.now()
  ) {
    return cached.value;
  }

  const url = new URL(environment.mcpUrl);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/initial-context`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${environment.organizationToken}`,
      },
      redirect: "error",
      signal,
    });

    if (!response.ok) {
      console.error("Sanity initial context request failed", response.status);
      return null;
    }

    const value = await response.text();
    initialContextCache = {
      endpoint: environment.mcpUrl,
      value,
      expiresAt: Date.now() + INITIAL_CONTEXT_TTL_MS,
    };

    return value;
  } catch (error) {
    if (signal.aborted) {
      throw signal.reason ?? error;
    }

    console.error("Sanity initial context request failed");
    return null;
  }
}

export async function connectToSearchContext(
  environment: SearchEnvironment,
  signal: AbortSignal,
) {
  const clientPromise = createMCPClient({
    transport: {
      type: "http",
      url: environment.mcpUrl,
      headers: {
        Authorization: `Bearer ${environment.organizationToken}`,
      },
      redirect: "error",
    },
    initializationOptions: { timeout: 10_000 },
    maxRetries: 1,
  });
  const initialContextPromise = fetchInitialContext(environment, signal);

  let client: MCPClient | undefined;

  try {
    [client] = await Promise.all([clientPromise, initialContextPromise]);
    const initialContext = await initialContextPromise;
    const tools = await client.tools();

    for (const name of Object.keys(tools)) {
      if (!ALLOWED_TOOL_NAMES.has(name)) {
        delete tools[name];
      }
    }

    if (initialContext) {
      delete tools.initial_context;
    }

    if (!tools.groq_query) {
      throw new Error("Sanity Context did not provide the GROQ query tool.");
    }

    return { client, initialContext, tools };
  } catch (error) {
    client ??= await clientPromise.catch(() => undefined);
    await client?.close();
    throw error;
  }
}
