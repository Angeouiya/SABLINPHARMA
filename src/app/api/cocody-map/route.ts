export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE_URL =
  "https://www.google.com/maps/d/kml?mid=1nnvl65GwhontbSP3vrZc6ZlkyTNZ3cw&forcekml=1";

export async function GET() {
  const upstream = await fetch(SOURCE_URL, {
    cache: "no-store",
    headers: {
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
    },
  });

  const payload = await upstream.arrayBuffer();
  return new Response(payload, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/octet-stream",
      "content-disposition": "attachment; filename=cocody-territories.kmz",
      "cache-control": "no-store",
    },
  });
}
