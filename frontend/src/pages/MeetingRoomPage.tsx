import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mic, MicOff, MonitorUp, PhoneOff, Video, VideoOff } from 'lucide-react';
import { meetingService } from '@/features/meetings/meeting.api';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Lightweight, single-file WebRTC-signalling meeting room. Rooms use socket.io
 * as the transport for offers/answers/ICE candidates. Mesh topology — good for
 * small huddles (2–6 people). Not for 50-person all-hands.
 */
export const MeetingRoomPage = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const nav = useNavigate();
  const socket = useSocket();
  const meetingQ = useQuery({
    queryKey: ['meeting', roomCode],
    queryFn: () => meetingService.get(roomCode!),
    enabled: !!roomCode,
  });

  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!socket || !roomCode) return;

    let cancelled = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        meetingService.join(roomCode).catch(() => undefined);
        socket.emit('meeting:join', roomCode);
      } catch (err) {
        toast.error('Camera/mic access denied');
      }
    };

    const createPeer = (peerSocketId: string, initiator: boolean) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peersRef.current.set(peerSocketId, pc);

      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });

      pc.onicecandidate = (evt) => {
        if (evt.candidate) {
          socket.emit('meeting:signal', {
            to: peerSocketId,
            roomCode,
            signal: { candidate: evt.candidate },
          });
        }
      };
      pc.ontrack = (evt) => {
        const [stream] = evt.streams;
        setRemoteStreams((prev) => ({ ...prev, [peerSocketId]: stream }));
      };

      if (initiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer).then(() => offer))
          .then((offer) => {
            socket.emit('meeting:signal', { to: peerSocketId, roomCode, signal: { sdp: offer } });
          })
          .catch(() => undefined);
      }
      return pc;
    };

    const onPeerJoined = ({ socketId }: { socketId: string }) => {
      if (!localStreamRef.current) return;
      createPeer(socketId, true);
    };
    const onPeerLeft = ({ socketId }: { socketId: string }) => {
      peersRef.current.get(socketId)?.close();
      peersRef.current.delete(socketId);
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    };
    const onSignal = async ({ from, signal }: { from: string; signal: any }) => {
      let pc = peersRef.current.get(from);
      if (!pc) pc = createPeer(from, false);
      if (signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (signal.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('meeting:signal', { to: from, roomCode, signal: { sdp: answer } });
        }
      } else if (signal.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch {
          /* ignore */
        }
      }
    };

    socket.on('meeting:peer-joined', onPeerJoined);
    socket.on('meeting:peer-left', onPeerLeft);
    socket.on('meeting:signal', onSignal);

    start();

    return () => {
      cancelled = true;
      socket.emit('meeting:leave', roomCode);
      socket.off('meeting:peer-joined', onPeerJoined);
      socket.off('meeting:peer-left', onPeerLeft);
      socket.off('meeting:signal', onSignal);
      peersRef.current.forEach((p) => p.close());
      peersRef.current.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      meetingService.leave(roomCode).catch(() => undefined);
    };
  }, [socket, roomCode]);

  const toggleMic = () => {
    const on = !micOn;
    setMicOn(on);
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = on));
  };
  const toggleCam = () => {
    const on = !camOn;
    setCamOn(on);
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = on));
  };
  const share = async () => {
    if (sharing) {
      // Restore camera
      const cam = await navigator.mediaDevices.getUserMedia({ video: true });
      const camTrack = cam.getVideoTracks()[0];
      peersRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        sender?.replaceTrack(camTrack);
      });
      localStreamRef.current?.getVideoTracks().forEach((t) => t.stop());
      const audio = localStreamRef.current?.getAudioTracks() ?? [];
      const newStream = new MediaStream([...audio, camTrack]);
      localStreamRef.current = newStream;
      if (localVideoRef.current) localVideoRef.current.srcObject = newStream;
      setSharing(false);
    } else {
      try {
        const screen = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
        const screenTrack = screen.getVideoTracks()[0];
        peersRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          sender?.replaceTrack(screenTrack);
        });
        screenTrack.onended = () => share();
        setSharing(true);
      } catch {
        toast.error('Screen sharing declined');
      }
    }
  };
  const hangup = () => {
    nav('/app/meetings');
  };

  const remotes = Object.entries(remoteStreams);

  return (
    <div className="flex h-full flex-col bg-black text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/50">Meeting</div>
          <div className="font-display text-lg">{meetingQ.data?.title ?? roomCode}</div>
        </div>
        <Badge variant="accent">{remotes.length + 1} in room</Badge>
      </header>

      <div
        className="grid flex-1 gap-3 p-6"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, Math.ceil(Math.sqrt(remotes.length + 1)))}, minmax(0, 1fr))`,
        }}
      >
        <div className="relative overflow-hidden rounded-lg bg-white/5">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
            data-testid="local-video"
          />
          <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs">
            You
          </div>
        </div>
        {remotes.map(([socketId, stream]) => (
          <RemoteTile key={socketId} stream={stream} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-white/10 py-4">
        <Button
          onClick={toggleMic}
          variant={micOn ? 'secondary' : 'destructive'}
          size="icon"
          data-testid="toggle-mic"
        >
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button
          onClick={toggleCam}
          variant={camOn ? 'secondary' : 'destructive'}
          size="icon"
          data-testid="toggle-cam"
        >
          {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
        <Button
          onClick={share}
          variant={sharing ? 'accent' : 'secondary'}
          size="icon"
          data-testid="toggle-share"
        >
          <MonitorUp className="h-4 w-4" />
        </Button>
        <Button onClick={hangup} variant="destructive" size="icon" data-testid="hangup">
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const RemoteTile = ({ stream }: { stream: MediaStream }) => {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="relative overflow-hidden rounded-lg bg-white/5">
      <video ref={ref} autoPlay playsInline className="h-full w-full object-cover" />
    </div>
  );
};
