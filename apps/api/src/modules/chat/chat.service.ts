import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ToolExecutor } from './tool-executor';
import { chatTools } from './chat-tools';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private toolExecutor: ToolExecutor,
    private config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get('OPENAI_API_KEY'),
    });
  }

  private readonly systemPrompt = `You are an AI assistant built into OmniFocus, a GTD (Getting Things Done) task management app. You help the user manage their tasks, projects, tags, folders, and perspectives through natural conversation.

You have access to tools for:
- **Actions (tasks)**: Create, update, complete, delete, search, flag, set dates, bulk operations
- **Projects**: Create (parallel/sequential/single_actions), update, complete, delete, review
- **Tags**: Create, update, delete, organize
- **Folders**: Create, update, delete, organize projects
- **Perspectives**: Create custom filtered views, update, delete

Guidelines:
- Be conversational, helpful, and concise
- When creating items, confirm what you created with key details
- When listing items, summarize the results naturally (don't dump raw JSON)
- For questions like "what's due tomorrow?", use list_actions with appropriate date filters
- You can chain multiple tools in one response (e.g., create a project then add tasks to it)
- If an operation fails, explain the error and suggest alternatives
- Use ISO date format (YYYY-MM-DD) for dates
- Today's date is ${new Date().toISOString().split('T')[0]}`;

  async createConversation(title?: string) {
    return this.prisma.chatConversation.create({
      data: { title: title || 'New Chat' },
      include: { messages: true },
    });
  }

  async listConversations() {
    return this.prisma.chatConversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async getConversation(id: string) {
    const conv = await this.prisma.chatConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async deleteConversation(id: string) {
    await this.prisma.chatConversation.delete({ where: { id } });
    return { success: true };
  }

  async sendMessage(conversationId: string, userMessage: string) {
    // 1. Save user message
    await this.prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'user',
        content: userMessage,
      },
    });

    // 2. Load conversation history
    const conversation = await this.getConversation(conversationId);
    
    // 3. Build OpenAI messages
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: this.systemPrompt },
      ...conversation.messages.map((m) => {
        if (m.role === 'assistant' && m.toolCalls) {
          return {
            role: 'assistant' as const,
            content: m.content || null,
            tool_calls: m.toolCalls as any,
          };
        }
        if (m.role === 'tool') {
          return {
            role: 'tool' as const,
            content: m.content,
            tool_call_id: (m.toolResults as any)?.tool_call_id || '',
          };
        }
        return {
          role: m.role as 'user' | 'assistant',
          content: m.content,
        };
      }),
    ];

    // 4. Call OpenAI
    let response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: chatTools,
      tool_choice: 'auto',
    });

    let assistantMessage = response.choices[0].message;
    const executedActions: Array<{ tool: string; args: any; result: any }> = [];

    // 5. Handle tool calls (loop for multi-step)
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Save assistant message with tool calls
      await this.prisma.chatMessage.create({
        data: {
          conversationId,
          role: 'assistant',
          content: assistantMessage.content || '',
          toolCalls: assistantMessage.tool_calls as any,
        },
      });

      // Execute each tool call
      const toolMessages: OpenAI.ChatCompletionMessageParam[] = [];
      for (const toolCall of assistantMessage.tool_calls) {
        const fn = (toolCall as any).function;
        const args = JSON.parse(fn.arguments);
        const result = await this.toolExecutor.execute(fn.name, args);
        
        executedActions.push({
          tool: fn.name,
          args,
          result,
        });

        // Save tool result as message
        await this.prisma.chatMessage.create({
          data: {
            conversationId,
            role: 'tool',
            content: JSON.stringify(result),
            toolResults: { tool_call_id: toolCall.id, tool_name: fn.name },
          },
        });

        toolMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      // Call OpenAI again with tool results
      messages.push(
        {
          role: 'assistant',
          content: assistantMessage.content || null,
          tool_calls: assistantMessage.tool_calls,
        } as any,
        ...toolMessages,
      );

      response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools: chatTools,
        tool_choice: 'auto',
      });

      assistantMessage = response.choices[0].message;
    }

    // 6. Save final assistant response
    const finalContent = assistantMessage.content || 'Done!';
    await this.prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'assistant',
        content: finalContent,
      },
    });

    // Update conversation title from first message if untitled
    const conv = await this.prisma.chatConversation.findUnique({ where: { id: conversationId } });
    if (conv && (!conv.title || conv.title === 'New Chat')) {
      // Use first few words of user message as title
      const title = userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage;
      await this.prisma.chatConversation.update({
        where: { id: conversationId },
        data: { title },
      });
    }

    return {
      message: finalContent,
      actions: executedActions.map((a) => ({
        tool: a.tool,
        success: !a.result?.error,
        summary: a.result?.error || this.summarizeAction(a.tool, a.args, a.result),
      })),
    };
  }

  private summarizeAction(tool: string, args: any, result: any): string {
    // Generate human-readable summaries of actions taken
    switch (tool) {
      case 'create_action':
        return `Created action "${result?.title || args.title}"`;
      case 'complete_action':
        return `Completed action "${result?.title || args.id}"`;
      case 'delete_action':
        return `Deleted action`;
      case 'create_project':
        return `Created project "${result?.name || args.name}"`;
      case 'list_actions':
        return `Found ${Array.isArray(result) ? result.length : 0} actions`;
      case 'search_actions':
        return `Found ${Array.isArray(result) ? result.length : 0} matching actions`;
      case 'create_tag':
        return `Created tag "${result?.name || args.name}"`;
      case 'create_folder':
        return `Created folder "${result?.name || args.name}"`;
      case 'bulk_complete_actions':
        return `Completed ${args.actionIds?.length || 0} actions`;
      default:
        return `Executed ${tool}`;
    }
  }
}
