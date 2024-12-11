import React from "react";
import { useLocalStorage } from "react-use";
import { GameContext } from "./Game";
import { toast } from "react-toastify";
import { Field, Label, Control, SubmitButton } from "./Form";

export default function LoggedOutPage({
  setPlayerName,
}: {
  setPlayerName: (name: string) => void;
}) {
  const game = React.useContext(GameContext);
  const [savedName, setSavedName] = useLocalStorage<string>("playerName");
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = data.get("name") as string;
    (async () => {
      const response = await fetch(game.playerUrl(name), {
        method: "POST",
        body: "{}",
      });
      if (response.ok) {
        toast("Joining as new player.");
      } else if (response.status === 409) {
        toast("Joining as existing player.");
      } else {
        toast("Failed to join game.");
        console.error(response);
        return;
      }
      setSavedName(name);
      setPlayerName(name);
    })().catch((error: unknown) => {
      console.error(error);
    });
  };
  return (
    <form className="form" onSubmit={onSubmit}>
      <Field>
        <Label>Player name</Label>
        <Control>
          <input
            className="input"
            type="text"
            name="name"
            defaultValue={savedName || ""}
            autoFocus
          />
        </Control>
      </Field>
      <SubmitButton>Join Game</SubmitButton>
    </form>
  );
}
