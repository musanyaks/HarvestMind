import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { predictions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid prediction ID" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(predictions)
      .where(eq(predictions.id, numericId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete prediction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
