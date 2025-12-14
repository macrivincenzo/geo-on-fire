import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations, messages } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkCredits, deductCredits, getCreditBalance } from '@/lib/credits-manager';
import { 
  AuthenticationError, 
  InsufficientCreditsError, 
  ValidationError, 
  DatabaseError,
  ExternalServiceError,
  handleApiError 
} from '@/lib/api-errors';
import { 
  CREDITS_PER_MESSAGE,
  ERROR_MESSAGES,
  ROLE_USER,
  ROLE_ASSISTANT,
  UI_LIMITS
} from '@/config/constants';

// Force dynamic rendering to prevent build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get the session
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse?.user) {
      console.error('No session found in chat API');
      throw new AuthenticationError('Please log in to use the chat');
    }

    console.log('Chat API - User:', sessionResponse.user.id);

    const { message, conversationId } = await request.json();

    if (!message || typeof message !== 'string') {
      throw new ValidationError('Invalid message format', {
        message: 'Message must be a non-empty string'
      });
    }

    // Check if user has enough credits
    const creditCheck = await checkCredits(sessionResponse.user.id, CREDITS_PER_MESSAGE);
    
    if (!creditCheck.hasEnough) {
      throw new InsufficientCreditsError(
        ERROR_MESSAGES.NO_CREDITS_REMAINING,
        CREDITS_PER_MESSAGE,
        creditCheck.balance.totalBalance
      );
    }

    // Deduct credits (wallet first, then subscription)
    const messageId = crypto.randomUUID();
    await deductCredits(
      sessionResponse.user.id,
      CREDITS_PER_MESSAGE,
      'Chat message',
      messageId,
      {
        type: 'chat_message',
        conversationId: conversationId || 'new',
      }
    );

    // Get or create conversation
    let currentConversation;
    
    if (conversationId) {
      // Find existing conversation
      const existingConversation = await db.query.conversations.findFirst({
        where: and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, sessionResponse.user.id)
        ),
      });
      
      if (existingConversation) {
        currentConversation = existingConversation;
        // Update last message timestamp
        await db
          .update(conversations)
          .set({ lastMessageAt: new Date() })
          .where(eq(conversations.id, conversationId));
      }
    }
    
    if (!currentConversation) {
      // Create new conversation
      const [newConversation] = await db
        .insert(conversations)
        .values({
          userId: sessionResponse.user.id,
          title: message.substring(0, UI_LIMITS.TITLE_MAX_LENGTH) + (message.length > UI_LIMITS.TITLE_MAX_LENGTH ? '...' : ''),
          lastMessageAt: new Date(),
        })
        .returning();
      
      currentConversation = newConversation;
    }

    // Store user message
    const [userMessage] = await db
      .insert(messages)
      .values({
        conversationId: currentConversation.id,
        userId: sessionResponse.user.id,
        role: ROLE_USER,
        content: message,
      })
      .returning();

    // Simple mock AI response
    const responses = [
      "I understand you're asking about " + message.substring(0, 20) + ". Here's what I think...",
      "That's an interesting question! Let me help you with that.",
      "Based on what you're saying, I can suggest the following approach...",
      "Thanks for your message! Here's my response to your query.",
      "I'm here to help! Regarding your question about " + message.substring(0, 15) + "...",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // Store AI response
    const [aiMessage] = await db
      .insert(messages)
      .values({
        conversationId: currentConversation.id,
        userId: sessionResponse.user.id,
        role: ROLE_ASSISTANT,
        content: randomResponse,
        tokenCount: randomResponse.length, // Simple token count estimate
      })
      .returning();

    // Get remaining credits using our credits manager
    let remainingCredits = 0;
    try {
      const balance = await getCreditBalance(sessionResponse.user.id);
      remainingCredits = balance.totalBalance;
    } catch (err) {
      console.error('Failed to get remaining credits:', err);
    }

    return NextResponse.json({
      response: randomResponse,
      remainingCredits,
      creditsUsed: CREDITS_PER_MESSAGE,
      conversationId: currentConversation.id,
      messageId: aiMessage.id,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return handleApiError(error);
  }
}

// GET endpoint to fetch conversation history
export async function GET(request: NextRequest) {
  try {
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      // Get specific conversation with messages
      const conversation = await db.query.conversations.findFirst({
        where: and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, sessionResponse.user.id)
        ),
        with: {
          messages: {
            orderBy: [messages.createdAt],
          },
        },
      });

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      return NextResponse.json(conversation);
    } else {
      // Get all conversations for the user
      const userConversations = await db.query.conversations.findMany({
        where: eq(conversations.userId, sessionResponse.user.id),
        orderBy: [desc(conversations.lastMessageAt)],
        with: {
          messages: {
            limit: 1,
            orderBy: [desc(messages.createdAt)],
          },
        },
      });

      return NextResponse.json(userConversations);
    }
  } catch (error: any) {
    console.error('Chat GET error:', error);
    return handleApiError(error);
  }
}
