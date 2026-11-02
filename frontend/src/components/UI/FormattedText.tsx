import { Fragment, type ReactNode } from "react";

interface FormattedTextProps {
  text: string;
  fontSize?: number;
}

type Block =
  | { kind: "heading"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "paragraph"; text: string };

const HEADING = /^\s{0,3}#{1,6}\s+(.*)$/;
const BULLET = /^\s*[-*•]\s+(.*)$/;
const ORDERED = /^\s*\d+[.)]\s+(.*)$/;
const RULE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;

// Output of the model is untrusted: it is only ever turned into React elements
// (never HTML), so anything outside this tiny subset is rendered as plain text.
function cleanLegacy(line: string): string {
  return line.replace(/\$\\(?:right|to)arrow\$/g, "→").replace(/\$\\leftarrow\$/g, "←");
}

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = cleanLegacy(raw);
    const last = blocks[blocks.length - 1];

    if (!line.trim() || RULE.test(line)) {
      flushParagraph();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({ kind: "heading", text: heading[1].replace(/\*\*/g, "").trim() });
      continue;
    }

    const bullet = BULLET.exec(line);
    const ordered = bullet ? null : ORDERED.exec(line);
    const item = bullet ?? ordered;
    if (item) {
      flushParagraph();
      const isOrdered = !bullet;
      if (last?.kind === "list" && last.ordered === isOrdered) {
        last.items.push(item[1]);
      } else {
        blocks.push({ kind: "list", ordered: isOrdered, items: [item[1]] });
      }
      continue;
    }

    paragraph.push(line.trim());
  }
  flushParagraph();
  return blocks;
}

function renderInline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} style={{ fontWeight: 600, color: "var(--ink)" }}>
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part.replace(/\*\*/g, "")}</Fragment>
    ),
  );
}

export function FormattedText({ text, fontSize = 14 }: FormattedTextProps) {
  const blocks = parseBlocks(text);

  return (
    <div style={{ fontFamily: "var(--sans)", fontSize, lineHeight: 1.62, color: "var(--ink-2)" }}>
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          return (
            <div
              key={i}
              className="serif"
              style={{
                fontSize: fontSize + 2,
                fontWeight: 500,
                color: "var(--ink)",
                margin: i === 0 ? "0 0 6px" : "16px 0 6px",
              }}
            >
              {renderInline(block.text)}
            </div>
          );
        }
        if (block.kind === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag
              key={i}
              style={{
                margin: "0 0 8px",
                paddingLeft: 20,
                listStyleType: block.ordered ? "decimal" : "disc",
              }}
            >
              {block.items.map((item, j) => (
                <li key={j} style={{ marginBottom: 3 }}>
                  {renderInline(item)}
                </li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={i} style={{ margin: "0 0 8px" }}>
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
