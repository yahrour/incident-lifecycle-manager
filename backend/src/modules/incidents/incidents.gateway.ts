import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@/common/prisma/prisma.service";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Namespace, Socket } from "socket.io";

@WebSocketGateway({
  namespace: "/incidents",
  cors: {
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  },
})
export class IncidentsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(IncidentsGateway.name);

  @WebSocketServer()
  server!: Namespace;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.cookie?.match(
      /(?:^|;\s*)accessToken=([^;]+)/
    )?.[1];
    try {
      if (!token) throw new Error("No token");
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        token,
        { secret: this.configService.getOrThrow<string>("JWT_SECRET") }
      );
      const userId = payload.sub;
      client.data = { userId };

      const teams = await this.prisma.team.findMany({
        where: {
          OR: [{ ownerId: userId }, { teamMembers: { some: { userId } } }],
        },
        select: { id: true },
      });
      const rooms = [...teams.map(({ id }) => `team:${id}`), `user:${userId}`];
      await client.join(rooms);
      this.logger.log(`User ${userId} connected (${rooms.length} rooms)`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const { userId } = client.data as { userId?: string };
    if (userId) this.logger.log(`User ${userId} disconnected`);
  }

  incidentChanged(incident: {
    id: string;
    teamId: string | null;
    status: string;
    assignedToId: string | null;
  }) {
    const rooms = [
      incident.teamId && `team:${incident.teamId}`,
      incident.assignedToId && `user:${incident.assignedToId}`,
    ].filter((room): room is string => !!room);
    if (rooms.length === 0) return;
    this.server
      .to(rooms)
      .emit("incident:changed", { id: incident.id, status: incident.status });
  }
}
