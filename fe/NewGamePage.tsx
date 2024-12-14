import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function NewGamePage() {
  const navigate = useNavigate();
  const done = React.useRef(false);

  React.useEffect(() => {
    (async () => {
      if (done.current) {
        return;
      }
      done.current = true;
      const response = await fetch("/api/game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerWordLength: 5,
        }),
      });
      if (!response.ok) {
        toast("Failed to create new game.", { type: "error" });
        console.error(response);
        return;
      }
      const data = await response.json();
      const gameId: string = data.id;
      toast(`Created new game: ${gameId}`);
      navigate(`/${gameId}`);
    })().catch((error: unknown) => {
      console.error(error);
    });
  }, []);

  return <p>Creating new game...</p>;
}
