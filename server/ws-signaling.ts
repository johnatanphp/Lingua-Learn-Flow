import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "./storage";

interface SignalingMessage {
  type: "join" | "offer" | "answer" | "ice-candidate" | "leave" | "chat" | "host-control";
  roomCode: string;
  from?: string;
  to?: string;
  data?: any;
  userName?: string;
}

interface RoomPeer {
  ws: WebSocket;
  userId: string;
  userName: string;
  isHost: boolean;
}

const rooms = new Map<string, Map<string, RoomPeer>>();

export function setupWebSocketSignaling(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/signaling" });

  wss.on("connection", (ws: WebSocket) => {
    let currentRoom: string | null = null;
    let currentUserId: string | null = null;

    ws.on("message", async (raw) => {
      try {
        const msg: SignalingMessage = JSON.parse(raw.toString());

        if (msg.type === "join") {
          currentRoom = msg.roomCode;
          currentUserId = msg.from || "anon_" + Math.random().toString(36).slice(2);

          if (!rooms.has(currentRoom)) {
            rooms.set(currentRoom, new Map());
          }
          const room = rooms.get(currentRoom)!;
          const isHost = room.size === 0;

          room.set(currentUserId, {
            ws,
            userId: currentUserId,
            userName: msg.userName || "Usuario",
            isHost,
          });

          // Update room status in DB
          try {
            const dbRoom = await storage.getVideoRoom(currentRoom);
            if (dbRoom && dbRoom.status === "waiting" && isHost) {
              await storage.updateVideoRoom(dbRoom.id, { status: "live", startedAt: new Date() });
            }
          } catch {}

          // Notify others in room about new peer
          broadcast(currentRoom, currentUserId, {
            type: "peer-joined",
            from: currentUserId,
            data: { userName: msg.userName, isHost, peersCount: room.size },
          });

          // Send current peers list to new joiner
          const peers = Array.from(room.entries())
            .filter(([id]) => id !== currentUserId)
            .map(([id, p]) => ({ id, userName: p.userName, isHost: p.isHost }));

          ws.send(JSON.stringify({
            type: "room-state",
            data: { peers, isHost, peersCount: room.size },
          }));
        }

        else if (msg.type === "offer" || msg.type === "answer" || msg.type === "ice-candidate") {
          // Forward signaling to specific peer
          if (msg.to && currentRoom) {
            const room = rooms.get(currentRoom);
            const targetPeer = room?.get(msg.to);
            if (targetPeer && targetPeer.ws.readyState === WebSocket.OPEN) {
              targetPeer.ws.send(JSON.stringify({ ...msg, from: currentUserId }));
            }
          }
        }

        else if (msg.type === "chat") {
          broadcast(currentRoom!, currentUserId!, {
            type: "chat",
            from: currentUserId,
            data: { message: msg.data?.message, userName: msg.userName },
          });
        }

        else if (msg.type === "host-control") {
          broadcast(currentRoom!, currentUserId!, {
            type: "host-control",
            from: currentUserId,
            data: msg.data,
          });
        }

        else if (msg.type === "leave") {
          handleLeave(currentRoom, currentUserId);
        }
      } catch (err) {
        console.error("[WS Signaling] Error:", err);
      }
    });

    ws.on("close", () => {
      handleLeave(currentRoom, currentUserId);
    });

    ws.on("error", () => {
      handleLeave(currentRoom, currentUserId);
    });
  });

  async function handleLeave(roomCode: string | null, userId: string | null) {
    if (!roomCode || !userId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    const peer = room.get(userId);
    room.delete(userId);

    if (room.size === 0) {
      rooms.delete(roomCode);
      try {
        const dbRoom = await storage.getVideoRoom(roomCode);
        if (dbRoom && dbRoom.status === "live") {
          await storage.updateVideoRoom(dbRoom.id, { status: "ended", endedAt: new Date() });
        }
      } catch {}
    } else {
      broadcast(roomCode, userId, {
        type: "peer-left",
        from: userId,
        data: { wasHost: peer?.isHost, peersCount: room.size },
      });
    }
  }

  function broadcast(roomCode: string, exceptUserId: string, msg: object) {
    const room = rooms.get(roomCode);
    if (!room) return;
    const payload = JSON.stringify(msg);
    room.forEach((peer, id) => {
      if (id !== exceptUserId && peer.ws.readyState === WebSocket.OPEN) {
        peer.ws.send(payload);
      }
    });
  }

  console.log("[WS] Signaling server ready at /ws/signaling");
  return wss;
}
