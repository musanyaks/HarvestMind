import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { predictions } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const crop = searchParams.get("crop");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);

    const where = crop ? eq(predictions.crop, crop) : undefined;

    const rows = await db
      .select()
      .from(predictions)
      .where(where)
      .orderBy(desc(predictions.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(predictions)
      .where(where);

    return NextResponse.json({ rows, count, limit, offset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch predictions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
