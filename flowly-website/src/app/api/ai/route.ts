import { NextRequest, NextResponse } from 'next/server';
import { getAIResponse } from '../../../lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }
    const response = await getAIResponse(prompt);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
  }
} 