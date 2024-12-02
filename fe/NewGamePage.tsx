import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

/* function NumberButtonChoices({
  name,
  minValue,
  maxValue,
  defaultValue,
}: {
  name: string;
  minValue: number;
  maxValue: number;
  defaultValue: number;
}) {
  const [value, setValue] = React.useState(defaultValue);
  const choices = Array.from(
    { length: maxValue - minValue + 1 },
    (_, i) => i + minValue
  );
  return (
    <Control>
      <input type="hidden" name={name} value={value} />
      {choices.map((c) => (
        <button
          key={c}
          className={`button ${c === value ? "is-primary" : ""}`}
          type="button"
          onClick={() => {
            setValue(c);
          }}
        >
          {c}
        </button>
      ))}
    </Control>
  );
} */

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
          playerWordLength: 3,
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
