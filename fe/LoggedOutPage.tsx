import React from "react";
import { useLocalStorage } from "react-use";
import { GameContext } from "./Game";
import { Field, Label, Control, SubmitButton } from "./Form";

function LobbyForm({
  setPlayerName,
}: {
  setPlayerName: (name: string) => void;
}) {
  const game = React.useContext(GameContext);
  const [savedName, setSavedName] = useLocalStorage<string>("playerName");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const [error, action, pending] = React.useActionState(
    async (_previousError: string | null, formData: FormData) => {
      const name = formData.get("name") as string;
      const response = await fetch(game.playerUrl(name), {
        method: "POST",
        body: "{}",
      });
      if (response.ok || response.status === 409) {
        setSavedName(name);
        setPlayerName(name);
        return null;
      }
      console.error(response);
      return "Failed to join game.";
    },
    null
  );
  return (
    <form className="form" action={action}>
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
        {error && <p className="help is-danger">{error}</p>}
      </Field>
      <SubmitButton disabled={pending}>Join Game</SubmitButton>
    </form>
  );
}

function InProgressForm({
  setPlayerName,
}: {
  setPlayerName: (name: string) => void;
}) {
  const game = React.useContext(GameContext);

  return (
    <div>
      <p>Join game as:</p>
      {game.players.map((p) => (
        <button
          key={p.name}
          className="button"
          disabled={p.connected}
          autoFocus
          onClick={() => {
            setPlayerName(p.name);
          }}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}

export default function LoggedOutPage({
  setPlayerName,
}: {
  setPlayerName: (name: string) => void;
}) {
  const game = React.useContext(GameContext);
  if (game.phase.name == "lobby") {
    return <LobbyForm setPlayerName={setPlayerName} />;
  }
  return <InProgressForm setPlayerName={setPlayerName} />;
}
