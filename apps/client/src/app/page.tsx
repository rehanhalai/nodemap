"use client";

import { io } from "socket.io-client";
import { useState } from "react";

export default function HomePage() {
  const emtiHelloMSG = () => {
    const socket = io("http://localhost:8080");
    socket.emit("greeting", "fuck you");
  };

  return (
    <main>
      <h1>Client App</h1>
      <button onClick={() => emtiHelloMSG()}>Emit Greeting Message</button>
    </main>
  );
}
