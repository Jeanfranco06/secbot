import { useMemo } from "react";

/**
 * Clean trailing citation lists that LLMs often generate at the end of answers,
 * e.g., "[1] . [2] . [3] . [4]" or "Doc [1]: ..."
 * since we already render dedicated interactive CitationCards below.
 */
function cleanModelResponseText(rawText) {
  if (!rawText) return "";
  const lines = rawText.split("\n");

  // Remove trailing empty lines and trailing citation-only lines
  while (lines.length > 0) {
    const last = lines[lines.length - 1].trim();
    if (!last) {
      lines.pop();
      continue;
    }
    // Matches patterns like "[1] . [2] . [3] . [4]" or "[1], [2], [3]" or "Fuentes: [1], [2]"
    const isCitationLine = /^(\s*\[\d+\]\s*[,.•·-]?\s*)+$/.test(last) ||
      /^fuentes?\s*(consultadas?|citadas?)?:?\s*(\[\d+\]\s*[,.•·-]?\s*)*$/i.test(last);

    if (isCitationLine) {
      lines.pop();
    } else {
      break;
    }
  }

  return lines.join("\n").trim();
}

/**
 * Lightweight, zero-dependency safe formatter for AI responses.
 * Parses bold (**text**), code (`text`), bullet lists, numbered lists, headings, and paragraphs.
 */
export function FormattedMessage({ text }) {
  const cleanedText = useMemo(() => cleanModelResponseText(text), [text]);

  const elements = useMemo(() => {
    if (!cleanedText) return null;

    const lines = cleanedText.split("\n");
    const blocks = [];
    let currentList = null;

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();

      // Empty line -> flush active list
      if (!trimmed) {
        if (currentList) {
          blocks.push(currentList);
          currentList = null;
        }
        return;
      }

      // Check for bullet list item: starts with "- ", "* ", or "• "
      const isBullet = /^[-*•]\s+/.test(trimmed);
      // Check for numbered list item: starts with "1. ", "2. ", etc.
      const isNumbered = /^\d+\.\s+/.test(trimmed);

      if (isBullet || isNumbered) {
        const content = trimmed.replace(/^[-*•]\s+|\d+\.\s+/, "");
        if (!currentList || currentList.type !== (isBullet ? "ul" : "ol")) {
          if (currentList) blocks.push(currentList);
          currentList = {
            type: isBullet ? "ul" : "ol",
            key: `list-${lineIdx}`,
            items: [],
          };
        }
        currentList.items.push(content);
        return;
      }

      // Not a list item -> flush active list
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }

      // Check for headings
      if (trimmed.startsWith("### ")) {
        blocks.push({ type: "h4", key: `h-${lineIdx}`, text: trimmed.slice(4) });
      } else if (trimmed.startsWith("## ")) {
        blocks.push({ type: "h3", key: `h-${lineIdx}`, text: trimmed.slice(3) });
      } else if (trimmed === "---" || trimmed === "***") {
        blocks.push({ type: "hr", key: `hr-${lineIdx}` });
      } else {
        blocks.push({ type: "p", key: `p-${lineIdx}`, text: trimmed });
      }
    });

    if (currentList) {
      blocks.push(currentList);
    }

    return blocks;
  }, [cleanedText]);

  const renderFormattedInline = (str) => {
    const tokens = [];
    let remaining = str;
    let keyIdx = 0;

    // Matches **bold**, `code`, and [n] citations
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[\d+\])/;

    while (remaining) {
      const match = remaining.match(regex);
      if (!match) {
        tokens.push(remaining);
        break;
      }

      const matchIndex = match.index;
      if (matchIndex > 0) {
        tokens.push(remaining.slice(0, matchIndex));
      }

      const raw = match[0];
      if (raw.startsWith("**") && raw.endsWith("**")) {
        tokens.push(
          <strong key={`b-${keyIdx++}`} className="fmt-bold">
            {raw.slice(2, -2)}
          </strong>
        );
      } else if (raw.startsWith("`") && raw.endsWith("`")) {
        tokens.push(
          <code key={`c-${keyIdx++}`} className="fmt-code">
            {raw.slice(1, -1)}
          </code>
        );
      } else if (/^\[\d+\]$/.test(raw)) {
        tokens.push(
          <span key={`cite-${keyIdx++}`} className="fmt-cite-badge" title={`Fuente normativa ${raw}`}>
            {raw}
          </span>
        );
      }

      remaining = remaining.slice(matchIndex + raw.length);
    }

    return tokens;
  };

  if (!elements) return null;

  return (
    <div className="formatted-msg-body">
      {elements.map((block) => {
        if (block.type === "ul") {
          return (
            <ul key={block.key} className="fmt-ul">
              {block.items.map((it, i) => (
                <li key={i}>{renderFormattedInline(it)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={block.key} className="fmt-ol">
              {block.items.map((it, i) => (
                <li key={i}>{renderFormattedInline(it)}</li>
              ))}
            </ol>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={block.key} className="fmt-h3">
              {renderFormattedInline(block.text)}
            </h3>
          );
        }
        if (block.type === "h4") {
          return (
            <h4 key={block.key} className="fmt-h4">
              {renderFormattedInline(block.text)}
            </h4>
          );
        }
        if (block.type === "hr") {
          return <hr key={block.key} className="fmt-hr" />;
        }
        return (
          <p key={block.key} className="fmt-p">
            {renderFormattedInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
