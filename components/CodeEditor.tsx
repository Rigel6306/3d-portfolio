import TabBar from "./UI/codeEditor/TabBar";
import { useState, useEffect, useRef } from "react";
import SideBar from "./UI/codeEditor/SideBar";
import {
  LuCircleUserRound,
  LuFiles,
  LuGitMerge,
  LuSearch,
  LuSettings,
  LuX,
  LuTerminal,
  LuPlay,
  LuRefreshCw,
  LuCopy,
  LuCheck,
} from "react-icons/lu";
import SearchModal from "./UI/codeEditor/searchModal";

// ----------------------------------------------------------------------
// Interactive Widgets (Engaging content)
// ----------------------------------------------------------------------

// Widget 1: Code Puzzle - a small riddle that reveals answer on click
const CodePuzzle = () => {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="space-y-4">
      <div className="bg-[#1e1a2f] rounded-lg p-5 border border-purple-500/30 shadow-lg">
        <h3 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
          🧩 Code Conundrum
        </h3>
        <p className="text-gray-300 mt-2">
          "I speak without a mouth and hear without ears. I have no body, but I
          come alive with the wind. What am I?"
        </p>
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="mt-3 text-sm bg-purple-600/40 hover:bg-purple-600/60 px-3 py-1 rounded-md transition flex items-center gap-1"
          >
            <LuPlay size={12} /> Reveal Answer
          </button>
        ) : (
          <div className="mt-3 text-green-300 bg-black/40 p-2 rounded border border-green-500/30">
            💡 An <span className="font-bold">echo</span> — just like your code
            returns what you give it!
          </div>
        )}
      </div>
      <div className="bg-[#1e1a2f] rounded-lg p-5 border border-blue-500/30">
        <h3 className="text-lg font-semibold text-blue-300">✨ Daily Coding Snippet</h3>
        <pre className="text-sm text-blue-200 bg-black/40 p-3 rounded mt-2 overflow-x-auto">
{`const inspire = () => {
  return "Write code that feels like poetry.";
};
console.log(inspire());`}
        </pre>
      </div>
    </div>
  );
};

