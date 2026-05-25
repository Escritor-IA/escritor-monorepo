import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  PageBreak,
  AlignmentType,
} from "docx";
import type { Chapter, Project } from "@/types";

// ── HTML → plain text ──────────────────────────────────────────

function extractText(html: string): string {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll("p, h1, h2, h3, blockquote").forEach((el) =>
    el.appendChild(document.createTextNode("\n\n"))
  );
  return (div.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

// ── HTML → docx paragraphs ─────────────────────────────────────

function nodeToRuns(node: ChildNode, bold = false, italics = false): TextRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || "";
    if (!text) return [];
    return [new TextRun({ text, bold, italics })];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  const isBold = bold || tag === "strong" || tag === "b";
  const isItalic = italics || tag === "em" || tag === "i";

  const runs: TextRun[] = [];
  el.childNodes.forEach((child) => runs.push(...nodeToRuns(child, isBold, isItalic)));
  return runs;
}

function htmlToDocxParagraphs(html: string): Paragraph[] {
  if (!html) return [];
  const div = document.createElement("div");
  div.innerHTML = html;
  const paragraphs: Paragraph[] = [];

  for (const el of div.children) {
    const tag = el.tagName.toLowerCase();

    if (tag === "h1") {
      paragraphs.push(
        new Paragraph({
          children: nodeToRuns(el),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 480, after: 240 },
        })
      );
    } else if (tag === "h2") {
      paragraphs.push(
        new Paragraph({
          children: nodeToRuns(el),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 180 },
        })
      );
    } else if (tag === "blockquote") {
      const inner = el.querySelector("p") || el;
      paragraphs.push(
        new Paragraph({
          children: nodeToRuns(inner, false, true),
          indent: { left: 720 },
          spacing: { before: 200, after: 200 },
        })
      );
    } else if (tag === "p") {
      const runs = nodeToRuns(el);
      if (runs.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: runs,
            spacing: { after: 200 },
          })
        );
      }
    }
  }

  return paragraphs;
}

// ── Download helper ────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "").trim().slice(0, 80) || "documento";
}

// ── PDF via print (iframe — sem library, qualidade máxima) ─────

const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Newsreader', Georgia, 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 1.72;
    color: #1a1640;
  }

  .page {
    max-width: 165mm;
    margin: 0 auto;
    padding: 20mm 0;
  }

  .chapter-label {
    font-family: monospace;
    font-size: 9pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #6b6788;
    margin-bottom: 12pt;
  }

  .chapter-title {
    font-size: 26pt;
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin-bottom: 18pt;
  }

  .divider {
    display: flex;
    gap: 4pt;
    margin-bottom: 28pt;
  }
  .divider span:first-child { width: 28pt; height: 1pt; background: #0f7a4f; display: block; }
  .divider span:last-child  { width: 4pt;  height: 1pt; background: #0f7a4f; display: block; }

  h1 { font-size: 15pt; font-weight: 500; margin: 28pt 0 10pt; }
  h2 { font-size: 13pt; font-weight: 500; margin: 22pt 0 8pt; color: #3b375f; }

  p { margin-bottom: 10pt; }

  blockquote {
    margin: 14pt 0 14pt 18pt;
    padding-left: 12pt;
    border-left: 2pt solid #0f7a4f;
    font-style: italic;
    color: #3b375f;
    font-size: 12.5pt;
  }
  blockquote p { margin-bottom: 0; }

  strong { font-weight: 600; }

  @page {
    margin: 25mm 30mm;
    size: A4;
  }

  @media print {
    .page { padding: 0; max-width: 100%; }
    .page-break { page-break-before: always; }
  }
`;

function buildPrintHtml(chapters: Array<{ label: string; title: string; content: string }>, bookTitle?: string): string {
  const pages = chapters.map((ch, i) => {
    const isFirst = i === 0;
    return `
      <div class="page${!isFirst ? " page-break" : ""}">
        ${bookTitle ? `<div class="chapter-label">${ch.label}</div>` : ""}
        <div class="chapter-title">${ch.title}</div>
        <div class="divider"><span></span><span></span></div>
        <div class="content">${ch.content || "<p><em>Página em branco.</em></p>"}</div>
      </div>
    `;
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${bookTitle || chapters[0]?.title || "Documento"}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  ${pages.join("\n")}
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 500);
    });
  </script>
</body>
</html>`;
}

function printHtml(html: string) {
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed", top: "-9999px", left: "-9999px",
    width: "0", height: "0", border: "none",
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }

  doc.open();
  doc.write(html);
  doc.close();

  // Clean up after print dialog closes
  iframe.contentWindow?.addEventListener("afterprint", () => {
    document.body.removeChild(iframe);
  });
}

// ── Chapter exports ────────────────────────────────────────────

export async function exportChapterDocx(chapter: Chapter) {
  const title = chapter.title || `Capítulo ${chapter.number}`;
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 56 })],
            spacing: { after: 480 },
            alignment: AlignmentType.LEFT,
          }),
          ...htmlToDocxParagraphs(chapter.content),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, sanitizeFilename(title) + ".docx");
}

export function exportChapterPdf(chapter: Chapter) {
  const title = chapter.title || `Capítulo ${chapter.number}`;
  const html = buildPrintHtml([
    { label: `Capítulo ${String(chapter.number).padStart(2, "0")}`, title, content: chapter.content },
  ]);
  printHtml(html);
}

// ── Book exports ───────────────────────────────────────────────

export async function exportBookDocx(project: Project, chapters: Chapter[]) {
  const sorted = [...chapters].sort((a, b) => a.number - b.number);

  const children: Paragraph[] = [];

  // Title page
  children.push(
    new Paragraph({
      children: [new TextRun({ text: project.title, bold: true, size: 72 })],
      spacing: { after: 960 },
      alignment: AlignmentType.CENTER,
    })
  );

  sorted.forEach((ch, idx) => {
    if (idx > 0) {
      // Page break before each chapter
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    const chapterTitle = ch.title || `Capítulo ${ch.number}`;

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Capítulo ${String(ch.number).padStart(2, "0")}`,
            color: "6b6788",
            size: 18,
          }),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: chapterTitle, bold: true, size: 48 })],
        spacing: { after: 360 },
      }),
      ...htmlToDocxParagraphs(ch.content)
    );
  });

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, sanitizeFilename(project.title) + ".docx");
}

export function exportBookPdf(project: Project, chapters: Chapter[]) {
  const sorted = [...chapters].sort((a, b) => a.number - b.number);
  const pages = sorted.map((ch) => ({
    label: `Capítulo ${String(ch.number).padStart(2, "0")}`,
    title: ch.title || `Capítulo ${ch.number}`,
    content: ch.content,
  }));

  const html = buildPrintHtml(pages, project.title);
  printHtml(html);
}

// ── Word count helper ──────────────────────────────────────────

export function countWords(html: string): number {
  const text = extractText(html).trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}
