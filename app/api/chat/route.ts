// /app/api/chat/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { userInput, transactions } = await request.json();

    const context = `The user has the following transactions: ${JSON.stringify(transactions)}.
                     Answer the following question about these transactions: ${userInput}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that answers questions about financial transactions." },
        { role: "user", content: userInput },
      ],
    });

    const aiContent = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ message: aiContent });
  } catch (error) {
    console.error('Error getting response from OpenAI:', error);
    return NextResponse.json({ error: 'Failed to get response from OpenAI' }, { status: 500 });
  }
}
