import { parseCron } from "./cron/cron";
import { cronPresets } from "./cron/presets";

export type Faq = { q: string; a: string };
export type ToolContent = { howTo: string[]; steps: string[]; faqs: Faq[] };

const primary: Record<string, ToolContent> = {
  "json-formatter": {
    howTo: [
      "Paste JSON or drop a .json file. DevKit parses it with JSON.parse and reports the line and column when the document is invalid.",
      "Format chooses an indent of two spaces, four spaces, or a tab. Minify removes insignificant whitespace. The tree shows objects and arrays collapsed by level, and a JSONPath box runs a query against the same value.",
      "The document stays in this tab. A share link stores it in the URL hash, which browsers do not send to the server as part of the request.",
    ],
    steps: ["Paste JSON into the input.", "Choose Format, Minify, or a JSONPath query.", "Copy the result or copy the page link to share the hash."],
    faqs: [
      { q: "Does the JSON formatter upload my document?", a: "No. Parsing, formatting, the tree, and JSONPath all run in your browser." },
      { q: "Which JSONPath features are supported?", a: "Property names, quoted keys, indexes, negative indexes, wildcards, slices, recursive descent such as $..price, and filters such as [?(@.price<10)]. Script expressions and unions are not supported." },
      { q: "Why did a valid-looking file fail?", a: "JSON does not allow comments, trailing commas, or single quotes. The error line points at the first place the parser stopped." },
    ],
  },
  "json-to-typescript": {
    howTo: [
      "Paste a JSON sample. DevKit infers interfaces: objects become named types, arrays of objects merge their keys, and a key that is missing from one item becomes optional.",
      "Set the root name if you do not want Root. Nested objects are named from their property, with ID, URL, and API kept uppercase.",
      "The result is a starting type, not a schema with validation. Use JSON to Zod when you want a runtime schema as well.",
    ],
    steps: ["Paste a representative JSON sample.", "Set the root type name.", "Copy the interfaces into your project and tighten unions you did not intend."],
    faqs: [
      { q: "How are optional fields chosen?", a: "If the root is an array of objects, a key that is absent from any item is marked optional. A key that is present and null stays required and nullable." },
      { q: "What happens with an empty array?", a: "An empty array becomes unknown[] because there is no element to infer from. Add one example element and convert again." },
      { q: "Does this send the sample to an API?", a: "No. Inference runs locally." },
    ],
  },
  "json-to-zod": {
    howTo: [
      "Paste JSON and DevKit writes a Zod object. Nested objects get their own schema constants. Arrays use z.array, and null becomes z.null() or .nullable() when a value is sometimes null.",
      "You still need zod installed in the project that will import the snippet. DevKit does not add that dependency for you.",
      "Mixed arrays become z.union. Review those unions: a sample can be narrower than production data.",
    ],
    steps: ["Paste JSON.", "Check nested schema names.", "Copy the snippet and import z from zod in your app."],
    faqs: [
      { q: "Is the generated schema strict?", a: "It uses z.object, which strips unknown keys by default in Zod. Add .strict() yourself if unknown keys should fail." },
      { q: "Why is every number z.number()?", a: "JSON has one number type. Integers and floats are both z.number(). Add .int() where you know the value cannot be fractional." },
      { q: "Can I convert YAML first?", a: "Yes. Use YAML to JSON, then paste the JSON here." },
    ],
  },
  "json-to-go": {
    howTo: [
      "Paste JSON. Each object becomes a struct with exported fields and json tags. A whole number becomes int. A number with a fraction becomes float64.",
      "Null and mixed types become any, because the sample does not say which concrete type you want. Empty arrays become []any.",
      "The package name is types. Rename it to match the file you paste it into.",
    ],
    steps: ["Paste a JSON sample.", "Copy the Go structs.", "Replace any with a concrete type when the sample used null."],
    faqs: [
      { q: "Why did id become ID?", a: "Common abbreviations are rendered as ID, URL, URI, API, HTML, CSS, JSON, and SQL so the field matches Go style." },
      { q: "Are time strings detected?", a: "No. A string stays a string. Parse time.Time in your own code if the value is a timestamp." },
      { q: "Does this call a remote converter?", a: "No. The structs are generated in the page." },
    ],
  },
  "yaml-to-json": {
    howTo: [
      "Paste YAML or drop a file. Mappings become objects, sequences become arrays, and scalars become strings, numbers, or booleans when the YAML type says so.",
      "Comments and anchors that you do not need in JSON are not a transport format: comments are omitted, and aliases are resolved by the parser when they are used.",
      "Specific pages cover Kubernetes, Compose, GitHub Actions, and Helm values if you want a sample of that shape.",
    ],
    steps: ["Paste YAML.", "Read the JSON result and any parser error.", "Copy the JSON or open JSON to YAML to reverse it."],
    faqs: [
      { q: "Will comments survive?", a: "No. JSON has no comments. If a comment carries meaning, move it into a field before converting." },
      { q: "Can I convert a multi-document YAML stream?", a: "This converter reads one YAML document. Split a stream on --- and convert each document." },
      { q: "Is the YAML uploaded?", a: "No. The parser runs in your browser." },
    ],
  },
  "json-to-yaml": {
    howTo: [
      "Paste JSON. DevKit prints a YAML document with the same structure. It is a practical way to turn an API response into a config stub.",
      "Keys are not reordered except as JSON.parse already parsed them. Long strings use plain YAML scalars unless they need quotes.",
      "Validate the YAML in the tool you will run. A converter cannot know which keys that tool requires.",
    ],
    steps: ["Paste JSON.", "Copy the YAML.", "Replace example values before using it as configuration."],
    faqs: [
      { q: "Does this produce Kubernetes YAML?", a: "It produces YAML with the same data as the JSON. A Kubernetes manifest still needs apiVersion, kind, and the fields that object expects." },
      { q: "Why did a key get quoted?", a: "YAML quotes keys and values that would otherwise be ambiguous, such as yes, no, or strings that look like numbers when the JSON type was a string." },
      { q: "Is my JSON sent anywhere?", a: "No." },
    ],
  },
  "json-to-csv": {
    howTo: [
      "Paste a JSON array of objects. The header row is the union of keys, in the order they are first seen. Nested objects use dotted paths such as address.city.",
      "A single object becomes one data row. Arrays of arrays become column_1, column_2, and so on. Nested arrays are written as JSON text inside a cell.",
      "Cells that contain a comma, quote, or newline are wrapped in quotes, and quotes inside a cell are doubled.",
    ],
    steps: ["Paste JSON.", "Check the header row.", "Download the CSV or copy it into a spreadsheet."],
    faqs: [
      { q: "Can CSV keep nested arrays?", a: "A spreadsheet cell is text. Nested arrays are stored as a JSON string so the value is not silently dropped." },
      { q: "Which delimiter is used?", a: "Comma. If a spreadsheet expects semicolons, import the file and set the delimiter, or replace the commas in a copy you control." },
      { q: "Does conversion leave the browser?", a: "No." },
    ],
  },
  "jwt-decoder": {
    howTo: [
      "Paste a JWT. DevKit splits the three base64url parts, decodes the header and payload, and pretty-prints the JSON. A Bearer prefix is ignored.",
      "The signature is shown but not checked. There is no secret and no network call. Treat alg and the claims as untrusted data until a verifier on your server says otherwise.",
      "If the payload has an exp claim, a countdown shows the time remaining or that the token is expired. exp is seconds since the Unix epoch.",
    ],
    steps: ["Paste a token.", "Read the header and payload.", "Check the expiry countdown before using the token in a test."],
    faqs: [
      { q: "Does the token leave the browser?", a: "No. Decoding is local. Do not paste a production token into a site you do not trust; this page does not transmit it, but a share link would put it in the URL hash." },
      { q: "Why is the signature not verified?", a: "Verification needs the issuer's key. Decoding only shows what the token claims. A token with alg none or a bad signature can still be decoded." },
      { q: "What does the countdown use?", a: "The exp claim, compared with your computer's clock. Clock skew of a few minutes is normal." },
    ],
  },
  base64: {
    howTo: [
      "Choose encode or decode. Text is encoded as UTF-8 bytes. A dropped file is read as bytes, not as a string, so binary files round-trip.",
      "URL-safe mode uses - and _ and omits padding on encode. Decode accepts both alphabets and ignores whitespace.",
      "Base64 is an encoding, not encryption. Anyone who sees the text can reverse it.",
    ],
    steps: ["Choose encode or decode.", "Paste text or drop a file.", "Copy the result. For a file decode, download the bytes."],
    faqs: [
      { q: "Why did decode fail?", a: "The input is not a valid Base64 alphabet, or the padding is wrong in a way that cannot be repaired. Remove line wrapping only if it uses characters other than whitespace." },
      { q: "Does a file get uploaded?", a: "No. FileReader reads it in the page." },
      { q: "Is this the same as Base64 in a JWT?", a: "JWTs use base64url. Turn on URL-safe mode, or use the JWT decoder, which already expects that alphabet." },
    ],
  },
  "url-encode": {
    howTo: [
      "Component mode uses encodeURIComponent, which encodes characters that must not appear inside a query value, including &, ?, and =.",
      "Full URL mode uses encodeURI, which keeps : / ? # so an existing URL stays a URL. Form mode encodes spaces as plus signs.",
      "Decode accepts percent-encoding and treats + as a space, which matches form bodies.",
    ],
    steps: ["Choose a mode.", "Paste the text.", "Copy the encoded or decoded result."],
    faqs: [
      { q: "When should I use component mode?", a: "When you are putting a single value into a query string. Encoding the whole URL with component mode will also encode the :// and break it." },
      { q: "Why did a plus become a space?", a: "Decode follows form encoding, where + means space. A literal plus in a path should have been %2B." },
      { q: "Is the text sent to a server?", a: "No." },
    ],
  },
  "regex-tester": {
    howTo: [
      "Enter a JavaScript pattern and the test text. DevKit adds the g flag if you did not, so it can list every match. Other flags are the checkboxes under the pattern.",
      "The explanation lists each token: anchors, escapes, classes, groups, and quantifiers. It is a reading aid, not a proof that the pattern matches only what you want.",
      "The cheat sheet below the tool is the same syntax the tester runs. Lookaheads and backreferences still follow JavaScript rules.",
    ],
    steps: ["Type a pattern.", "Paste the text you want to search.", "Read the matches and the token explanation, then adjust flags."],
    faqs: [
      { q: "Which engine is this?", a: "The browser's JavaScript RegExp. Lookbehind support depends on the browser. A pattern that works here may differ in Python or PCRE." },
      { q: "Why did an empty pattern match everywhere?", a: "An empty pattern matches the empty string. The tester stops after 200 matches so a pattern like that cannot lock the page." },
      { q: "Can I test against a file?", a: "Yes. Drop a text file on the test box. Very large files are rejected so the page stays responsive." },
    ],
  },
  cron: {
    howTo: [
      "A cron expression here has five fields: minute, hour, day of month, month, and day of week. Nicknames such as @hourly expand to those five fields. A sixth seconds field is rejected.",
      "Names such as JAN and MON are accepted. Day 7 means Sunday and is stored as 0. The next five runs use your computer's local timezone and start from the next minute.",
      "If both day-of-month and day-of-week are restricted, classic cron runs the job when either field matches. Keep one of them as * unless you want that OR behaviour.",
    ],
    steps: ["Type an expression or start from a preset.", "Read the field explanation.", "Compare the next five run times with the clock the server will use."],
    faqs: [
      { q: "Does this include seconds?", a: "No. Quartz expressions with a seconds field have six or seven parts. Use the five fields a Linux crontab expects." },
      { q: "Why is the next run not exactly five minutes from now?", a: "*/5 means minutes 0, 5, 10, and so on. It is not a timer that starts when you save the crontab." },
      { q: "Which timezone is shown?", a: "The timezone of this browser. The server may be set to UTC. Convert with the Unix timestamp tool if you need both." },
    ],
  },
  "unix-timestamp": {
    howTo: [
      "A number with fewer than 11 digits is read as seconds. A longer number is read as milliseconds. now uses the current time. An ISO date is parsed with Date.parse.",
      "The result shows seconds, milliseconds, ISO 8601, the UTC string, and a local time with the numeric offset.",
      "JavaScript cannot represent dates more than about 100 million days from the epoch. Those values show an error.",
    ],
    steps: ["Paste a timestamp or a date.", "Read seconds and milliseconds.", "Use the local line only if the offset matches the system you care about."],
    faqs: [
      { q: "Is 1700000000 seconds or milliseconds?", a: "Seconds. It is 10 digits. Millisecond values for current dates have 13 digits." },
      { q: "Why does local time differ from UTC?", a: "Local time applies your timezone offset. UTC and the ISO value do not." },
      { q: "Does this contact a time server?", a: "No. It uses the clock and timezone data already in the browser." },
    ],
  },
  "uuid-generator": {
    howTo: [
      "UUID v4 comes from crypto.randomUUID(). ULID encodes 48 bits of millisecond time and 80 bits of randomness in Crockford base32, so IDs created later sort after earlier ones when the clock moves forward.",
      "NanoID uses the URL alphabet and rejection sampling so the characters are not biased by a simple modulo. The default length is 21.",
      "Generate a batch when you need fixtures. The values are not stored on a server.",
    ],
    steps: ["Choose UUID, ULID, or NanoID.", "Set how many you need.", "Copy one value or the whole list."],
    faqs: [
      { q: "Are these safe for secrets?", a: "They are random identifiers, not passwords or encryption keys. A UUID is not a capability token." },
      { q: "Can a ULID leak the time?", a: "Yes. The first 10 characters encode the creation time. Use a UUID or NanoID if the time should not be visible." },
      { q: "Why did generation fail?", a: "Web Crypto is available in secure contexts: https and localhost. An insecure http origin can hide randomUUID." },
    ],
  },
  "hash-generator": {
    howTo: [
      "Pick SHA-1, SHA-256, SHA-384, or SHA-512. The digest is computed with crypto.subtle and shown as hex and Base64.",
      "Drop a file to hash its bytes. Text is hashed as UTF-8, so a string and a file with the same characters match only when the file is UTF-8 without a surprise byte order mark.",
      "These algorithms are checksums. Do not use them to store passwords. Password storage needs a slow hash such as scrypt, bcrypt, or Argon2, which this page does not implement.",
    ],
    steps: ["Choose an algorithm.", "Paste text or drop a file.", "Copy the hex digest into the checksum field you are comparing."],
    faqs: [
      { q: "Is SHA-1 still useful?", a: "Only for legacy checksums. It is not collision resistant. Prefer SHA-256 or SHA-512 for anything new." },
      { q: "Does the file leave the browser?", a: "No. Web Crypto hashes it locally." },
      { q: "Why is the hash different from another tool?", a: "Check the algorithm, whether the other tool included a trailing newline, and whether it hashed text as UTF-16." },
    ],
  },
  "diff-checker": {
    howTo: [
      "Paste the original on the left and the changed text on the right, or drop two files. Line endings are normalised and a single trailing newline is ignored.",
      "Side by side pairs deletions with insertions. Inline lists the edits in order. Large unchanged prefixes are skipped before the comparison so a one-line edit in a long file stays fast.",
      "The diff is a reading aid. It is not a merge and it does not understand programming-language syntax.",
    ],
    steps: ["Paste both versions.", "Switch between side by side and inline.", "Copy a share link if you want to keep the comparison in the URL hash."],
    faqs: [
      { q: "Is there a size limit?", a: "Very large differing regions fall back to marking the remaining lines removed and added, so the page does not build a giant table in memory." },
      { q: "Can I ignore whitespace?", a: "Not as a separate mode. Trim the inputs first if trailing spaces are the only change you want to hide." },
      { q: "Are the texts uploaded?", a: "No." },
    ],
  },
  "sql-formatter": {
    howTo: [
      "Paste a statement. SELECT, FROM, WHERE, GROUP BY, ORDER BY, JOIN, and the other major clauses start on a new line. AND and OR are indented.",
      "Strings, quoted identifiers, and comments are handled by a scanner. Comments are removed from the formatted output so a comment cannot hide a clause.",
      "This is a layout formatter, not a SQL parser for one database. It will not rewrite syntax or add missing aliases.",
    ],
    steps: ["Paste SQL.", "Format it.", "Copy the result into your editor and run the database's own formatter if you need dialect rules."],
    faqs: [
      { q: "Will this validate the query?", a: "No. A statement can look tidy and still be invalid. Run EXPLAIN or your engine's parser before you ship it." },
      { q: "Are keywords uppercased?", a: "Yes. Identifiers that are not keywords keep the case you typed." },
      { q: "Does formatting send the query anywhere?", a: "No." },
    ],
  },
  "curl-to-code": {
    howTo: [
      "Paste a curl command. DevKit reads -X, --request, -H, --header, -d and the other --data forms, -u, -A, --url, -G, and -I. Line continuations with a backslash are joined.",
      "If you pass a body and no method, the method is POST. Basic auth becomes an Authorization header. -G appends the body as a query string.",
      "The four outputs are fetch, axios, Python requests, and Go net/http. They are starters: timeouts, retries, and TLS options are left to you.",
    ],
    steps: ["Paste a curl command.", "Pick fetch, axios, Python, or Go.", "Copy the snippet and replace any secret before you commit it."],
    faqs: [
      { q: "Which flags are unsupported?", a: "The parser stops on a flag it does not understand, including cookies files and form uploads with @file. Put the resolved header or body in the command first." },
      { q: "Does Python use json= or data=?", a: "json= when the body parses as JSON and the Content-Type contains json. Otherwise the body is data=." },
      { q: "Is the command uploaded?", a: "No. Be careful with share links: the URL hash would include the command, headers and all." },
    ],
  },
  "chmod-calculator": {
    howTo: [
      "Each of owner, group, and others has read, write, and execute. The octal digit is 4 for read, 2 for write, and 1 for execute. 755 is rwxr-xr-x.",
      "A fourth digit sets the special bits: 4 is setuid, 2 is setgid, and 1 is the sticky bit. 4755 is rwsr-xr-x. If setuid is on without execute, the symbol is a capital S.",
      "Type an octal mode or use the checkboxes. Both stay in sync. The symbolic form is what ls -l shows after the directory marker.",
    ],
    steps: ["Start from 644 or 755, or type a mode.", "Toggle the bits you need.", "Copy the octal value into chmod."],
    faqs: [
      { q: "What is a safe mode for a private key?", a: "600: the owner can read and write, and nobody else can. This page does not change files on your machine. It only calculates the mode." },
      { q: "What is 755 for?", a: "A typical executable or a directory others may enter. Directories need execute to be traversable." },
      { q: "Why does the sticky bit show as t?", a: "On the other-execute position, t means sticky and execute. A capital T would mean sticky without execute." },
    ],
  },
  minify: {
    howTo: [
      "Choose HTML, CSS, or JavaScript, then minify or beautify. The scanners keep strings intact, so a brace inside a JavaScript string is not treated as a block.",
      "HTML minify removes comments and collapses whitespace, but it leaves the contents of script, style, pre, and textarea alone.",
      "The JavaScript tools are layout tools. They do not rename variables or rewrite syntax the way a bundler minifier does.",
    ],
    steps: ["Pick a language and a direction.", "Paste source or drop a file.", "Copy the result and diff it if you want to see what changed."],
    faqs: [
      { q: "Will beautify match Prettier?", a: "No. It uses a small set of rules: indent, braces, and semicolons. Run Prettier in the project when you need its opinions." },
      { q: "Can minify break JavaScript?", a: "It removes comments and extra whitespace, and it keeps a space between words. It does not evaluate the program. Check the result if the input uses unusual ASI cases." },
      { q: "Is the source uploaded?", a: "No." },
    ],
  },
  "markdown-preview": {
    howTo: [
      "Write Markdown on the left. The preview supports headings, lists, emphasis, links, fenced code, blockquotes, tables, and horizontal rules. Raw HTML is escaped.",
      "Print / Save as PDF opens the browser print dialog with a stylesheet that hides the site chrome and sets the preview in a readable column. Choose Save as PDF as the destination.",
      "javascript: links are dropped. http, https, mailto, hash, and relative links are kept.",
    ],
    steps: ["Write or paste Markdown.", "Check the preview.", "Use Print / Save as PDF and pick Save as PDF."],
    faqs: [
      { q: "Why is there no server-side PDF?", a: "A server would need the document. Printing locally keeps the notes on your machine and uses the PDF engine already in the browser." },
      { q: "Are images included?", a: "Image syntax is not rendered, so a preview cannot request a remote image. Describe the figure in text or add it in your editor." },
      { q: "Can I preview a README draft?", a: "Yes. The README generator builds the Markdown, and this page shows how it will print." },
    ],
  },
  "color-converter": {
    howTo: [
      "Enter a foreground and a background as hex, rgb(), or hsl(). The page shows the same colour in the other forms and the WCAG 2 contrast ratio.",
      "AA needs 4.5:1 for normal text and 3:1 for large text. AAA needs 7:1 and 4.5:1. Large text is 18pt, or 14pt bold.",
      "The ratio uses the relative luminance formula. Alpha is ignored for the ratio: put the colour you will actually paint, after it has been composited onto a background.",
    ],
    steps: ["Set the text colour and the background.", "Read the ratio and the AA / AAA rows.", "Adjust one colour until the row you need says pass."],
    faqs: [
      { q: "Do you spell it colour or color?", a: "The page title uses colour. The keywords also include color, and both hex and the CSS functional notations are accepted." },
      { q: "Does a pass here guarantee the whole UI?", a: "No. It checks this pair. Icons, placeholders, and disabled states need their own checks, and non-text contrast has a separate 3:1 rule." },
      { q: "Is the colour sent to a server?", a: "No." },
    ],
  },
  "gitignore-generator": {
    howTo: [
      "Tick the stacks and editors you use. The file is the selected templates joined with headings. It is a practical starter, not a copy of every rule in the upstream gitignore collection.",
      "The secrets section ignores .env and key files while keeping .env.example. Add project-specific paths after the generated block.",
      "Download the file as .gitignore or copy it into the repository root.",
    ],
    steps: ["Select the sections you need.", "Read the combined file.", "Download it into the repo and commit it."],
    faqs: [
      { q: "Will this ignore files that are already tracked?", a: "No. Git keeps tracking files that were committed before the ignore rule. Remove them from the index if they should disappear." },
      { q: "Should I ignore lockfiles?", a: "No. These templates do not ignore package-lock.json, pnpm-lock.yaml, or go.sum. Commit lockfiles so installs stay repeatable." },
      { q: "Does generation use a network list?", a: "No. The templates are in the page." },
    ],
  },
  "readme-generator": {
    howTo: [
      "Fill in the project name, a one-paragraph description, the install command, and a short usage note. Leave a field blank to omit that section.",
      "Choose a license name only if that is the license you actually ship. The generator writes a sentence. It does not paste a full license text.",
      "Preview the Markdown here, then open Markdown preview to PDF if you want to print it.",
    ],
    steps: ["Describe the project.", "Add install and usage commands.", "Copy the Markdown into README.md."],
    faqs: [
      { q: "Can I add screenshots later?", a: "Yes. The draft is a starting point. Add images with relative paths after you copy it into the repo." },
      { q: "Which licenses are offered?", a: "MIT, Apache-2.0, and a none option that omits the section. Pick the license with counsel or the project policy, not from habit." },
      { q: "Is the draft saved on a server?", a: "No. It stays in this browser unless you copy a share link." },
    ],
  },
};

