export type GitignoreOption = { id: string; label: string; group: string; body: string };

export const gitignoreOptions: GitignoreOption[] = [
  { id: "node", label: "Node.js", group: "Languages", body: "node_modules/\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n.pnpm-debug.log*\ndist/\nbuild/\ncoverage/\n*.tsbuildinfo\n" },
  { id: "next", label: "Next.js", group: "Languages", body: ".next/\nout/\n.vercel/\nnext-env.d.ts\n" },
  { id: "python", label: "Python", group: "Languages", body: "__pycache__/\n*.py[cod]\n.venv/\nvenv/\n.pytest_cache/\n.mypy_cache/\n*.egg-info/\ndist/\nbuild/\n" },
  { id: "go", label: "Go", group: "Languages", body: "bin/\n*.exe\n*.test\nvendor/\n" },
  { id: "rust", label: "Rust", group: "Languages", body: "target/\n" },
  { id: "java", label: "Java", group: "Languages", body: "*.class\n.gradle/\nbuild/\ntarget/\n" },
  { id: "macos", label: "macOS", group: "Operating systems", body: ".DS_Store\n.AppleDouble\n.LSOverride\nIcon?\n._*\n" },
  { id: "windows", label: "Windows", group: "Operating systems", body: "Thumbs.db\nDesktop.ini\n$RECYCLE.BIN/\n" },
  { id: "linux", label: "Linux", group: "Operating systems", body: "*~\n.directory\n.Trash-*\n" },
  { id: "vscode", label: "VS Code", group: "Editors", body: ".vscode/*\n!.vscode/extensions.json\n!.vscode/settings.json\n!.vscode/tasks.json\n!.vscode/launch.json\n" },
  { id: "jetbrains", label: "JetBrains", group: "Editors", body: ".idea/\n*.iml\n" },
  { id: "env", label: "Secrets and env files", group: "Project", body: ".env\n.env.*\n!.env.example\n*.pem\n*.key\n" },
  { id: "logs", label: "Logs", group: "Project", body: "logs/\n*.log\n" },
];

export function buildGitignore(ids: string[]): string {
  const chosen = gitignoreOptions.filter((option) => ids.includes(option.id));
  if (chosen.length === 0) return "";
  return `${chosen.map((option) => `# ${option.label}\n${option.body.trim()}`).join("\n\n")}\n`;
}
