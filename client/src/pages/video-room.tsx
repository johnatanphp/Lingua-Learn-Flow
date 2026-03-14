import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useCreateRecording } from "@/hooks/use-platform";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Send, Users,
  Radio, Settings, Monitor, Circle, StopCircle, Maximize2, MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Peer {
  id: string;
  userName: string;
  isHost: boolean;
  connection?: RTCPeerConnection;
  stream?: MediaStream;
}

interface ChatMsg {
  from: string;
  userName: string;
  message: string;
  ts: number;
}

export default function VideoRoom() {
  const { code } = useParams<{ code: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const createRecording = useCreateRecording();

  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);

  const [peers, setPeers] = useState<Peer[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isHost, setIsHost] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [peersCount, setPeersCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const iceServers = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];

  const userId = user?.id || `guest_${Math.random().toString(36).slice(2)}`;
  const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Invitado";

  const sendWs = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const createPeerConnection = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection({ iceServers });
    peerConnectionsRef.current.set(peerId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        sendWs({ type: "ice-candidate", roomCode: code, to: peerId, from: userId, data: { candidate } });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(peerId, e.streams[0]);
        return newMap;
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setRemoteStreams(prev => { const m = new Map(prev); m.delete(peerId); return m; });
      }
    };

    return pc;
  }, [code, userId, sendWs]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Connect WebSocket
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws/signaling`);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!mounted) return;
          setIsConnected(true);
          sendWs({ type: "join", roomCode: code, from: userId, userName });
        };

        ws.onmessage = async ({ data }) => {
          if (!mounted) return;
          const msg = JSON.parse(data);

          if (msg.type === "room-state") {
            setIsHost(msg.data.isHost);
            setPeersCount(msg.data.peersCount);
            if (msg.data.isHost) {
              timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
            }
            // Create offers to existing peers
            for (const peer of msg.data.peers) {
              const pc = createPeerConnection(peer.id);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sendWs({ type: "offer", roomCode: code, to: peer.id, from: userId, data: { sdp: offer } });
            }
          }

          else if (msg.type === "peer-joined") {
            setPeersCount(msg.data.peersCount);
          }

          else if (msg.type === "peer-left") {
            setPeersCount(msg.data.peersCount);
            peerConnectionsRef.current.get(msg.from)?.close();
            peerConnectionsRef.current.delete(msg.from);
            setRemoteStreams(prev => { const m = new Map(prev); m.delete(msg.from); return m; });
          }

          else if (msg.type === "offer") {
            const pc = createPeerConnection(msg.from);
            await pc.setRemoteDescription(new RTCSessionDescription(msg.data.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendWs({ type: "answer", roomCode: code, to: msg.from, from: userId, data: { sdp: answer } });
          }

          else if (msg.type === "answer") {
            const pc = peerConnectionsRef.current.get(msg.from);
            if (pc) await pc.setRemoteDescription(new RTCSessionDescription(msg.data.sdp));
          }

          else if (msg.type === "ice-candidate") {
            const pc = peerConnectionsRef.current.get(msg.from);
            if (pc && msg.data.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(msg.data.candidate));
            }
          }

          else if (msg.type === "chat") {
            setChatMessages(prev => [...prev, { from: msg.from, userName: msg.data.userName, message: msg.data.message, ts: Date.now() }]);
          }
        };

        ws.onclose = () => setIsConnected(false);
        ws.onerror = () => setIsConnected(false);
      } catch (e: any) {
        toast({ title: "Error al acceder a cámara/micrófono", description: e.message, variant: "destructive" });
      }
    }

    init();

    return () => {
      mounted = false;
      clearInterval(timerRef.current);
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      peerConnectionsRef.current.forEach(pc => pc.close());
      wsRef.current?.close();
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    };
  }, [code]);

  function toggleMic() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMicOn(track.enabled); }
  }

  function toggleCam() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCamOn(track.enabled); }
  }

  function startRecording() {
    if (!localStreamRef.current) return;
    recordChunksRef.current = [];
    const mr = new MediaRecorder(localStreamRef.current, { mimeType: "video/webm;codecs=vp9,opus" });
    mr.ondataavailable = e => { if (e.data.size > 0) recordChunksRef.current.push(e.data); };
    mr.onstop = async () => {
      const blob = new Blob(recordChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `grabacion-${code}-${Date.now()}.webm`; a.click();
      URL.revokeObjectURL(url);
      try {
        await createRecording.mutateAsync({
          title: `Grabación sala ${code}`,
          description: `Grabación automática - ${new Date().toLocaleString("es-ES")}`,
          duration: elapsed,
          fileSize: blob.size,
        });
        toast({ title: "Grabación guardada" });
      } catch {}
    };
    mr.start(1000);
    mediaRecorderRef.current = mr;
    setIsRecording(true);
    toast({ title: "Grabando...", description: "La grabación ha iniciado" });
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  function sendChat() {
    if (!chatInput.trim()) return;
    sendWs({ type: "chat", roomCode: code, from: userId, userName, data: { message: chatInput } });
    setChatMessages(prev => [...prev, { from: userId, userName: "Tú", message: chatInput, ts: Date.now() }]);
    setChatInput("");
  }

  function leaveRoom() {
    sendWs({ type: "leave", roomCode: code, from: userId });
    navigate("/classes");
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const remoteEntries = Array.from(remoteStreams.entries());

  return (
    <div className="h-screen bg-gray-950 flex flex-col text-white overflow-hidden">
      {/* Header */}
      <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Radio className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="font-bold text-sm">Sala: <span className="font-mono text-primary">{code}</span></p>
            {isHost && <p className="text-xs text-muted-foreground">{formatTime(elapsed)}</p>}
          </div>
          {isRecording && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs animate-pulse">
              <Circle className="w-2 h-2 mr-1 fill-red-400" /> Grabando
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`text-xs border ${isConnected ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
            {isConnected ? `● Conectado` : "○ Desconectado"}
          </Badge>
          <Badge className="bg-gray-800 text-gray-300 border-gray-700 text-xs">
            <Users className="w-3 h-3 mr-1" />{peersCount}
          </Badge>
          {isHost && (
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Host</Badge>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 grid gap-2 p-3 ${remoteEntries.length === 0 ? "grid-cols-1" : remoteEntries.length <= 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
          {/* Local video */}
          <div className="relative bg-gray-800 rounded-2xl overflow-hidden">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {!isCamOn && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{userName[0]}</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <Badge className="bg-black/60 text-white border-0 text-xs backdrop-blur-sm">Tú {isHost ? "· Host" : ""}</Badge>
              {!isMicOn && <Badge className="bg-red-500/80 text-white border-0 text-xs"><MicOff className="w-3 h-3" /></Badge>}
            </div>
          </div>

          {/* Remote videos */}
          {remoteEntries.map(([peerId, stream]) => (
            <RemoteVideo key={peerId} stream={stream} peerId={peerId} />
          ))}
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0">
            <div className="p-3 border-b border-gray-800 font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />Chat
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.map((m, i) => (
                <div key={i} className={`text-xs ${m.from === userId ? "text-right" : ""}`}>
                  <span className="text-gray-400 text-[10px]">{m.userName}</span>
                  <div className={`rounded-xl px-3 py-1.5 mt-0.5 inline-block max-w-[90%] text-left ${m.from === userId ? "bg-primary text-white" : "bg-gray-800 text-gray-100"}`}>
                    {m.message}
                  </div>
                </div>
              ))}
              {chatMessages.length === 0 && (
                <p className="text-center text-gray-500 text-xs mt-4">Sin mensajes aún</p>
              )}
            </div>
            <div className="p-3 border-t border-gray-800 flex gap-2">
              <Input
                data-testid="input-chat"
                placeholder="Mensaje..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendChat(); }}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 rounded-xl text-sm h-8"
              />
              <Button data-testid="button-send-chat" size="icon" className="h-8 w-8 rounded-xl shrink-0" onClick={sendChat}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-3 shrink-0">
        <ControlBtn
          data-testid="button-toggle-mic"
          icon={isMicOn ? Mic : MicOff}
          onClick={toggleMic}
          active={!isMicOn}
          label={isMicOn ? "Silenciar" : "Activar mic"}
        />
        <ControlBtn
          data-testid="button-toggle-cam"
          icon={isCamOn ? Video : VideoOff}
          onClick={toggleCam}
          active={!isCamOn}
          label={isCamOn ? "Apagar cam" : "Activar cam"}
        />
        <ControlBtn
          data-testid="button-toggle-chat"
          icon={MessageSquare}
          onClick={() => setShowChat(p => !p)}
          active={showChat}
          label="Chat"
        />
        {isHost && !isRecording && (
          <ControlBtn
            data-testid="button-start-recording"
            icon={Circle}
            onClick={startRecording}
            label="Grabar"
            className="bg-red-600/20 text-red-400 hover:bg-red-600/30"
          />
        )}
        {isHost && isRecording && (
          <ControlBtn
            data-testid="button-stop-recording"
            icon={StopCircle}
            onClick={stopRecording}
            label="Detener"
            className="bg-red-600 text-white hover:bg-red-700 animate-pulse"
          />
        )}
        <Button
          data-testid="button-leave-room"
          className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-12 px-6 font-bold"
          onClick={leaveRoom}
        >
          <PhoneOff className="w-5 h-5 mr-2" />
          Salir
        </Button>
      </div>
    </div>
  );
}

function RemoteVideo({ stream, peerId }: { stream: MediaStream; peerId: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="relative bg-gray-800 rounded-2xl overflow-hidden">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute bottom-2 left-2">
        <Badge className="bg-black/60 text-white border-0 text-xs backdrop-blur-sm">Participante</Badge>
      </div>
    </div>
  );
}

function ControlBtn({ icon: Icon, onClick, active = false, label, className = "", ...rest }: any) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all text-xs font-medium ${active ? "bg-red-500/20 text-red-400" : "bg-gray-800 text-gray-300 hover:bg-gray-700"} ${className}`}
      {...rest}
    >
      <Icon className="w-5 h-5" />
      <span className="hidden sm:block text-[10px]">{label}</span>
    </button>
  );
}
