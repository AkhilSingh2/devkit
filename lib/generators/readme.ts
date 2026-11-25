export type ReadmeInput = {
  name: string;
  description: string;
  install: string;
  usage: string;
  license: string;
  contributing: boolean;
};

export function buildReadme(input: ReadmeInput): string {
  const name = input.name.trim() || "project-name";
  const description = input.description.trim() || "Describe what this project does.";
  const sections = [`# ${name}`, "", description, ""];
  if (input.install.trim()) {
    sections.push("## Install", "", "```bash", input.install.trim(), "```", "");
  }
  if (input.usage.trim()) {
    sections.push("## Usage", "", input.usage.trim(), "");
  }
  if (input.contributing) {
    sections.push("## Contributing", "", "Issues and pull requests are welcome. Please open an issue before a large change.", "");
  }
  if (input.license && input.license !== "none") {
    sections.push("## License", "", `${name} is released under the ${input.license} license.`, "");
  }
  return sections.join("\n").replace(/\n{3,}/g, "\n\n");
}
