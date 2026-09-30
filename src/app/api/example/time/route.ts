export const dynamic = "force-dynamic";

/** A trivial server route, so the example deck can show a live component that talks to a server. */
export async function GET() {
  return Response.json({ now: new Date().toISOString(), pid: process.pid });
}
