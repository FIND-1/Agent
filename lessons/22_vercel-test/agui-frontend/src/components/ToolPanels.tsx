import {
  getToolName,
  isToolUIPart,
  type DynamicToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import { StreamdownText } from "./StreamdownText";
import "./ToolPanels.css";

type AnyToolPart = ToolUIPart | DynamicToolUIPart;

/**
 * 复习重点：先用 isToolUIPart 区分文本与工具，再按 getToolName 和 state 渲染组件。
 * 新工具需要新增输入/输出解析与面板；未知工具仍会降级显示原始输出。
 */

export type WebSearchToolInput = {
  query: string;
  count?: number;
};

export type WebSearchToolOutput = string;

export type SendMailToolInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

function streamValueToJson(value: unknown): JsonValue | undefined {
  if (value === undefined) return undefined;
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value as JsonValue[];
  }
  if (typeof value === "object") {
    return value as JsonValue;
  }
  return undefined;
}

function isWebSearchToolInput(v: JsonValue | undefined): v is WebSearchToolInput {
  if (v === null || v === undefined) return false;
  if (typeof v !== "object" || Array.isArray(v)) return false;
  const o = v as Record<string, JsonValue>;
  if (typeof o.query !== "string" || o.query.length === 0) return false;
  if (o.count !== undefined) {
    if (typeof o.count !== "number" || !Number.isFinite(o.count)) return false;
  }
  return true;
}

function parseWebSearchToolInput(
  input: JsonValue | undefined,
): WebSearchToolInput | undefined {
  if (!isWebSearchToolInput(input)) return undefined;
  const out: WebSearchToolInput = { query: input.query };
  if (input.count !== undefined) out.count = input.count;
  return out;
}

function parseSendMailToolInputPartial(
  input: JsonValue | undefined,
): Partial<SendMailToolInput> | undefined {
  if (input === null || input === undefined) return undefined;
  if (typeof input !== "object" || Array.isArray(input)) return undefined;
  const o = input as Record<string, JsonValue>;
  const out: Partial<SendMailToolInput> = {};
  if (typeof o.to === "string") out.to = o.to;
  if (typeof o.subject === "string") out.subject = o.subject;
  if (typeof o.text === "string") out.text = o.text;
  if (typeof o.html === "string") out.html = o.html;
  return Object.keys(out).length > 0 ? out : undefined;
}

function normalizeToolOutput(
  output: JsonValue | WebSearchToolOutput,
): WebSearchToolOutput {
  if (typeof output === "string") return output;
  return JSON.stringify(output, null, 2);
}

function formatDefaultToolString(text: WebSearchToolOutput): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.stringify(JSON.parse(trimmed) as JsonValue, null, 2);
    } catch {
      return text;
    }
  }
  return text;
}

type WebSearchResultItem = {
  ref: string;
  title: string;
  url: string;
  summary: string;
  siteName?: string;
  publishedAt?: string;
};

function parseWebSearchBlocks(text: WebSearchToolOutput): WebSearchResultItem[] {
  const blocks = text
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
  const items: WebSearchResultItem[] = [];

  for (const block of blocks) {
    const ref = block.match(/^引用:\s*(\d+)/m)?.[1] ?? "";
    const title = block.match(/标题:\s*(.+)/)?.[1]?.trim() ?? "";
    const url = block.match(/URL:\s*(\S+)/)?.[1]?.trim() ?? "";
    const summary =
      block.match(/摘要:\s*([\s\S]*?)(?=\n\s*网站名称:|\n\s*发布时间:|$)/)?.[1]?.trim() ??
      "";
    const siteName = block.match(/网站名称:\s*(.+)/)?.[1]?.trim();
    const publishedAt = block.match(/发布时间:\s*(\S+)/)?.[1]?.trim();

    if (title || url || summary || ref) {
      items.push({ ref, title, url, summary, siteName, publishedAt });
    }
  }

  return items;
}