// Widget 2: Color Explorer with real-time RGB sliders
const ColorExplorer = () => {
  const [r, setR] = useState(120);
  const [g, setG] = useState(80);
  const [b, setB] = useState(200);
  const bgColor = `rgb(${r}, ${g}, ${b})`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bgColor);
    // temporary feedback (not persisting state, just alert style)
    alert(`Copied ${bgColor} to clipboard!`);
  };

  return (
    <div className="space-y-5">
      <div className="bg-[#1e1a2f] rounded-lg p-5 border border-cyan-500/30">
        <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
          🎨 Chroma Playground
        </h3>
        <div
          className="h-32 rounded-md mt-3 transition-all duration-150 shadow-inner"
          style={{ backgroundColor: bgColor }}
        />
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            { label: "R", value: r, set: setR, color: "red-400" },
            { label: "G", value: g, set: setG, color: "green-400" },
            { label: "B", value: b, set: setB, color: "blue-400" },
          ].map(({ label, value, set, color }) => (
            <div key={label}>
              <label className={`text-${color} text-sm`}>{label}</label>
              <input
                type="range"
                min="0"
                max="255"
                value={value}
                onChange={(e) => set(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <span className="text-xs text-gray-400">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-3">
          <code className="bg-black/50 px-2 py-1 rounded text-sm">{bgColor}</code>
          <button
            onClick={copyToClipboard}
            className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded flex items-center gap-1 transition"
          >
            <LuCopy size={12} /> Copy
          </button>
        </div>
      </div>
    </div>
  );
};

// Widget 3: Mood Board - interactive mood selector with messages
const MoodBoard = () => {
  const [mood, setMood] = useState("curious");
  const moods = [
    { id: "curious", emoji: "🔍", label: "Curious", message: "Exploring new code frontiers!" },
    { id: "creative", emoji: "✨", label: "Creative", message: "Building something beautiful." },
    { id: "focused", emoji: "🎯", label: "Focused", message: "Deep work mode ON." },
    { id: "happy", emoji: "😊", label: "Happy", message: "Code is compiling perfectly!" },
  ];

  return (
    <div className="bg-[#1e1a2f] rounded-lg p-5 border border-yellow-500/30">
      <h3 className="text-lg font-semibold text-yellow-300 flex items-center gap-2">
        🌈 Dev Mood Board
      </h3>
      <div className="flex gap-3 mt-4 flex-wrap">
        {moods.map((m) => (
          <button
            key={m.id}
            onClick={() => setMood(m.id)}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
              mood === m.id
                ? "bg-yellow-600/50 text-yellow-100 border border-yellow-400"
                : "bg-gray-800/60 hover:bg-gray-700/80 text-gray-300"
            }`}
          >
            <span className="text-xl">{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 p-3 bg-black/40 rounded-md italic text-gray-200 border-l-4 border-yellow-500">
        💭 {moods.find((m) => m.id === mood)?.message}
      </div>
    </div>
  );
};

// Widget 4: Mini Terminal Simulation (engaging & interactive)
const MiniTerminal = () => {
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState([
    "Welcome to the Dev Terminal v1.0",
    "Type 'help' to see available commands.",
  ]);
  const inputRef = useRef(null);

  const handleCommand = (e) => {
    if (e.key === "Enter" && command.trim()) {
      const cmd = command.trim().toLowerCase();
      let response = "";
      if (cmd === "help") {
        response = "Available: help, about, skills, clear, date, quote";
      } else if (cmd === "about") {
        response = "This is a creative coding environment — built with React & Tailwind.";
      } else if (cmd === "skills") {
        response = "⚡ React • TypeScript • Node • Tailwind • Framer Motion";
      } else if (cmd === "date") {
        response = new Date().toLocaleString();
      } else if (cmd === "quote") {
        const quotes = [
          '"Code is like humor. When you have to explain it, it’s bad." – Cory House',
          '"First, solve the problem. Then, write the code." – John Johnson',
          '"Simplicity is the soul of efficiency." – Austin Freeman',
        ];
        response = quotes[Math.floor(Math.random() * quotes.length)];
      } else if (cmd === "clear") {
        setOutput([]);
        setCommand("");
        return;
      } else {
        response = `Command not found: ${cmd}. Try 'help'.`;
      }
      setOutput((prev) => [...prev, `> ${command}`, response]);
      setCommand("");
    }
  };

  useEffect(() => {
    if (inputRef.current) inputRef.current.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  return (
    <div className="bg-black/80 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-[#2a2438] px-3 py-1.5 flex items-center gap-2 text-xs text-gray-300 border-b border-gray-700">
        <LuTerminal size={12} /> terminal@portfolio:~/
      </div>
      <div className="p-3 h-64 overflow-y-auto font-mono text-sm">
        {output.map((line, idx) => (
          <div key={idx} className="text-green-300 whitespace-pre-wrap">
            {line}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-purple-400">$</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleCommand}
            className="bg-transparent outline-none flex-1 text-gray-200"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Main CodeEditor Component
// ----------------------------------------------------------------------

const CodeEditor = () => {
  // New engaging file set — different from about/projects/techstack
  const files = [
    {
      id: 1,
      title: "🎮 Playground.jsx",
      type: "widget",
      widget: "puzzle",
      content: "",
    },
    {
      id: 2,
      title: "🎨 Chroma.jsx",
      type: "widget",
      widget: "color",
      content: "",
    },
    {
      id: 3,
      title: "🌈 MoodBoard.jsx",
      type: "widget",
      widget: "mood",
      content: "",
    },
    {
      id: 4,
      title: "💻 Terminal.tsx",
      type: "widget",
      widget: "terminal",
      content: "",
    },
    {
      id: 5,
      title: "📓 DevJournal.md",
      type: "text",
      content: `# ✨ Creative Dev Journal

**Date:** ${new Date().toLocaleDateString()}

Today's insight: The best interfaces feel like magic. This editor combines the comfort of VS Code with interactive creativity.

- **Idea:** Add live code evaluation
- **Inspiration:** Generative art & functional design
- **Mood:** 🚀 excited about web animations

> "Code is not just logic, it's expression."

Try the interactive widgets on the left — each one sparks a different part of creativity.`,
    },
    {
      id: 6,
      title: "⚡ QuickRef.md",
      type: "text",
      content: `# ⚡ Dev Shortcuts & Tricks

| Command | Action |
|---------|--------|
| \`Cmd/Ctrl + K\` | Search files |
| \`Cmd/Ctrl + P\` | Quick open |
| \`Shift + Click\` | Multi-cursor |

**Pro tip:** Use the terminal widget to run fun commands like 'quote', 'skills', or 'date'.`,
    },
  ];

  const [tabs, setTabs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  // open file (adds to tabs if not already open)
  const openFile = (file) => {
    if (!tabs.find((tab) => tab.id === file.id)) {
      setTabs((prev) => [...prev, file]);
    }
    setActiveTab(file.id);
  };

  const closeTab = (id) => {
    setTabs((prev) => prev.filter((tab) => tab.id !== id));
    if (activeTab === id && tabs.length > 1) {
      const remaining = tabs.filter((tab) => tab.id !== id);
      setActiveTab(remaining[0]?.id || null);
    } else if (tabs.length === 1) {
      setActiveTab(null);
    }
  };

  // Render content based on file type (widget or text)
  const renderContent = (file) => {
    if (!file) return <div className="text-gray-500">Select a file to preview</div>;

    if (file.type === "widget") {
      switch (file.widget) {
        case "puzzle":
          return <CodePuzzle />;
        case "color":
          return <ColorExplorer />;
        case "mood":
          return <MoodBoard />;
        case "terminal":
          return <MiniTerminal />;
        default:
          return <div className="text-gray-400">✨ Interactive widget loading...</div>;
      }
    }

    // Markdown-like text content
    return (
      <div className="prose prose-invert max-w-none">
        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-200 leading-relaxed">
          {file.content}
        </pre>
      </div>
    );
  };

  const activeFile = tabs.find((tab) => tab.id === activeTab);

  return (
    <section className="code-editor bg-gradient-to-br from-[#0c0a1a] to-[#14121f] min-h-screen">
      <div
        className={`h-[calc(100vh-80px)] sticky top-[80px] flex flex-col bg-[#0f0e1a]/90 backdrop-blur-sm text-gray-200 font-mono rounded-xl overflow-hidden shadow-2xl border border-white/5`}
      >
        {/* Elegant Toolbar */}
        <div className="toolbar flex justify-between items-center h-[34px] bg-[#1a162a]/80 backdrop-blur-sm border-b border-white/10 px-2">
          <ul className="flex gap-3 mx-2 text-sm">
            {["File", "View", "Terminal", "Run"].map((item) => (
              <li
                key={item}
                className="hover:cursor-pointer hover:text-purple-300 transition px-1"
              >
                {item}
              </li>
            ))}
          </ul>

          <div
            className="search-bar flex items-center bg-[#2a2438] rounded-md h-[26px] w-1/3 px-2 text-xs text-gray-400 hover:bg-[#3a2e52] transition cursor-pointer border border-white/5"
            onClick={() => setIsModalOpen(true)}
          >
            <LuSearch size={12} className="mr-1" /> Search files (Ctrl+K)
          </div>

          <div className="icons flex items-center gap-2 mx-2">
            <div className="rounded-full h-2.5 w-2.5 hover:scale-110 transition bg-green-400 shadow-md"></div>
            <div className="rounded-full h-2.5 w-2.5 hover:scale-110 transition bg-yellow-400"></div>
            <div className="rounded-full h-2.5 w-2.5 hover:scale-110 transition bg-red-400"></div>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Activity Bar - more refined */}
          <div className="activityBar flex flex-col justify-between py-4 items-center w-[52px] bg-[#0c0a18] border-r border-white/5">
            <div className="iconContainerTop flex flex-col gap-5 w-full">
              {[
                { icon: LuFiles, label: "Explorer" },
                { icon: LuSearch, label: "Search", action: () => setIsModalOpen(true) },
                { icon: LuGitMerge, label: "Source Control" },
              ].map(({ icon: Icon, label, action }, idx) => (
                <div
                  key={idx}
                  className="group relative flex justify-center w-full cursor-pointer hover:text-purple-400 text-gray-400 transition-all hover:scale-110"
                  onClick={action}
                >
                  <Icon size={20} />
                  <span className="absolute left-12 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="iconsContainerBottom flex flex-col gap-5 w-full">
              {[
                { icon: LuCircleUserRound, label: "Profile" },
                { icon: LuSettings, label: "Settings" },
              ].map(({ icon: Icon, label }, idx) => (
                <div
                  key={idx}
                  className="group relative flex justify-center w-full cursor-pointer hover:text-purple-400 text-gray-400 transition-all hover:scale-110"
                >
                  <Icon size={20} />
                  <span className="absolute left-12 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar (File explorer) */}
          <SideBar files={files} openFile={openFile} />

          {/* Editor + Tabs */}
          <div className="flex flex-col flex-1 bg-[#0f0e1a]/60 overflow-hidden">
            <TabBar
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              closeTab={closeTab}
            />
            <div className="flex-1 overflow-y-auto p-5 custom-scroll">
              <div className="animate-fadeIn transition-all duration-200">
                {renderContent(activeFile)}
              </div>
            </div>
          </div>
        </div>

        {/* Status bar - elegant addition */}
        <div className="h-[26px] bg-[#18122B] border-t border-white/5 flex items-center px-4 text-xs text-gray-400 gap-4">
          <span className="flex items-center gap-1">
            <LuCircleUserRound size={10} /> Charitha · Portfolio Mode
          </span>
          <span>✨ JavaScript • Interactive Widgets</span>
          <span className="ml-auto">Ln 1, Col 1 • UTF-8 • Spaces: 2</span>
        </div>
      </div>

      {/* Search Modal */}
      {isModalOpen && (
        <SearchModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          files={files}
          openFile={openFile}
        />
      )}
    </section>
  );
};

export default CodeEditor;