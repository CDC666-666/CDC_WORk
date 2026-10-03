# Authentication UI

The GitHub sign-in button starts the OAuth flow. The top-bar sign-out button uses
NextAuth's CSRF-protected sign-out endpoint and returns to `/login`. If the request
fails, it shows an error and keeps the user on the current page. Access decisions
remain exclusively on the server and are enforced again for every private API request.