function WebSearchToolPanel({
  input,
  output,
}: {
  input?: WebSearchToolInput;
  output: WebSearchToolOutput;
}) {
  const query = input?.query ?? null;
  const count = input?.count;
  const items = parseWebSearchBlocks(output);

  return (
    <div className="tool-panel tool-panel--web-search">
      <div className="tool-panel__head">
        <span className="tool-panel__label">Web search</span>
        {query ? (
          <span className="tool-panel__query">
            "{query}"
            {count != null ? (
              <span className="tool-panel__count"> - {count} results</span>
            ) : null}
          </span>
        ) : null}
      </div>
      {items.length > 0 ? (
        <ul className="tool-panel__results">
          {items.map((item, index) => (
            <li key={`${item.ref}-${index}`} className="tool-panel__result">
              {item.ref ? (
                <span className="tool-panel__ref">Ref {item.ref}</span>
              ) : null}
              {item.title ? (
                <div className="tool-panel__title">{item.title}</div>
              ) : null}
              {item.url ? (
                <a
                  className="tool-panel__url"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.url}
                </a>
              ) : null}
              {item.summary ? (
                <p className="tool-panel__summary">{item.summary}</p>
              ) : null}
              {item.siteName ? (
                <span className="tool-panel__site">{item.siteName}</span>
              ) : null}
              {item.publishedAt ? (
                <span className="tool-panel__time">{item.publishedAt}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <pre className="tool-panel__raw">{output}</pre>
      )}
    </div>
  );
}

function getPendingHint(
  name: string,
  inputJson: JsonValue | undefined,
): string | undefined {
  if (name === "web_search") {
    return parseWebSearchToolInput(inputJson)?.query;
  }
  if (name === "send_mail") {
    const input = parseSendMailToolInputPartial(inputJson);
    const subject = input?.subject?.trim();
    if (subject) return subject;
    const to = input?.to?.trim();
    if (to) return to;
  }
  return undefined;
}

function SendMailToolPanel({
  input,
  output,
  progress,
}: {
  input?: Partial<SendMailToolInput>;
  output: string;
  progress?: "input-streaming" | "input-available";
}) {
  const to = input?.to;
  const subject = input?.subject;
  const bodyText = input?.text;
  const bodyHtml = input?.html;
  const isStreaming = progress === "input-streaming";
  const inProgress = progress !== undefined;
  const bodyCaption = isStreaming ? "Body (streaming)" : "Body preview";

  return (
    <div
      className={`tool-panel tool-panel--send-mail${inProgress ? " tool-panel--send-mail-streaming" : ""}`}
      aria-busy={inProgress}
    >
      <div className="tool-panel__head tool-panel__head--send-mail">
        <span className="tool-panel__label tool-panel__label--send-mail">
          Send mail
        </span>
        {subject ? (
          <span className="tool-panel__mail-subject-hint">"{subject}"</span>
        ) : null}
      </div>
      <dl className="tool-panel__mail-fields">
        <div className="tool-panel__mail-row">
          <dt>To</dt>
          <dd>
            {to?.trim() ? to : "..."}
            {isStreaming && !to?.trim() ? (
              <span
                className="tool-panel__mail-cursor tool-panel__mail-cursor--inline"
                aria-hidden
              />
            ) : null}
          </dd>
        </div>
        <div className="tool-panel__mail-row">
          <dt>Subject</dt>
          <dd>
            {subject?.trim() ? subject : "..."}
            {isStreaming && to?.trim() && !subject?.trim() ? (
              <span
                className="tool-panel__mail-cursor tool-panel__mail-cursor--inline"
                aria-hidden
              />
            ) : null}
          </dd>
        </div>
      </dl>
      {bodyText || bodyHtml ? (
        <div className="tool-panel__mail-body-block">
          <div className="tool-panel__mail-body-caption">{bodyCaption}</div>
          <div className="tool-panel__mail-body-scroll">
            {bodyText ? (
              <pre className="tool-panel__mail-text">
                {bodyText}
                {isStreaming ? (
                  <span
                    className="tool-panel__mail-cursor tool-panel__mail-cursor--block"
                    aria-hidden
                  />
                ) : null}
              </pre>
            ) : isStreaming ? (
              <pre className="tool-panel__mail-text">
                {bodyHtml ?? ""}
                <span
                  className="tool-panel__mail-cursor tool-panel__mail-cursor--block"
                  aria-hidden
                />
              </pre>
            ) : (
              <pre className="tool-panel__mail-html">{bodyHtml ?? ""}</pre>
            )}
          </div>
        </div>
      ) : isStreaming ? (
        <div className="tool-panel__mail-body-block">
          <div className="tool-panel__mail-body-caption">{bodyCaption}</div>
          <div className="tool-panel__mail-body-scroll tool-panel__mail-body-scroll--empty">
            <span className="tool-panel__mail-body-placeholder">
              Waiting for body...
            </span>
            <span
              className="tool-panel__mail-cursor tool-panel__mail-cursor--block"
              aria-hidden
            />
          </div>
        </div>
      ) : null}
      {inProgress ? (
        <div
          className="tool-panel__mail-status tool-panel__mail-status--progress"
          role="status"
        >
          {progress === "input-streaming"
            ? "Generating mail parameters..."
            : "Sending mail..."}
        </div>
      ) : output.trim() ? (
        <div className="tool-panel__mail-status" role="status">
          {output}
        </div>
      ) : null}
    </div>
  );
}

function ToolPendingPanel({ name, hint }: { name: string; hint?: string }) {
  const isMail = name === "send_mail";
  return (
    <div
      className={`tool-panel tool-panel--pending${isMail ? " tool-panel--pending-mail" : ""}`}
      aria-busy="true"
    >
      <span className="tool-panel__pending-text">
        Calling <strong>{name}</strong>
        {hint ? <>: {hint}</> : "..."}
      </span>
    </div>
  );
}

function ToolErrorPanel({ name, message }: { name: string; message: string }) {
  return (
    <div className="tool-panel tool-panel--error" role="alert">
      <span className="tool-panel__label">{name}</span>
      <p className="tool-panel__err-msg">{message}</p>
    </div>
  );
}

function DefaultToolOutput({ value }: { value: JsonValue | WebSearchToolOutput }) {
  const text =
    typeof value === "string"
      ? formatDefaultToolString(value)
      : JSON.stringify(value, null, 2);
  return <pre className="tool-panel tool-panel--default">{text}</pre>;
}

function defaultToolValueFromStream(raw: unknown): JsonValue | WebSearchToolOutput {
  const jsonValue = streamValueToJson(raw);
  if (jsonValue !== undefined) return jsonValue;
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" || typeof raw === "boolean") return raw;
  if (raw === null) return null;
  return String(raw);
}

function ToolMessagePart({ part }: { part: AnyToolPart }) {
  const name = getToolName(part);

  if (part.state === "output-error") {
    return (
      <ToolErrorPanel name={name} message={part.errorText ?? "Tool call failed"} />
    );
  }

  if (part.state !== "output-available") {
    const inputJson = streamValueToJson("input" in part ? part.input : undefined);
    if (name === "send_mail") {
      const input = parseSendMailToolInputPartial(inputJson) ?? {};
      const progress: "input-streaming" | "input-available" =
        part.state === "input-available" ? "input-available" : "input-streaming";
      return <SendMailToolPanel input={input} output="" progress={progress} />;
    }
    const hint = getPendingHint(name, inputJson);
    return <ToolPendingPanel name={name} hint={hint} />;
  }

  const rawIn = "input" in part ? part.input : undefined;
  const rawOut = part.output;
  const inputJson = streamValueToJson(rawIn);
  const outputJson = streamValueToJson(rawOut);

  switch (name) {
    case "web_search": {
      const input = parseWebSearchToolInput(inputJson);
      const output = normalizeToolOutput(
        outputJson !== undefined ? outputJson : String(rawOut),
      );
      return <WebSearchToolPanel input={input} output={output} />;
    }
    case "send_mail": {
      const input = parseSendMailToolInputPartial(inputJson) ?? {};
      const output = normalizeToolOutput(
        outputJson !== undefined ? outputJson : String(rawOut),
      );
      return <SendMailToolPanel input={input} output={output} />;
    }
    default:
      return <DefaultToolOutput value={defaultToolValueFromStream(rawOut)} />;
  }
}

export type MessagePartProps = {
  part: UIMessage["parts"][number];
  textStreamActive?: boolean;
};

export function MessagePart({
  part,
  textStreamActive = false,
}: MessagePartProps) {
  if (part.type === "text") {
    return (
      <StreamdownText isStreaming={textStreamActive}>{part.text}</StreamdownText>
    );
  }
  if (isToolUIPart(part)) {
    return (
      <div className="chat-tool-wrap">
        <ToolMessagePart part={part} />
      </div>
    );
  }
  return null;
}
