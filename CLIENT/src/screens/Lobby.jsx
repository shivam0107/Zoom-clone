import React, { useCallback, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
const Lobby = () => {
  const [email, setEmail] = useState();
  const [room, setRoom] = useState();

  const navigate = useNavigate();
  const socket = useSocket();
  // console.log("socket", socket);

  const handelSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="w-11/12 mx-auto flex flex-col  justify-center items-center">
      <h1>Lobby</h1>
      <form onSubmit={handelSubmitForm}>
        <label htmlFor="email">Email Id</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block border-2 "
        />
        <br />
        <label htmlFor="room">Room Number</label>
        <input
          type="text"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="block  border-2"
        />
        <button type="submit" className="p-2 border-2">
          Join
        </button>
      </form>
    </div>
  );
};

export default Lobby;
