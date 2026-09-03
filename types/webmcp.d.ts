interface WebMCPToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

interface WebMCPTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: WebMCPToolAnnotations;
  execute: (input: unknown) => unknown;
}

interface WebMCPContext {
  registerTool: (tool: WebMCPTool, options?: { signal?: AbortSignal }) => void | Promise<void>;
}

interface Document {
  readonly modelContext?: WebMCPContext;
}