const extras: Record<string, ToolContent> = {
  "json-formatter/jsonpath": {
    howTo: [
      "This page opens the JSON formatter with the JSONPath box in front. The sample document has a list of items with price and label.",
      "A path starts with $. $.items[0].label reads one field. $.items[*].label reads every label. $.items[?(@.price<10)] keeps objects whose price is less than 10. $..price finds every price at any depth.",
      "The same document can be formatted or validated from the JSON formatter page. The query runs against the parsed value, so invalid JSON has no results.",
    ],
    steps: ["Keep or replace the sample JSON.", "Edit the JSONPath.", "Copy the match list."],
    faqs: [
      { q: "Why did a filter return nothing?", a: "Filters compare a number or a quoted string. [@.price<10] does not coerce a numeric string. Check that the property exists on each element." },
      { q: "Does .. search inside the matched value?", a: "Yes. $..price walks the whole tree and collects every value whose key is price." },
      { q: "Is the document uploaded?", a: "No." },
    ],
  },
  "yaml-to-json/kubernetes": {
    howTo: [
      "The sample is a Deployment. apiVersion and kind stay strings, metadata is an object, and the container list stays an array. That is the mapping kubectl uses when it reads the same file as YAML.",
      "Converting to JSON is useful for a diff tool or a client that wants an object. It does not talk to a cluster and it does not apply the manifest.",
      "Replace example.com/api:1.4.0 and the replica count before you use the output anywhere else.",
    ],
    steps: ["Review the Deployment sample or paste your own manifest.", "Convert it to JSON.", "Check metadata.name and spec.template.spec.containers."],
    faqs: [
      { q: "Does this talk to the Kubernetes API?", a: "No. It only converts the document." },
      { q: "What happened to comments in my manifest?", a: "JSON cannot store them. Keep the YAML file as the source of truth if comments matter." },
      { q: "Can I convert the JSON back?", a: "Yes. Use JSON to YAML. Field order follows the parsed object." },
    ],
  },
  "yaml-to-json/docker-compose": {
    howTo: [
      "The sample Compose file has a web service and a cache service. The quoted port mapping stays a string, because 8080:80 would be ambiguous if it were parsed as a number.",
      "Compose files are often a single document. If yours has several documents separated by ---, convert them one at a time.",
      "The result is data. It does not run docker compose.",
    ],
    steps: ["Paste a compose file or use the sample.", "Convert to JSON.", "Check ports and environment values, which are often strings on purpose."],
    faqs: [
      { q: "Why is the port a string?", a: "The sample quotes 8080:80. An unquoted value can be read as a string too, but quoting keeps the mapping obvious." },
      { q: "Are anchors supported?", a: "The parser resolves YAML aliases when the document uses them. The sample does not need an anchor." },
      { q: "Is the file uploaded?", a: "No." },
    ],
  },
  "yaml-to-json/github-actions": {
    howTo: [
      "The sample workflow runs on a push to main and has one job. on is a normal mapping key. In YAML it does not need quotes here; in some emitters the key is quoted because on can look like a boolean in other files.",
      "Converting a workflow to JSON helps when you want to diff the data or feed it to a script. GitHub still expects the workflow file to be YAML.",
      "The sample does not use secrets. Do not paste a workflow that has inlined tokens.",
    ],
    steps: ["Paste a workflow or use the sample.", "Convert it.", "Keep the .yml file in .github/workflows as the file GitHub reads."],
    faqs: [
      { q: "Will GitHub run the JSON?", a: "No. Actions workflows are YAML files. The JSON is for inspection and for tools that want an object." },
      { q: "Did the branch filter survive?", a: "Yes. branches is an array with one string, main." },
      { q: "Is the workflow uploaded?", a: "No." },
    ],
  },
  "yaml-to-json/helm": {
    howTo: [
      "Helm values files are nested maps. The sample has replicaCount, an image map, a service map, and resource limits. Those keys stay nested in the JSON.",
      "Values are inputs to a chart, not a rendered manifest. Converting them does not run Helm and does not produce a Deployment.",
      "Use the Kubernetes page if you already have a rendered manifest.",
    ],
    steps: ["Paste values.yaml or use the sample.", "Convert it to JSON.", "Compare nested keys such as image.tag with what the chart documents."],
    faqs: [
      { q: "Does this render templates?", a: "No. Template directives such as {{ }} are not evaluated. A file full of templates is not plain YAML." },
      { q: "Why convert values to JSON?", a: "Some editors and review tools diff JSON more clearly, and some APIs accept a values object." },
      { q: "Are the values uploaded?", a: "No." },
    ],
  },
  "base64/encode": {
    howTo: [
      "This page starts in encode mode. Text is converted from Unicode to UTF-8 and then to Base64. A dropped file is encoded from its raw bytes.",
      "Turn on URL-safe if the result will sit in a query string or a JWT-like token. That alphabet uses - and _ and drops the trailing = padding.",
      "Encoding does not hide the content. Decode will return the same text or bytes.",
    ],
    steps: ["Paste text or drop a file.", "Choose standard or URL-safe.", "Copy the Base64."],
    faqs: [
      { q: "Why did a short string grow?", a: "Base64 uses four characters for every three bytes, plus padding. Growth of about one third is expected." },
      { q: "Does encode upload the file?", a: "No." },
      { q: "Can I decode on the same page?", a: "Yes. Switch to decode, or open the Base64 decode page." },
    ],
  },
  "base64/decode": {
    howTo: [
      "Paste Base64. DevKit accepts the standard alphabet and the URL-safe alphabet, and it ignores whitespace. Padding is restored when it is missing.",
      "The text view interprets the bytes as UTF-8. If the payload is a binary file, use Download bytes instead of reading the text pane.",
      "A JWT is not plain Base64 of the whole token. Use the JWT decoder for header and payload.",
    ],
    steps: ["Paste a Base64 string.", "Read the text or download the bytes.", "If decoding throws, check for a cut-off quote or a missing character."],
    faqs: [
      { q: "Why is the text garbled?", a: "The bytes are not UTF-8 text. Download the file and open it in the program that created it." },
      { q: "Do you verify a checksum?", a: "No. Base64 only reverses the encoding. Use the hash tool if you have a checksum to compare." },
      { q: "Does decode upload the string?", a: "No." },
    ],
  },
  "hash-generator/sha256": {
    howTo: [
      "SHA-256 is selected. Paste text or drop a file. The hex digest is 64 characters, which is 32 bytes.",
      "The well-known digest of the three characters abc is ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad. You can paste abc to confirm this page matches that test vector.",
      "Use SHA-256 for checksums and content addresses. Do not use it as a password hash.",
    ],
    steps: ["Paste the text or drop the file.", "Copy the hex digest.", "Compare it with the published checksum, including letter case if the other side is strict."],
    faqs: [
      { q: "Does a newline change the hash?", a: "Yes. Hashing abc and hashing abc plus a newline produces different digests. Match the bytes the publisher hashed." },
      { q: "Is SHA-256 still appropriate?", a: "Yes for checksums and integrity. It is not broken for collision resistance the way SHA-1 is." },
      { q: "Is the file uploaded to be hashed?", a: "No. Web Crypto hashes it on this device." },
    ],
  },
  "hash-generator/sha512": {
    howTo: [
      "SHA-512 is selected. The hex digest is 128 characters. Base64 of the same digest is shorter to read and longer to mistype in a different way, so prefer hex when a publisher published hex.",
      "SHA-512 is part of the SHA-2 family, like SHA-256. It is a checksum. It is not bcrypt, scrypt, or Argon2.",
      "Drop a file to hash bytes rather than a text encoding of those bytes.",
    ],
    steps: ["Paste text or drop a file.", "Copy the hex digest.", "Compare length first: a SHA-512 hex digest has 128 characters."],
    faqs: [
      { q: "Why is my digest the wrong length?", a: "You may be looking at SHA-256, which is 64 hex characters, or at a Base64 digest. Switch the copy button to the form the other side used." },
      { q: "Is SHA-512 slower in the browser?", a: "Web Crypto uses the platform implementation. For a file you would actually review, the difference is not something you need to tune." },
      { q: "Does the hash leave the browser?", a: "No." },
    ],
  },
};

