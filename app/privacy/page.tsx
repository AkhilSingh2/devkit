import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "DevKit processes text on your device. History stays in local storage. Trackers and ads are off unless you enable them.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return (
    <article className="tool-page">
      <p className="eyebrow">Privacy</p>
      <h1>Privacy</h1>
      <p>Tools parse and convert data in your browser. DevKit does not have a backend that receives what you paste.</p>
      <h2>What is stored on this device</h2>
      <p>The last input for each tool, and up to 40 history snapshots, are kept in localStorage. You can clear them from the footer or the search dialog. The theme choice is stored the same way.</p>
      <h2>Share links</h2>
      <p>The page writes the current input into the URL hash so you can bookmark or send it. The hash is not a request to DevKit. It is part of the address, so treat a shared link as a copy of the input.</p>
      <h2>Files</h2>
      <p>Dropped files are read with the File API. They are not uploaded.</p>
      <h2>Cache</h2>
      <p>A service worker caches the app shell and pages so they can open offline. That cache holds the site, not your documents.</p>
      <h2>Analytics and ads</h2>
      <p>Neither is included in a default build. A Plausible script can be added with NEXT_PUBLIC_PLAUSIBLE, and a Carbon ad slot can be added with NEXT_PUBLIC_ADS_ENABLED. Both stay off when those flags are unset. DevKit does not load third-party fonts.</p>
    </article>
  );
}
