import { createFileRoute } from "@tanstack/react-router";

// The color picker app is built as plain HTML/CSS/JS under /public.
// "/" redirects into the static home page so the live preview opens the app.
export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.location.replace("/home.html");`,
      }}
    />
  );
}