function cronPage(slug: string): ToolContent | undefined {
  const preset = cronPresets.find((item) => item.slug === slug.replace("cron/", ""));
  if (!preset) return undefined;
  const parsed = parseCron(preset.expression);
  return {
    howTo: [
      `${preset.h1} is the expression ${preset.expression}. ${parsed.summary} ${preset.note}`,
      `The fields are ${parsed.fields.map((field) => `${field.name} (${field.raw}: ${field.detail})`).join(", ")}. DevKit lists the next five times in the timezone of this computer, starting from the next minute.`,
      "Copy the five fields into a crontab. A scheduler that expects Quartz syntax wants a seconds field in front, which this expression does not include.",
    ],
    steps: [
      `Confirm the expression ${preset.expression}.`,
      "Read each field under the box.",
      "Check the next five run times against the server clock, not only your laptop clock.",
    ],
    faqs: [
      { q: `What does ${preset.expression} mean?`, a: `${parsed.summary} ${preset.note}` },
      { q: "Will this fire five minutes after I install it?", a: "Only if the next matching minute happens to be five minutes away. Step expressions use clock boundaries. A job saved at 10:01 with */5 waits until 10:05." },
      { q: "Which timezone is used?", a: "The next-run list uses this browser's timezone. A server crontab uses the server timezone. Convert an expected instant with the Unix timestamp tool if the two clocks differ." },
    ],
  };
}

export function contentFor(slug: string): ToolContent | undefined {
  return primary[slug] ?? extras[slug] ?? cronPage(slug);
}
