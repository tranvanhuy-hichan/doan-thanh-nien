import { Fragment } from "react";

/** Định dạng nhẹ, an toàn (không render HTML): `## Tiêu đề`, `### Mục nhỏ`, `- gạch đầu dòng`, `1. đánh số`, `**đậm**`. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

export function RichText({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  const flushPara = () => { if (para.length) { blocks.push(<p key={blocks.length}>{inline(para.join(" "))}</p>); para = []; } };
  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(<Tag key={blocks.length} className={list.ordered ? "list-decimal" : "list-disc"}>{list.items.map((t, i) => <li key={i}>{inline(t)}</li>)}</Tag>);
    list = null;
  };
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); continue; }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^###\s+(.*)/))) { flushPara(); flushList(); blocks.push(<h3 key={blocks.length}>{inline(m[1])}</h3>); }
    else if ((m = line.match(/^##\s+(.*)/))) { flushPara(); flushList(); blocks.push(<h2 key={blocks.length}>{inline(m[1])}</h2>); }
    else if ((m = line.match(/^[-*•]\s+(.*)/))) { flushPara(); if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] }; } list.items.push(m[1]); }
    else if ((m = line.match(/^\d+[.)]\s+(.*)/))) { flushPara(); if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] }; } list.items.push(m[1]); }
    else { flushList(); para.push(line); }
  }
  flushPara(); flushList();
  return <div className="prose-doan">{blocks}</div>;
}
