import React from "react";
import { GameContext, PlayerNameContext, ClueCandidate } from "./Game";
import { Field, Label, Control, Input, SubmitButton } from "./Form";
import { toast } from "react-toastify";

function ButtonChoices({
  name,
  values,
  defaultValue,
}: {
  name: string;
  values: string[];
  defaultValue: string;
}) {
  const [value, setValue] = React.useState(defaultValue);

  return (
    <div className="button-choices">
      <input type="hidden" name={name} value={value} />
      {values.map((v) => (
        <button
          key={v}
          className={`button ${v === value ? "is-primary" : ""}`}
          type="button"
          onClick={() => {
            setValue(v);
          }}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function NumberButtonChoices({
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
  const values = Array.from({ length: maxValue - minValue + 1 }, (_, i) =>
    (i + minValue).toString()
  );

  return (
    <ButtonChoices
      name={name}
      values={values}
      defaultValue={defaultValue.toString()}
    />
  );
}

export default function ClueCandidateEditor() {
  const game = React.useContext(GameContext);
  const playerName = React.useContext(PlayerNameContext);
  const candidate: ClueCandidate | undefined =
    game.player(playerName).clueCandidate;

  if (game.phase.name != "vote") {
    return false;
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const newCandidate: ClueCandidate = {
      length: parseInt(data.get("length") as string),
      playerCount: parseInt(data.get("players") as string),
      npcCount: parseInt(data.get("npcs") as string),
      wild: data.get("wild") === "Yes",
    };
    const response = await fetch(
      `${game.playerUrl(playerName)}/clue_candidate`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCandidate),
      }
    );
    if (!response.ok) {
      toast.error("Failed to propose clue candidate.");
      console.error(response);
      return;
    }
  };

  const deleteCandidate = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    const response = await fetch(
      `${game.playerUrl(playerName)}/clue_candidate`,
      { method: "DELETE" }
    );
    if (!response.ok) {
      toast.error("Failed to delete clue candidate.");
      console.error(response);
      return;
    }
  };

  return (
    <form className="form clue-candidate-editor" onSubmit={onSubmit}>
      <Field>
        <Label>Length</Label>
        <Control>
          <Input
            type="number"
            name="length"
            min={1}
            max={99}
            defaultValue={candidate?.length ?? 1}
          />
        </Control>
      </Field>

      <Field>
        <Label>Players</Label>
        <Control>
          <NumberButtonChoices
            name="players"
            minValue={0}
            maxValue={game.players.length - 1}
            defaultValue={candidate?.playerCount ?? 0}
          />
        </Control>
      </Field>

      <Field>
        <Label>NPCs</Label>
        <Control>
          <NumberButtonChoices
            name="npcs"
            minValue={0}
            maxValue={game.npcs.length}
            defaultValue={candidate?.npcCount ?? 0}
          />
        </Control>
      </Field>

      <Field>
        <Label>Wild</Label>
        <Control>
          <ButtonChoices
            name="wild"
            values={["Yes", "No"]}
            defaultValue={candidate?.wild ? "Yes" : "No"}
          />
        </Control>
      </Field>

      <SubmitButton>Propose</SubmitButton>
      {candidate && (
        <button className="button" onClick={deleteCandidate}>
          Retract
        </button>
      )}
    </form>
  );
}
