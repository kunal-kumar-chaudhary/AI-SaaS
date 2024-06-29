import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    const { chatId } = await req.json();

    // Fetch all messages related to the given chatId
    const _messages = await db
      .select({
        id: messages.id,
        chatId: messages.chatId,
        content: messages.content,
        role: messages.role,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.chatId, chatId));
      
    // Return the messages as a JSON response
    return NextResponse.json(_messages);
  } catch (error) {
    console.error("Error fetching messages:", error);

    // Return an error response if something goes wrong
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
};