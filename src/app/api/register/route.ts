import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(
      "https://be-blg-production.up.railway.app/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        // cache: "no-store", // optional
      },
    );

    const text = await res.text();

    // Backend kadang balikin JSON, kadang text. Kita coba parse.
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      return NextResponse.json(
        { statusCode: res.status, error: data },
        { status: res.status },
      );
    }

    return NextResponse.json(data ?? {}, { status: res.status });
  } catch (e: any) {
    return NextResponse.json(
      {
        message: "Terjadi kesalahan pada server.",
        detail: String(e?.message ?? e),
      },
      { status: 500 },
    );
  }
}
