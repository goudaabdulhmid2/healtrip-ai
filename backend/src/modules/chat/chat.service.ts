import { BadRequestException, Injectable } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { ChatMessageDto, ChatTurnDto } from './dto/chat-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly agentService: AgentService) {}

  async sendMessage(dto: ChatMessageDto) {
    if (
      dto.messages &&
      (dto.message !== undefined || dto.history !== undefined)
    ) {
      throw new BadRequestException('Use either messages or message/history.');
    }

    let currentMessage: string;
    let history: ChatTurnDto[];

    if (dto.messages) {
      const current = dto.messages[dto.messages.length - 1];
      if (!current || current.role !== 'user') {
        throw new BadRequestException(
          'The last conversation message must be from the user.',
        );
      }
      currentMessage = current.content;
      history = dto.messages.slice(0, -1);
    } else {
      if (!dto.message) {
        throw new BadRequestException(
          'Provide a message or a messages transcript.',
        );
      }
      currentMessage = dto.message;
      history = dto.history ?? [];

      const lastTurn = history.at(-1);
      if (lastTurn?.role === 'user' && lastTurn.content === currentMessage) {
        history = history.slice(0, -1);
      }
    }

    return this.agentService.run(currentMessage, history);
  }
}
