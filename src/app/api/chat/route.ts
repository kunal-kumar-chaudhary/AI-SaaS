import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { Message } from "ai/react";
import { NextResponse } from "next/server";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();
    console.log("chatid: ",chatId);
    // getting file name from the chatId
    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));

    // if the chat is not exactly equal to 1, that means either the chat 
    // is not found or there are multiple chats with the same id which 
    // should not be the case
    if (_chats.length != 1) {
      return NextResponse.json({ error: "chat not found" }, { status: 404 });
    }
    const file_key = _chats[0].fileKey;
    
    const lastMessage = messages[messages.length - 1];
    console.log("lastMessage: ",lastMessage.content)
    const context = await getContext(lastMessage.content, file_key);
    console.log("context: ",context);
    const prompt = {
        role: "system",
        content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
        The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
        AI is a well-behaved and well-mannered individual.
        AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
        AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
        AI assistant is a big fan of Pinecone and Vercel.
        START CONTEXT BLOCK
        ${context}
        END OF CONTEXT BLOCK
        AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
        AI assistant will not invent anything that is not drawn directly from the context.
        `,
      };
    // saving user's message to the database
    await db.insert(_messages).values({
        chatId,
        content: lastMessage.content,
        role: "user"
    })

    // Generate AI response
    const result = await streamText({
      model: google("models/gemini-1.5-flash-latest"),
      messages: [
        prompt, 
        ...messages.filter((message: Message) => message.role === "user"),
      ],
      onFinish: async (completion) => {
        // Save the AI response to the database
        await db.insert(messages).values({
            chatId,
            content: completion,
            role: "system"
        })
      }
    });

    return result.toAIStreamResponse();
  } catch (error) {
    // Log error for debugging
    console.error("Error in POST /api/chat:", error);

    // Return error response
    return NextResponse.json({ error }, { status: 500 });
  }
}
