import { useState, useMemo } from "react";
import { diffLines, diffChars } from "diff";
import "./DiffViewer.css";

// Render line with char-level diff
function CharLevelLine({ oldLine, newLine, lineType }) {
  const charDiff = useMemo(() => {
    return diffChars(oldLine, newLine);
  }, [oldLine, newLine]);

  return (
    <div className={`diff-line ${lineType}`}>
      <span className="line-prefix">{lineType === "added" ? "+" : lineType === "removed" ? "-" : " "}</span>
      <span className="line-content">
        {charDiff.map((part, i) => {
          const className = part.added
            ? "char-diff added"
            : part.removed
              ? "char-diff removed"
              : "";
          return (
            <span key={i} className={className}>
              {part.value}
            </span>
          );
        })}
      </span>
    </div>
  );
}

// Smart diff viewer: combines line + char diffs
function GitHubLikeDiff({ oldText, newText }) {
  const diff = useMemo(() => diffLines(oldText, newText), [oldText, newText]);

  const lines = [];
  for (let i = 0; i < diff.length; i++) {
    const part = diff[i];

    if (part.added && i > 0 && diff[i - 1].removed) {
      // Matched pair: removed + added => show char diff between them
      const removedPart = diff[i - 1];
      const removedLines = removedPart.value.split("\n");
      const addedLines = part.value.split("\n");

      const max = Math.max(removedLines.length, addedLines.length);

      for (let j = 0; j < max; j++) {
        const oldLine = removedLines[j] || "";
        const newLine = addedLines[j] || "";
        if (oldLine || newLine) {
          lines.push(
            <CharLevelLine
              key={`change-${i}-${j}`}
              oldLine={oldLine}
              newLine={newLine}
              lineType={oldLine && !newLine ? "removed" : "added"}
            />
          );
        }
      }
      continue; // skip rendering this "added" line again
    }

    if (part.removed && (i + 1 < diff.length && diff[i + 1].added)) {
      continue; // handled in the added block above
    }

    part.value.split("\n").forEach((line, j, arr) => {
      if (j === arr.length - 1 && line === "") return;

      lines.push(
        <div
          key={`line-${i}-${j}`}
          className={`diff-line ${part.added ? "added" : part.removed ? "removed" : ""}`}
        >
          <span className="line-prefix">
            {part.added ? "+" : part.removed ? "-" : " "}
          </span>
          <span className="line-content">{line}</span>
        </div>
      );
    });
  }

  return <div className="diff-output-container">{lines}</div>;
}

const DiffViewer = () => {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");

  const countLines = (text) => text.split("\n").filter(Boolean).length;

  return (
    <div className="diffviewer-container">

      <div className="diff-header">
        <b>Diff Editor</b>
        <label>
          Lines {countLines(text1)} - {countLines(text2)}
        </label>
      </div>
      <div className="diff-layout">
        <div className="text-column">
          <div className="text-box">
            <textarea
              value={text1}
              placeholder="Enter text here..."
              onChange={(e) => setText1(e.target.value)}
            />
          </div>
          <div className="text-box">
            <textarea
              value={text2}
              placeholder="Enter text here..."
              onChange={(e) => setText2(e.target.value)}
            />
          </div>
        </div>
        <div className="diff-column">
          <div>Difference</div>
          <GitHubLikeDiff oldText={text1} newText={text2} />
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;
