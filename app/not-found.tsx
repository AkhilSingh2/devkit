import { sitePath } from "@/lib/paths";

export default function NotFound() {
  return (
    <article className="tool-page">
      <h1>Page not found</h1>
      <p>That address is not one of the tools.</p>
      <p><a className="btn btn-primary" href={sitePath()}>Back to DevKit</a></p>
    </article>
  );
}
