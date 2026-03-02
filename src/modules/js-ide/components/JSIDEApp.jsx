import { lazy, useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Braces } from "lucide-react";
import SubAppToolbar from "../../../shared/components/SubAppToolbar";
import { useDocuments } from "../../../shared/hooks/useDocuments";

const CodeEditor = lazy(() => import("./CodeEditor"));
const CodeRunner = lazy(() => import("./CodeRunner"));

const CODE_TEMPLATES = [
	{
		label: "Hello World",
		code: `console.log("Hello, World!");`,
	},
	{
		label: "Array Methods",
		code: `const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

console.log("Original:", numbers);
console.log("Doubled:", numbers.map(n => n * 2));
console.log("Even:", numbers.filter(n => n % 2 === 0));
console.log("Sum:", numbers.reduce((a, b) => a + b, 0));
console.log("First > 5:", numbers.find(n => n > 5));`,
	},
	{
		label: "Object Destructuring",
		code: `const user = {
  name: "Alice",
  age: 30,
  address: { city: "Wonderland", zip: "12345" },
  hobbies: ["reading", "chess", "gardening"],
};

const { name, age, address: { city } } = user;
console.log(\`\${name}, \${age}, from \${city}\`);

const [first, ...rest] = user.hobbies;
console.log("Favorite:", first);
console.log("Others:", rest);`,
	},
	{
		label: "Promises & Async",
		code: `function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("Starting...");
  await delay(500);
  console.log("After 500ms");
  await delay(500);
  console.log("After 1000ms");
  return "Done!";
}

run().then(result => console.log(result));`,
	},
	{
		label: "Classes & Inheritance",
		code: `class Shape {
  constructor(name) { this.name = name; }
  area() { return 0; }
  toString() { return \`\${this.name}: area = \${this.area().toFixed(2)}\`; }
}

class Circle extends Shape {
  constructor(r) { super("Circle"); this.r = r; }
  area() { return Math.PI * this.r ** 2; }
}

class Rectangle extends Shape {
  constructor(w, h) { super("Rectangle"); this.w = w; this.h = h; }
  area() { return this.w * this.h; }
}

const shapes = [new Circle(5), new Rectangle(4, 6), new Circle(3)];
shapes.forEach(s => console.log(s.toString()));`,
	},
	{
		label: "Console Methods",
		code: `console.log("This is a log message");
console.info("This is an info message");
console.warn("This is a warning");
console.error("This is an error");

console.time("loop");
let sum = 0;
for (let i = 0; i < 1000000; i++) sum += i;
console.timeEnd("loop");
console.log("Sum:", sum);

for (let i = 0; i < 3; i++) console.count("iteration");

console.log({ name: "Alice", scores: [95, 87, 92] });`,
	},
	{
		label: "Closures & Scope",
		code: `function createCounter(initial = 0) {
  let count = initial;
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
  };
}

const counter = createCounter(10);
console.log("Initial:", counter.value());
counter.increment();
counter.increment();
counter.increment();
console.log("After 3 increments:", counter.value());
counter.decrement();
console.log("After 1 decrement:", counter.value());

const double = (n) => n * 2;
const triple = (n) => n * 3;
console.log("double(5):", double(5));
console.log("triple(5):", triple(5));`,
	},
	{
		label: "Error Handling",
		code: `function divide(a, b) {
  if (typeof a !== "number" || typeof b !== "number")
    throw new TypeError("Arguments must be numbers");
  if (b === 0) throw new RangeError("Cannot divide by zero");
  return a / b;
}

try {
  console.log("10 / 2 =", divide(10, 2));
  console.log("10 / 0 =", divide(10, 0));
} catch (err) {
  console.error(\`\${err.name}: \${err.message}\`);
}

try {
  console.log(divide("a", 2));
} catch (err) {
  console.error(\`\${err.name}: \${err.message}\`);
} finally {
  console.log("Division tests complete");
}`,
	},
	{
		label: "Map, Set & Iterators",
		code: `const userRoles = new Map([
  ["alice", "admin"],
  ["bob", "editor"],
  ["carol", "viewer"],
]);

console.log("Alice is:", userRoles.get("alice"));
userRoles.set("dave", "editor");
console.log("All users:", [...userRoles.keys()]);

const tags = new Set(["js", "react", "node", "js", "react"]);
console.log("Unique tags:", [...tags]);
tags.add("typescript");
console.log("Has react:", tags.has("react"));
console.log("Size:", tags.size);`,
	},
];

const JSIDEApp = () => {
	const defaultCode = `// Welcome to JS Playground
console.log("Hello JavaScript!");`;

	const {
		documents, currentId, title, content, setContent,
		setCurrentDocId, createDoc, saveAs, renameDoc, deleteDoc, isSaving,
	} = useDocuments({
		appId: "js-ide",
		defaultTitle: "Untitled JS",
		initialContent: { code: defaultCode },
		meta: { language: "javascript" },
	});

	const code = content?.code ?? defaultCode;

	const [showTemplates, setShowTemplates] = useState(false);
	const templateRef = useRef(null);

	const handleClickOutside = useCallback((e) => {
		if (templateRef.current && !templateRef.current.contains(e.target)) {
			setShowTemplates(false);
		}
	}, []);

	useEffect(() => {
		if (showTemplates) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [showTemplates, handleClickOutside]);

	const applyTemplate = (template) => {
		setContent({ code: template.code });
		setShowTemplates(false);
	};

	return (
		<div className="h-full w-full flex flex-col min-h-0" style={{ background: "var(--bg-color)" }}>
			<div className="p-3 pb-0">
				<SubAppToolbar
					documents={documents}
					currentId={currentId}
					currentTitle={title}
					onSelect={setCurrentDocId}
					onRename={renameDoc}
					onNew={() => createDoc("Untitled JS", { code: defaultCode })}
					onSaveAs={(name) => saveAs(name)}
					onDelete={() => deleteDoc()}
					status={isSaving ? "saving" : "saved"}
				/>
			</div>

			<div className="flex items-center gap-2 px-3 py-1">
				<div className="relative" ref={templateRef}>
					<button
						type="button"
						className="toolbar-btn"
						onClick={() => setShowTemplates((v) => !v)}
						style={{ fontSize: "0.75rem", padding: "4px 10px" }}
					>
						<Braces size={13} />
						Templates
						<ChevronDown size={11} />
					</button>
					{showTemplates && (
						<div className="jspl-template-menu">
							{CODE_TEMPLATES.map((t) => (
								<button
									key={t.label}
									type="button"
									className="jspl-template-item"
									onClick={() => applyTemplate(t)}
								>
									{t.label}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			<div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-hidden border rounded-xl m-3 mt-1" style={{ borderColor: "var(--border-color)" }}>
				<CodeEditor
					initialCode={code}
					onCodeChange={(next) => setContent({ code: next })}
				/>
				<CodeRunner code={code} />
			</div>
		</div>
	);
};

export default JSIDEApp;
