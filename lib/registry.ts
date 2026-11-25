import { cronPresets } from "./cron/presets";

export type Category = "Data" | "Encode" | "Time" | "Text" | "Security" | "Generate" | "Design";

export type ToolId =
  | "json-formatter"
  | "json-to-typescript"
  | "json-to-zod"
  | "json-to-go"
  | "yaml-to-json"
  | "json-to-yaml"
  | "json-to-csv"
  | "jwt-decoder"
  | "base64"
  | "url-encode"
  | "regex-tester"
  | "cron"
  | "unix-timestamp"
  | "uuid-generator"
  | "hash-generator"
  | "diff-checker"
  | "sql-formatter"
  | "curl-to-code"
  | "chmod-calculator"
  | "minify"
  | "markdown-preview"
  | "color-converter"
  | "gitignore-generator"
  | "readme-generator";

export type PageDef = {
  id: ToolId;
  slug: string;
  name: string;
  title: string;
  h1: string;
  description: string;
  category: Category;
  keywords: string[];
  related: string[];
  preset?: string;
  nav: boolean;
};

const primary: PageDef[] = [
  {
    id: "json-formatter",
    slug: "json-formatter",
    name: "JSON Formatter",
    title: "JSON Formatter and Validator",
    h1: "JSON Formatter and Validator",
    description: "Format, minify, and validate JSON in the browser, then inspect a tree or run a JSONPath query. Nothing is uploaded.",
    category: "Data",
    keywords: ["json formatter", "json validator", "json beautifier", "json minify", "jsonpath"],
    related: ["json-to-typescript", "json-to-csv", "yaml-to-json"],
    nav: true,
  },
  {
    id: "json-to-typescript",
    slug: "json-to-typescript",
    name: "JSON to TypeScript",
    title: "JSON to TypeScript",
    h1: "JSON to TypeScript",
    description: "Turn a JSON value into TypeScript interfaces. Nested objects become named types and missing keys become optional.",
    category: "Data",
    keywords: ["json to typescript", "json to interface", "typescript interface generator"],
    related: ["json-to-zod", "json-to-go", "json-formatter"],
    nav: true,
  },
  {
    id: "json-to-zod",
    slug: "json-to-zod",
    name: "JSON to Zod",
    title: "JSON to Zod",
    h1: "JSON to Zod schema",
    description: "Generate a Zod schema from JSON, including arrays, nested objects, and nullable fields. The schema is code you can copy.",
    category: "Data",
    keywords: ["json to zod", "zod schema generator", "json schema zod"],
    related: ["json-to-typescript", "json-formatter", "json-to-go"],
    nav: true,
  },
  {
    id: "json-to-go",
    slug: "json-to-go",
    name: "JSON to Go",
    title: "JSON to Go struct",
    h1: "JSON to Go struct",
    description: "Generate Go structs and json tags from a JSON sample. Integers stay int, fractional numbers become float64.",
    category: "Data",
    keywords: ["json to go", "json to go struct", "golang struct generator"],
    related: ["json-to-typescript", "json-formatter", "json-to-yaml"],
    nav: true,
  },
  {
    id: "yaml-to-json",
    slug: "yaml-to-json",
    name: "YAML to JSON",
    title: "YAML to JSON Converter",
    h1: "YAML to JSON converter",
    description: "Convert YAML to JSON locally, including Kubernetes, Compose, and GitHub Actions documents. Comments are dropped, structure is kept.",
    category: "Data",
    keywords: ["yaml to json", "yaml to json converter", "yml to json"],
    related: ["json-to-yaml", "json-formatter", "yaml-to-json/kubernetes"],
    nav: true,
  },
  {
    id: "json-to-yaml",
    slug: "json-to-yaml",
    name: "JSON to YAML",
    title: "JSON to YAML Converter",
    h1: "JSON to YAML converter",
    description: "Convert JSON to YAML in your browser. Useful when an API sample needs to become a config file.",
    category: "Data",
    keywords: ["json to yaml", "json to yml", "json yaml converter"],
    related: ["yaml-to-json", "json-formatter", "yaml-to-json/kubernetes"],
    nav: true,
  },
  {
    id: "json-to-csv",
    slug: "json-to-csv",
    name: "JSON to CSV",
    title: "JSON to CSV",
    h1: "JSON to CSV",
    description: "Convert a JSON array of objects into CSV. Nested objects are flattened with dot paths and cells are quoted when needed.",
    category: "Data",
    keywords: ["json to csv", "json csv converter", "flatten json to csv"],
    related: ["json-formatter", "json-to-typescript", "diff-checker"],
    nav: true,
  },
  {
    id: "jwt-decoder",
    slug: "jwt-decoder",
    name: "JWT Decoder",
    title: "JWT Decoder",
    h1: "JWT decoder",
    description: "Decode a JSON Web Token header and payload locally. The signature is not verified, and the token never leaves your browser.",
    category: "Security",
    keywords: ["jwt decoder", "jwt decode", "json web token debugger", "jwt expiry"],
    related: ["base64", "unix-timestamp", "hash-generator"],
    nav: true,
  },
  {
    id: "base64",
    slug: "base64",
    name: "Base64",
    title: "Base64 Encode and Decode",
    h1: "Base64 encode and decode",
    description: "Encode or decode Base64 text and files in the browser, including the URL-safe alphabet. The bytes stay on this device.",
    category: "Encode",
    keywords: ["base64 decode", "base64 encode", "base64 encoder", "file to base64"],
    related: ["url-encode", "jwt-decoder", "hash-generator"],
    nav: true,
  },
  {
    id: "url-encode",
    slug: "url-encode",
    name: "URL Encode",
    title: "URL Encode and Decode",
    h1: "URL encode and decode",
    description: "Percent-encode or decode a component, a full URL, or form data. Spaces can be encoded as %20 or as a plus sign.",
    category: "Encode",
    keywords: ["url encode", "url decode", "percent encoding", "encodeURIComponent"],
    related: ["base64", "curl-to-code", "jwt-decoder"],
    nav: true,
  },
  {
    id: "regex-tester",
    slug: "regex-tester",
    name: "Regex Tester",
    title: "Regex Tester",
    h1: "Regex tester",
    description: "Test a JavaScript regular expression, see each match, and read a token-by-token explanation plus a cheat sheet.",
    category: "Text",
    keywords: ["regex tester", "regular expression tester", "regex explainer", "regex cheat sheet"],
    related: ["diff-checker", "json-formatter", "cron"],
    nav: true,
  },
  {
    id: "cron",
    slug: "cron",
    name: "Cron Generator",
    title: "Cron Expression Generator and Explainer",
    h1: "Cron expression generator",
    description: "Build or explain a five-field cron expression and list the next five local run times. Quartz seconds are not accepted.",
    category: "Time",
    keywords: ["cron expression generator", "cron explainer", "crontab generator", "next cron run"],
    related: ["cron/every-5-minutes", "unix-timestamp", "regex-tester"],
    nav: true,
  },
  {
    id: "unix-timestamp",
    slug: "unix-timestamp",
    name: "Unix Timestamp",
    title: "Unix Timestamp Converter",
    h1: "Unix timestamp converter",
    description: "Convert Unix seconds or milliseconds to ISO, UTC, and local time, or turn a date into a timestamp.",
    category: "Time",
    keywords: ["unix timestamp converter", "epoch converter", "timestamp to date"],
    related: ["cron", "jwt-decoder", "hash-generator"],
    nav: true,
  },
  {
    id: "uuid-generator",
    slug: "uuid-generator",
    name: "UUID Generator",
    title: "UUID, ULID and NanoID Generator",
    h1: "UUID, ULID, and NanoID generator",
    description: "Generate UUID v4, ULID, and NanoID values with the Web Crypto API. No request is sent to a server.",
    category: "Generate",
    keywords: ["uuid generator", "ulid generator", "nanoid generator", "uuid v4"],
    related: ["hash-generator", "jwt-decoder", "gitignore-generator"],
    nav: true,
  },
  {
    id: "hash-generator",
    slug: "hash-generator",
    name: "Hash Generator",
    title: "SHA Hash Generator",
    h1: "SHA hash generator",
    description: "Hash text or a file with SHA-1, SHA-256, SHA-384, or SHA-512 using Web Crypto. This is not a password hasher.",
    category: "Security",
    keywords: ["sha256 hash", "sha512 hash", "hash generator", "checksum"],
    related: ["hash-generator/sha256", "uuid-generator", "base64"],
    nav: true,
  },
  {
    id: "diff-checker",
    slug: "diff-checker",
    name: "Diff Checker",
    title: "Diff Checker",
    h1: "Diff checker",
    description: "Compare two texts line by line, side by side or inline. The diff runs locally and can be shared with a link hash.",
    category: "Text",
    keywords: ["diff checker", "text diff", "side by side diff", "inline diff"],
    related: ["regex-tester", "json-formatter", "sql-formatter"],
    nav: true,
  },
  {
    id: "sql-formatter",
    slug: "sql-formatter",
    name: "SQL Formatter",
    title: "SQL Formatter",
    h1: "SQL formatter",
    description: "Format a SQL statement with major clauses on their own lines. Strings and quoted identifiers are left intact.",
    category: "Text",
    keywords: ["sql formatter", "sql beautifier", "format sql online"],
    related: ["diff-checker", "json-formatter", "regex-tester"],
    nav: true,
  },
  {
    id: "curl-to-code",
    slug: "curl-to-code",
    name: "curl to code",
    title: "curl to Code",
    h1: "curl to code",
    description: "Convert a curl command into fetch, axios, Python requests, or Go. Flags for method, headers, data, and basic auth are supported.",
    category: "Data",
    keywords: ["curl to code", "curl to fetch", "curl to python", "curl to axios"],
    related: ["url-encode", "json-formatter", "jwt-decoder"],
    nav: true,
  },
  {
    id: "chmod-calculator",
    slug: "chmod-calculator",
    name: "chmod Calculator",
    title: "chmod Calculator",
    h1: "chmod calculator",
    description: "Calculate chmod octal and symbolic modes, including setuid, setgid, and the sticky bit. Checkboxes and a typed mode stay in sync.",
    category: "Generate",
    keywords: ["chmod calculator", "chmod 755", "permission calculator", "symbolic mode"],
    related: ["gitignore-generator", "hash-generator", "readme-generator"],
    nav: true,
  },
  {
    id: "minify",
    slug: "minify",
    name: "Minify and Beautify",
    title: "HTML, CSS, and JavaScript Minifier",
    h1: "HTML, CSS, and JavaScript minifier",
    description: "Minify or beautify HTML, CSS, and JavaScript in the browser. Strings and preformatted HTML are preserved.",
    category: "Text",
    keywords: ["html minify", "css beautifier", "javascript minify", "js beautify"],
    related: ["diff-checker", "markdown-preview", "sql-formatter"],
    nav: true,
  },
  {
    id: "markdown-preview",
    slug: "markdown-preview",
    name: "Markdown to PDF",
    title: "Markdown Preview to PDF",
    h1: "Markdown preview to PDF",
    description: "Preview Markdown and print it to PDF with a readable print stylesheet. Use the browser print dialog and choose Save as PDF.",
    category: "Text",
    keywords: ["markdown preview", "markdown to pdf", "markdown print"],
    related: ["readme-generator", "minify", "diff-checker"],
    nav: true,
  },
  {
    id: "color-converter",
    slug: "color-converter",
    name: "Colour Converter",
    title: "Colour Converter and Contrast Checker",
    h1: "Colour converter and contrast checker",
    description: "Convert hex, RGB, and HSL colours and check the WCAG contrast ratio for normal text, large text, AA, and AAA.",
    category: "Design",
    keywords: ["color converter", "colour converter", "contrast checker", "wcag contrast"],
    related: ["minify", "markdown-preview", "json-formatter"],
    nav: true,
  },
  {
    id: "gitignore-generator",
    slug: "gitignore-generator",
    name: ".gitignore",
    title: ".gitignore Generator",
    h1: ".gitignore generator",
    description: "Build a .gitignore from Node, Python, Go, Rust, editors, and secret-file templates. Combine only the sections you need.",
    category: "Generate",
    keywords: ["gitignore generator", "gitignore template", "node gitignore"],
    related: ["readme-generator", "chmod-calculator", "curl-to-code"],
    nav: true,
  },
  {
    id: "readme-generator",
    slug: "readme-generator",
    name: "README",
    title: "README Generator",
    h1: "README generator",
    description: "Draft a README with a title, description, install command, usage, and an optional license section.",
    category: "Generate",
    keywords: ["readme generator", "readme template", "markdown readme"],
    related: ["gitignore-generator", "markdown-preview", "chmod-calculator"],
    nav: true,
  },
];

