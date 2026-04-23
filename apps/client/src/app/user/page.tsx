"use client";

import { io } from "socket.io-client";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    const socket = io("http://localhost:8080");
    socket.on("greeting", (message) => {
      setGreeting(message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <main>
      <h1>Client App</h1>
      <p>{greeting}</p>
    </main>
  );
}
