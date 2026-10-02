const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#2563eb"/>
  <path d="M43 20a20 20 0 1 0 0 24" fill="none" stroke="white" stroke-linecap="round" stroke-width="8"/>
</svg>`;

export function GET() {
  return new Response(favicon, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
  });
}

