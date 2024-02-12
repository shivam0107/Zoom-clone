import React, { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player";
import PeerService from "../service/Peer";

const Room = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState();
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const handelCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    const offer = await PeerService.getOffer();
    console.log("offer", offer);
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleUserJoind = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined the room`);
    setRemoteSocketId(id);
  }, []);

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      console.log(`incoming call`, from, offer);
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);

      const ans = await PeerService.getAnswer(offer);
      console.log("ans is: ", ans);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

const sendStreams = useCallback(() => {
  for (const track of myStream.getTracks()) {
    PeerService.peer.addTrack(track, myStream);
  }
}, [myStream]);

const handleCallAccepted = useCallback(
  ({ from, ans }) => {
    PeerService.setLocalDescription(ans);
    console.log("Call Accepted!");
    sendStreams();
  },
  [sendStreams]
);


  const handleNegoNeeded = useCallback(async () => {
    const offer = await PeerService.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, []);

  const handleNegoNeededIncoming = useCallback(
    async ({ from, offer }) => {
      const ans = await PeerService.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeededFinal = useCallback(async ({ from, ans }) => {
    await PeerService.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    PeerService.peer.addEventListener("negotiationneeded", handleNegoNeeded);

    return () => {
      PeerService.peer.removeEventListener(
        "negotiationneeded",
        handleNegoNeeded
      );
    };
  }, []);

  useEffect(() => {
    PeerService.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoind);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeededIncoming);
    socket.on("peer:nego:final", handleNegoNeededFinal);
    return () => {
      socket.off("user:joined", handleUserJoind);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeededIncoming);
      socket.off("peer:nego:final", handleNegoNeededFinal);
    };
  }, [
    socket,
    handleUserJoind,
    handleCallAccepted,
    handleIncomingCall,
    handleNegoNeededFinal,
    handleNegoNeededIncoming,
  ]);

  return (
    <div className="w-11/12 mx-auto flex flex-col  justify-center items-center">
      <h1 className="text-3xl font-bold">This Is My Room Page</h1>
      <h4>{remoteSocketId ? "Connected" : "No one In the room"}</h4>
      {myStream && <button onClick={sendStreams}>Send Stream</button>}
      {remoteSocketId && (
        <button onClick={handelCallUser} className="border-2 p-2 rounded-md">
          CALL
        </button>
      )}

      {myStream && (
        <>
          <h1>My Stream</h1>
          <ReactPlayer
            playing
            muted
            url={myStream}
            height="200px"
            width="200px"
            className="rounded-full"
          />
        </>
      )}

      {remoteStream && (
        <>
          <h1>Remote Stream</h1>
          <ReactPlayer
            playing
            muted
            url={remoteStream}
            height="200px"
            width="200px"
            className="rounded-full"
          />
        </>
      )}
    </div>
  );
};

export default Room;
