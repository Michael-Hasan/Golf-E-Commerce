import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';

type JoinPayload = {
  roomId?: string;
  userId?: string;
  userName?: string;
};

type SendPayload = {
  roomId?: string;
  userId?: string;
  userName?: string;
  text?: string;
};

type DeletePayload = {
  roomId?: string;
  messageId?: string;
  mode?: 'me' | 'all';
  userId?: string;
};

type ChatMessage = {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
};

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: ['http://localhost:5173'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly roomHistory = new Map<string, ChatMessage[]>();
  private readonly roomMembers = new Map<string, Set<string>>();
  private readonly socketRoom = new Map<string, string>();

  afterInit(): void {
    // no-op
  }

  handleDisconnect(client: Socket): void {
    const roomId = this.socketRoom.get(client.id);
    if (!roomId) return;
    this.leaveRoom(client.id, roomId);
  }

  @SubscribeMessage('chat:join')
  onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPayload,
  ): void {
    const roomId = this.normalizeRoomId(payload.roomId);
    this.leaveCurrentRoom(client.id);
    client.join(roomId);
    this.socketRoom.set(client.id, roomId);

    const members = this.roomMembers.get(roomId) ?? new Set<string>();
    members.add(client.id);
    this.roomMembers.set(roomId, members);

    client.emit('chat:history', this.roomHistory.get(roomId) ?? []);
    this.emitPresence(roomId);
  }

  @SubscribeMessage('chat:leave')
  onLeave(@ConnectedSocket() client: Socket): void {
    const roomId = this.socketRoom.get(client.id);
    if (!roomId) return;
    this.leaveRoom(client.id, roomId);
  }

  @SubscribeMessage('chat:send')
  onSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendPayload,
  ): void {
    const roomId = this.normalizeRoomId(payload.roomId ?? this.socketRoom.get(client.id));
    if (!roomId) return;

    const text = payload.text?.trim();
    if (!text) return;

    const message: ChatMessage = {
      id: randomUUID(),
      roomId,
      userId: payload.userId?.trim() || client.id,
      userName: payload.userName?.trim() || 'Guest',
      text: text.slice(0, 500),
      createdAt: new Date().toISOString(),
    };

    const existing = this.roomHistory.get(roomId) ?? [];
    const next = [...existing, message].slice(-100);
    this.roomHistory.set(roomId, next);
    this.server.to(roomId).emit('chat:message', message);
  }

  @SubscribeMessage('chat:delete')
  onDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DeletePayload,
  ): void {
    const roomId = this.normalizeRoomId(payload.roomId ?? this.socketRoom.get(client.id));
    const messageId = payload.messageId?.trim();
    if (!messageId) return;

    if (payload.mode === 'all') {
      const existing = this.roomHistory.get(roomId) ?? [];
      const target = existing.find((message) => message.id === messageId);
      if (!target) return;

      const actorId = payload.userId?.trim();
      const canDeleteForAll =
        target.userId !== 'system' &&
        typeof actorId === 'string' &&
        actorId.length > 0 &&
        target.userId === actorId;
      if (!canDeleteForAll) return;

      const next = existing.filter((message) => message.id !== messageId);
      this.roomHistory.set(roomId, next);
      this.server.to(roomId).emit('chat:deleted', { messageId, mode: 'all' });
      return;
    }

    client.emit('chat:deleted', { messageId, mode: 'me' });
  }

  private leaveCurrentRoom(socketId: string): void {
    const currentRoom = this.socketRoom.get(socketId);
    if (!currentRoom) return;
    this.leaveRoom(socketId, currentRoom);
  }

  private leaveRoom(socketId: string, roomId: string): void {
    this.socketRoom.delete(socketId);
    const members = this.roomMembers.get(roomId);
    if (!members) return;
    members.delete(socketId);
    if (members.size === 0) {
      this.roomMembers.delete(roomId);
    } else {
      this.roomMembers.set(roomId, members);
    }
    this.emitPresence(roomId);
  }

  private emitPresence(roomId: string): void {
    const onlineCount = this.roomMembers.get(roomId)?.size ?? 0;
    this.server.to(roomId).emit('chat:presence', { roomId, onlineCount });
  }

  private normalizeRoomId(roomId?: string): string {
    return roomId?.trim() || 'global';
  }
}
