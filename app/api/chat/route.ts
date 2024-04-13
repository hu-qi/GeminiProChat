import { auth } from '@/auth';
import { kv } from '@vercel/kv';
import { nanoid } from '@/lib/utils';
import { genAI, generationConfig, safetySettings } from '@/lib/config';

interface Part {
  text: string;
}

export async function POST(req: Request) {
  const json = await req.json();
  const { messages } = json;
  const userId = (await auth())?.user.id;

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const model = genAI.getGenerativeModel({ model: process.env.MODEL });

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    messages.push({
      role: 'user',
      content: '',
    });
  }

  const chatHistory = messages.map((message: { role: string; content: string; }) => ({
    role: message.role,
    parts: [{text: message.content}],
  }));

  const chat = model.startChat({
    history: chatHistory.map((entry: { parts: Part[] | undefined; responseMessage: string; }) => [
      { role: 'user', parts: entry.parts },
      { role: 'model', parts: entry.responseMessage || [{text: ''}] },
    ]).flat(),
    generationConfig,
    safetySettings,
  });

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  (async () => {
    let text = '';
    const result = await chat.sendMessageStream(messages[messages.length - 1].content);
    console.log('result', result);
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      text += chunkText;
      await writer.write(new TextEncoder().encode(chunkText));
    }

    const id = json.id ?? nanoid();
    const createdAt = new Date().toISOString();
    const path = `/chat/${id}`;

    const assistantReply = {
      content: text,
      role: 'model',
    };

    const payload = {
      id,
      title: messages[0].content.substring(0, 100),
      userId,
      createdAt,
      path,
      messages: [...messages, assistantReply],
    };

    await kv.hmset(`chat:${id}`, payload);
    await kv.zadd(`user:chat:${userId}`, {
      score: new Date(createdAt).getTime(), 
      member: `chat:${id}`,
    });
  
    await writer.close();
  })();
  
  return new Response(readable);
}