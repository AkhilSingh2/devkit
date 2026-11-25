# DevKit SEO plan

Generic head terms are crowded. DevKit does not try to outrank them with a thinner tool. Each tool is a real page, and the extra pages exist only where the job is specific enough to deserve its own explanation, sample, and questions.

Difficulty notes below are the Ahrefs US figures supplied with the brief. They are planning context, not a live export.

## Keyword to page

| Keyword | Difficulty | URL | Intent the page answers |
| --- | --- | --- | --- |
| json formatter | >10K Hard | `/json-formatter/` | Format, minify, validate, tree, JSONPath |
| jsonpath | long-tail of the formatter | `/json-formatter/jsonpath/` | Run a path against a document |
| json to typescript | <100 Easy | `/json-to-typescript/` | Interfaces from a sample |
| json to zod | adjacent | `/json-to-zod/` | Zod schema from the same inference |
| json to go struct | adjacent | `/json-to-go/` | Go structs and json tags |
| yaml to json | >1K Easy | `/yaml-to-json/` | General YAML to JSON |
| yaml to json converter | >100 Easy | same page, phrase in the title and H1 | |
| kubernetes yaml to json | long-tail | `/yaml-to-json/kubernetes/` | Deployment sample and field mapping |
| docker compose yaml to json | long-tail | `/yaml-to-json/docker-compose/` | Quoted ports and services |
| github actions yaml to json | long-tail | `/yaml-to-json/github-actions/` | Workflow as data, file stays YAML |
| helm values to json | long-tail | `/yaml-to-json/helm/` | values.yaml, not a rendered manifest |
| json to yaml | adjacent | `/json-to-yaml/` | Reverse conversion |
| json to csv | adjacent | `/json-to-csv/` | Flattened rows |
| jwt decoder | >1K Medium | `/jwt-decoder/` | Decode only, expiry, no verification |
| base64 decode | >10K Hard | `/base64/` and `/base64/decode/` | Text and file, both alphabets |
| base64 encode | adjacent | `/base64/encode/` | UTF-8 and raw file bytes |
| url encode / url decode | adjacent | `/url-encode/` | Component, full URL, form, decode |
| regex tester | >1K Hard | `/regex-tester/` | Matches, token explanation, cheat sheet |
| cron expression generator | adjacent | `/cron/` | Five fields, next five runs |
| cron every 5 minutes | long-tail | `/cron/every-5-minutes/` | `*/5 * * * *` and the clock boundaries |
| cron every minute / 15 minutes / hour / midnight / weekdays 9am / Sunday / first of month | long-tail | `/cron/<slug>/` | One expression, one explanation |
| unix timestamp converter | adjacent | `/unix-timestamp/` | Seconds vs milliseconds |
| uuid generator | adjacent | `/uuid-generator/` | UUID v4, ULID, NanoID |
| sha256 / sha512 | adjacent | `/hash-generator/sha256/`, `/hash-generator/sha512/` | Checksums, not password hashes |
| diff checker | >10K Hard | `/diff-checker/` | Side by side and inline |
| sql formatter | adjacent | `/sql-formatter/` | Clause layout |
| curl to code | <100 Easy | `/curl-to-code/` | fetch, axios, Python requests, Go |
| chmod calculator | >100 Easy | `/chmod-calculator/` | Octal, symbolic, special bits |
| html/css/js minify | adjacent | `/minify/` | Minify and beautify |
| markdown to pdf | adjacent | `/markdown-preview/` | Print stylesheet, browser PDF |
| color converter / contrast checker | adjacent | `/color-converter/` | hex, rgb, hsl, WCAG ratio |
| gitignore generator | adjacent | `/gitignore-generator/` | Combined starter templates |
| readme generator | adjacent | `/readme-generator/` | A draft README |

The home page links every tool and every guide in HTML, so the long-tail URLs are not only reachable from the command palette.

## On-page rules

- Title, H1, and meta description use the phrase a person would search, without stacking synonyms.
- The H1 matches the job. Guides do not reuse the parent H1.
- How-to copy and at least three questions are in the server HTML.
- Questions are also a `FAQPage` JSON-LD graph, with `WebApplication` and `BreadcrumbList`.
- Canonical URLs use a trailing slash. `metadataBase` is `NEXT_PUBLIC_SITE_URL`.
- Each page has its own 1200×630 PNG in `/og/`.
- Related tools and the guide list are normal links.
- `sitemap.xml` and `robots.txt` are emitted by the static build.
- No tracker is present unless `NEXT_PUBLIC_PLAUSIBLE` is set at build time.

## What a new guide has to earn

Add a URL only when all of these are true:

1. The expression, document, or mode is one people actually paste (a crontab line, a Kubernetes manifest, SHA-256).
2. The page has its own sample, its own H1, and answers that would be wrong or vague on the parent page.
3. The tool is prefilled with that sample so the page is useful before the visitor edits anything.

Do not add city, year, or "online free" variants of the same tool. Do not generate pages from a word list.

## Content to write next

These are worth a page later, for the same reason as the cron presets: the query is a specific job.

- `0 0 * * 1` as "cron every Monday", distinct from every Sunday.
- `30 4 * * *` as "cron at 4:30am", a common backup schedule.
- JSON to TypeScript from an array of objects, calling out optional keys, linked from the main converter.
- chmod `644` and `600` as short explanations of file versus private-key modes, only if each page shows the bits and says what it does not change.
- A curl example for a GET with a query string, linked from curl to code.

Leave the head terms (`json formatter`, `base64 decode`, `diff checker`, `regex tester`) on the single best page. More URLs will not make those easier.

## Measurement

Turn on Plausible only with the build flags in `.env.example`. Do not add a second analytics script. Review queries in Search Console against this map: if a guide gets impressions and the page does not answer that wording, edit the guide or remove it. Do not answer by adding doorway URLs.

## Internal links

- Parent tools list their guides under "Guides".
- Guides link back through related tools, which include the parent.
- The footer repeats the primary tools and two strong guides (every 5 minutes, Kubernetes YAML).
- The command palette indexes guides, but those results are client-side, so they are not a substitute for the HTML links.
