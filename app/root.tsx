import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#02060d" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "SYSTEM FAULT";
  let details = "An unexpected subroutine exception occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404 // SIGNAL LOST" : "ERR // SYSTEM";
    details =
      error.status === 404
        ? "Target coordinates not found in J.A.R.V.I.S. registry."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center text-center">
      <div className="hud-panel p-8 max-w-xl w-full">
        <h1 className="hud-font text-3xl hud-text-glow mb-3">{message}</h1>
        <p className="hud-mono text-sm text-cyan-200/80">{details}</p>
        {stack && (
          <pre className="w-full p-4 overflow-x-auto text-left hud-mono text-xs text-cyan-300/70 mt-4">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