const extra: PageDef[] = [
  {
    id: "json-formatter",
    slug: "json-formatter/jsonpath",
    name: "JSONPath Tester",
    title: "JSONPath Tester",
    h1: "JSONPath tester",
    description: "Run a JSONPath query against JSON in your browser. Supports property paths, wildcards, slices, filters, and recursive descent.",
    category: "Data",
    keywords: ["jsonpath tester", "jsonpath online", "json query"],
    related: ["json-formatter", "json-to-csv", "jq"],
    preset: "jsonpath",
    nav: false,
  },
  {
    id: "yaml-to-json",
    slug: "yaml-to-json/kubernetes",
    name: "Kubernetes YAML to JSON",
    title: "Kubernetes YAML to JSON",
    h1: "Kubernetes YAML to JSON",
    description: "Convert a Kubernetes manifest from YAML to JSON locally. Includes a Deployment sample with apiVersion, kind, metadata, and spec.",
    category: "Data",
    keywords: ["kubernetes yaml to json", "k8s manifest json", "deployment yaml to json"],
    related: ["yaml-to-json", "json-to-yaml", "yaml-to-json/helm"],
    preset: "kubernetes",
    nav: false,
  },
  {
    id: "yaml-to-json",
    slug: "yaml-to-json/docker-compose",
    name: "Compose YAML to JSON",
    title: "Docker Compose YAML to JSON",
    h1: "Docker Compose YAML to JSON",
    description: "Convert a Docker Compose file from YAML to JSON in the browser. The sample has two services, a port mapping, and an environment value.",
    category: "Data",
    keywords: ["docker compose yaml to json", "compose to json"],
    related: ["yaml-to-json", "yaml-to-json/kubernetes", "json-to-yaml"],
    preset: "docker-compose",
    nav: false,
  },
  {
    id: "yaml-to-json",
    slug: "yaml-to-json/github-actions",
    name: "Actions YAML to JSON",
    title: "GitHub Actions YAML to JSON",
    h1: "GitHub Actions YAML to JSON",
    description: "Convert a GitHub Actions workflow from YAML to JSON locally. Useful when a tool wants the workflow as data rather than a file.",
    category: "Data",
    keywords: ["github actions yaml to json", "workflow yaml to json"],
    related: ["yaml-to-json", "cron", "json-to-yaml"],
    preset: "github-actions",
    nav: false,
  },
  {
    id: "yaml-to-json",
    slug: "yaml-to-json/helm",
    name: "Helm values to JSON",
    title: "Helm values YAML to JSON",
    h1: "Helm values YAML to JSON",
    description: "Convert Helm values.yaml to JSON locally. Nested image, service, and resource maps stay nested in the JSON object.",
    category: "Data",
    keywords: ["helm values to json", "values.yaml to json"],
    related: ["yaml-to-json/kubernetes", "yaml-to-json", "json-to-yaml"],
    preset: "helm",
    nav: false,
  },
  {
    id: "base64",
    slug: "base64/encode",
    name: "Base64 Encode",
    title: "Base64 Encode",
    h1: "Base64 encode",
    description: "Encode text or a file to Base64 in the browser. Choose standard or URL-safe output. The file is read locally.",
    category: "Encode",
    keywords: ["base64 encode", "text to base64", "file to base64"],
    related: ["base64", "base64/decode", "url-encode"],
    preset: "encode",
    nav: false,
  },
  {
    id: "base64",
    slug: "base64/decode",
    name: "Base64 Decode",
    title: "Base64 Decode",
    h1: "Base64 decode",
    description: "Decode a Base64 or Base64URL string back to text in the browser. Invalid input shows an error instead of a partial result.",
    category: "Encode",
    keywords: ["base64 decode", "base64 to text", "decode base64url"],
    related: ["base64", "base64/encode", "jwt-decoder"],
    preset: "decode",
    nav: false,
  },
  {
    id: "hash-generator",
    slug: "hash-generator/sha256",
    name: "SHA-256",
    title: "SHA-256 Hash Generator",
    h1: "SHA-256 hash generator",
    description: "Compute a SHA-256 checksum for text or a file with Web Crypto. The digest is shown in hex and Base64.",
    category: "Security",
    keywords: ["sha256", "sha-256 hash", "sha256 checksum"],
    related: ["hash-generator", "hash-generator/sha512", "base64"],
    preset: "SHA-256",
    nav: false,
  },
  {
    id: "hash-generator",
    slug: "hash-generator/sha512",
    name: "SHA-512",
    title: "SHA-512 Hash Generator",
    h1: "SHA-512 hash generator",
    description: "Compute a SHA-512 checksum for text or a file locally. SHA-512 is a digest, not a way to store passwords.",
    category: "Security",
    keywords: ["sha512", "sha-512 hash", "sha512 checksum"],
    related: ["hash-generator", "hash-generator/sha256", "uuid-generator"],
    preset: "SHA-512",
    nav: false,
  },
  ...cronPresets.map(
    (preset): PageDef => ({
      id: "cron",
      slug: `cron/${preset.slug}`,
      name: preset.name,
      title: preset.title,
      h1: preset.h1,
      description: preset.description,
      category: "Time",
      keywords: ["cron", preset.expression, preset.name.toLowerCase(), "crontab"],
      related: ["cron", "unix-timestamp", preset.slug === "every-5-minutes" ? "cron/every-15-minutes" : "cron/every-5-minutes"],
      preset: preset.expression,
      nav: false,
    }),
  ),
];

extra[0].related = ["json-formatter", "json-to-csv", "yaml-to-json"];

export const pages: PageDef[] = [...primary, ...extra];

export const navPages = pages.filter((page) => page.nav);

export function getPage(slug: string): PageDef | undefined {
  return pages.find((page) => page.slug === slug);
}

export function childPages(slug: string): PageDef[] {
  return pages.filter((page) => page.slug.startsWith(`${slug}/`));
}

export function ogName(slug: string): string {
  return `${slug.replaceAll("/", "-")}.png`;
}
