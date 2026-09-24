import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

// The color picker app is built as plain HTML/CSS/JS under /public.
// "/" redirects into the static home page so the live preview opens the app.
export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/home.html");
  }, []);
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "#f6f5f1" }}
    >
      <p style={{ fontFamily: "system-ui, sans-serif", color: "#6c6c78" }}>
        Loading Chroma…
      </p>
    </div>
  );
}
