import React, { useState, useEffect } from "react";
import "./Parser.css";

function getJsonErrorLocation(jsonText) {
    try {
        JSON.parse(jsonText);
        return null;
    } catch (e) {
        const match = e.message.match(/at position (\d+)/);
        if (match) {
            const pos = parseInt(match[1], 10);
            const lines = jsonText.slice(0, pos).split("\n");
            return `Error on line ${lines.length}: ${e.message}`;
        }
        return e.message;
    }
}

function SyntaxHighlightedJson({ data, level = 0 }) {
    const [collapsed, setCollapsed] = useState(false);

    if (typeof data === "object" && data !== null) {
        const isArray = Array.isArray(data);
        const keys = Object.keys(data);

        return (
            <div style={{ paddingLeft: 20 * level }}>
                <span className="toggle" onClick={() => setCollapsed(!collapsed)}>
                    [{collapsed ? "+" : "-"}]
                </span>
                <span className="bracket">{isArray ? "[" : "{"}</span>
                {!collapsed && (
                    <div>
                        {keys.map((key, i) => (
                            <div key={i}>
                                {!isArray && (
                                    <span className="key">"{key}"</span>
                                )}
                                {!isArray && <span className="colon">: </span>}
                                <SyntaxHighlightedJson data={data[key]} level={level + 1} />
                                {i < keys.length - 1 && <span className="comma">,</span>}
                            </div>
                        ))}
                    </div>
                )}
                <span className="bracket">{isArray ? "]" : "}"}</span>
            </div>
        );
    }

    return (
        <span
            className={`value ${typeof data === "string"
                ? "string"
                : typeof data === "number"
                    ? "number"
                    : typeof data === "boolean"
                        ? "boolean"
                        : "null"
                }`}
        >
            {typeof data === "string" ? `"${data}"` : String(data)}
        </span>
    );
}

const JsonEditorViewer = () => {
    const [input, setInput] = useState('{}');
    const [error, setError] = useState(null);
    const [parsed, setParsed] = useState(null);

    useEffect(() => {
        try {
            const json = JSON.parse(input);
            setParsed(json);
            setError(null);
        } catch {
            setParsed(null);
            setError(getJsonErrorLocation(input));
        }
    }, [input]);

    const beautifyJson = () => {
        try {
            const obj = JSON.parse(input);
            setInput(JSON.stringify(obj, null, 2));
        } catch (e) {
            setError(getJsonErrorLocation(input));
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(input);
    };

    return (
        <div className="flex flex-row page-wrapper">
            <div className="toolbar">
                <b>JSON Editor</b>
                <div>
                    <button onClick={beautifyJson}>Beautify</button>
                    <button onClick={copyToClipboard}>Copy</button>
                </div>
            </div>
            <div className="json-editor-viewer">
                <div className="main-section">

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className={`json-input ${error ? "has-error" : ""}`}
                        spellCheck={false}
                    />
                </div>

                {error && <div className="error-msg">{error}</div>}

                {parsed && (
                    <div className="json-output">
                        <SyntaxHighlightedJson data={parsed} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default JsonEditorViewer;
