import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Play, Trash2, Terminal, Loader2 } from "lucide-react";
import { useKeyboardShortcuts, formatShortcut } from "../../../shared/hooks/useKeyboardShortcuts";

const LOG_FILTERS = ["all", "log", "error", "warn", "info"];

const LOG_BADGE_STYLE = {
	error: { background: "rgba(222, 53, 11, 0.12)", color: "var(--accent-red)" },
	warn: { background: "rgba(255, 153, 31, 0.12)", color: "var(--accent-yellow)" },
	info: { background: "rgba(0, 101, 255, 0.12)", color: "var(--accent-blue)" },
	log: { background: "var(--border-subtle)", color: "var(--text-muted)" },
};

const LOG_TEXT_COLOR = {
	error: "var(--accent-red)",
	warn: "var(--accent-yellow)",
	info: "var(--accent-blue)",
	log: "var(--text-color)",
};

function usePersistedState(key, defaultValue) {
	const [value, setValue] = useState(() => {
		try {
			const stored = localStorage.getItem(key);
			return stored !== null ? JSON.parse(stored) : defaultValue;
		} catch {
			return defaultValue;
		}
	});
	useEffect(() => {
		try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
	}, [key, value]);
	return [value, setValue];
}

export default function CodeRunner({ code = "" }) {
	const iframeRef = useRef(null);
	const logContainerRef = useRef(null);
	const debounceTimerRef = useRef(null);
	const runIdRef = useRef(0);

	const [logs, setLogs] = useState([]);
	const [execTime, setExecTime] = useState(null);
	const [isRunning, setIsRunning] = useState(false);
	const [autoRun, setAutoRun] = usePersistedState("jspl-auto-run", true);
	const [filter, setFilter] = useState("all");

	const runCode = useCallback(() => {
		if (!code.trim()) return;

		const currentRunId = ++runIdRef.current;
		setIsRunning(true);
		setLogs([]);
		setExecTime(null);

		const escapedCode = code
			.replace(/\\/g, "\\\\")
			.replace(/`/g, "\\`")
			.replace(/<\/script>/gi, "<\\/script>");

		const sandboxHtml = `<!DOCTYPE html><html><head><script>(function(){
var start=performance.now(),logId=0,timers={},counts={},RID=${currentRunId};
function stringify(a){
if(a instanceof Error)return a.name+": "+a.message+"\\n"+a.stack;
if(typeof a==="object"){try{return JSON.stringify(a,null,2)}catch(e){return"[Unserializable]"}}
return String(a);
}
function send(type){
var args=[].slice.call(arguments,1);
parent.postMessage({source:"runner",runId:RID,action:"log",
entry:{id:logId++,type:type,message:args.map(stringify).join(" "),ts:(performance.now()-start).toFixed(1)}},"*");
}
function done(){parent.postMessage({source:"runner",runId:RID,action:"done",time:performance.now()-start},"*")}
console.log=function(){send.apply(null,["log"].concat([].slice.call(arguments)))};
console.error=function(){send.apply(null,["error"].concat([].slice.call(arguments)))};
console.warn=function(){send.apply(null,["warn"].concat([].slice.call(arguments)))};
console.info=function(){send.apply(null,["info"].concat([].slice.call(arguments)))};
console.clear=function(){parent.postMessage({source:"runner",runId:RID,action:"clear"},"*")};
console.time=function(l){timers[l||"default"]=performance.now()};
console.timeEnd=function(l){l=l||"default";if(timers[l]!=null){send("log",l+": "+(performance.now()-timers[l]).toFixed(3)+"ms");delete timers[l]}};
console.count=function(l){l=l||"default";counts[l]=(counts[l]||0)+1;send("log",l+": "+counts[l])};
try{
var result=(new Function(\`${escapedCode}\`))();
if(result&&typeof result.then==="function"){
result.then(function(){done()}).catch(function(e){send("error",e.stack||e.message);done()});
setTimeout(done,5000);
}else{done()}
}catch(e){send("error",e.stack||e.message);done()}
})();<\/script></head><body></body></html>`;

		if (iframeRef.current) {
			iframeRef.current.srcdoc = sandboxHtml;
		}
	}, [code]);

	const clearLogs = () => {
		setLogs([]);
		setExecTime(null);
	};

	const shortcuts = useMemo(() => ({
		run: { mod: true, shift: false, key: "Enter" },
	}), []);

	useKeyboardShortcuts([
		{ shortcut: shortcuts.run, action: runCode },
	]);

	useEffect(() => {
		if (!autoRun) return;
		if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		debounceTimerRef.current = setTimeout(() => runCode(), 2000);
		return () => clearTimeout(debounceTimerRef.current);
	}, [code, runCode, autoRun]);

	useEffect(() => {
		const listener = (e) => {
			if (e.data?.source !== "runner") return;
			if (e.data.runId !== runIdRef.current) return;

			switch (e.data.action) {
				case "log":
					setLogs((prev) => [...prev, e.data.entry]);
					break;
				case "clear":
					setLogs([]);
					break;
				case "done":
					setExecTime(e.data.time?.toFixed(2));
					setIsRunning(false);
					break;
			}
		};
		window.addEventListener("message", listener);
		return () => window.removeEventListener("message", listener);
	}, []);

	useEffect(() => {
		if (logContainerRef.current) {
			logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
		}
	}, [logs]);

	const filteredLogs = useMemo(() => {
		if (filter === "all") return logs;
		return logs.filter((l) => l.type === filter);
	}, [logs, filter]);

	const logCounts = useMemo(() => {
		const c = { all: logs.length, log: 0, error: 0, warn: 0, info: 0 };
		for (const l of logs) {
			if (c[l.type] != null) c[l.type]++;
		}
		return c;
	}, [logs]);

	return (
		<div className="flex flex-col h-full w-full overflow-hidden" style={{ background: "var(--panel-color)" }}>
			<div
				className="flex items-center justify-between px-3 py-1.5 border-b shrink-0"
				style={{ borderColor: "var(--border-color)" }}
			>
				<div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
					<Terminal size={14} style={{ color: "var(--primary-color)" }} />
					Console
					{logs.length > 0 && (
						<span
							className="text-[10px] font-mono px-1.5 rounded-full"
							style={{ background: "var(--border-subtle)", color: "var(--text-muted)" }}
						>
							{logs.length}
						</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					{execTime && (
						<span
							className="text-[11px] font-mono px-2.5 py-0.5 rounded-full"
							style={{ color: "var(--text-muted)", background: "var(--bg-color)", border: "1px solid var(--border-color)" }}
						>
							{execTime}ms
						</span>
					)}
					<label className="jspl-toggle-label">
						<input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} />
						Auto
					</label>
					<button
						onClick={runCode}
						disabled={isRunning}
						className="toolbar-btn"
						data-tooltip={`Run (${formatShortcut(shortcuts.run)})`}
						style={{ fontSize: "0.75rem", padding: "4px 10px" }}
					>
						{isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
						{isRunning ? "Running" : "Run"}
					</button>
					<button
						onClick={clearLogs}
						className="toolbar-btn"
						style={{ fontSize: "0.75rem", padding: "4px 10px" }}
					>
						<Trash2 size={13} />
						Clear
					</button>
				</div>
			</div>

			{logs.length > 0 && (
				<div className="jspl-filter-bar" style={{ borderColor: "var(--border-color)" }}>
					{LOG_FILTERS.map((f) => (
						<button
							key={f}
							type="button"
							className={`jspl-filter-btn ${filter === f ? "jspl-filter-btn--active" : ""}`}
							onClick={() => setFilter(f)}
						>
							{f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
							{logCounts[f] > 0 && ` (${logCounts[f]})`}
						</button>
					))}
				</div>
			)}

			<div
				ref={logContainerRef}
				className="flex-1 overflow-auto p-3"
				style={{ fontFamily: "var(--font-mono)" }}
			>
				{filteredLogs.length === 0 ? (
					<p className="text-xs" style={{ color: "var(--text-muted)" }}>
						{logs.length > 0
							? `No ${filter} entries.`
							: autoRun
								? "No output yet. Code runs automatically after 2s."
								: `No output yet. Press Run or ${formatShortcut(shortcuts.run)}.`}
					</p>
				) : (
					filteredLogs.map((log) => (
						<div key={log.id} className="jspl-log-entry">
							<span
								className="jspl-log-badge"
								style={LOG_BADGE_STYLE[log.type] || LOG_BADGE_STYLE.log}
							>
								{log.type}
							</span>
							<span className="jspl-log-ts">{log.ts}ms</span>
							<pre
								className="jspl-log-message"
								style={{ color: LOG_TEXT_COLOR[log.type] || LOG_TEXT_COLOR.log }}
							>
								{log.message}
							</pre>
						</div>
					))
				)}
			</div>

			<iframe
				ref={iframeRef}
				title="sandbox"
				sandbox="allow-scripts"
				className="hidden"
			/>
		</div>
	);
}
