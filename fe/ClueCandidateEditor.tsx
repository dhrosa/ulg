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

  if (game.phase.name != "vote") {
    return false;
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const candidate: ClueCandidate = {
      length: parseInt(data.get("length") as string),
      playerCount: parseInt(data.get("players") as string),
      npcCount: parseInt(data.get("npcs") as string),
      wild: data.get("wild") === "true",
    };
    const response = await fetch(
      `${game.playerUrl(playerName)}/clue_candidate`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidate),
      }
    );
    if (!response.ok) {
      toast.error("Failed to propose clue candidate.");
      console.error(response);
      return;
    }
  };

  return (
    <section className="section">
      <nav className="panel clue-candidate-editor">
        <p className="panel-heading">Clue Candidate</p>
        <div className="panel-block">
          <form className="form" onSubmit={onSubmit}>
            <Field>
              <Label>Length</Label>
              <Control>
                <Input type="number" name="length" min={1} max={99} />
              </Control>
            </Field>

            <Field>
              <Label>Players</Label>
              <Control>
                <NumberButtonChoices
                  name="players"
                  defaultValue={0}
                  minValue={0}
                  maxValue={game.players.length - 1}
                />
              </Control>
            </Field>

            <Field>
              <Label>NPCs</Label>
              <Control>
                <NumberButtonChoices
                  name="npcs"
                  defaultValue={0}
                  minValue={0}
                  maxValue={game.npcs.length}
                />
              </Control>
            </Field>

            <Field>
              <Label>Wild</Label>
              <Control>
                <ButtonChoices
                  name="wild"
                  defaultValue="No"
                  values={["Yes", "No"]}
                />
              </Control>
            </Field>

            <SubmitButton>Propose</SubmitButton>
          </form>
        </div>
      </nav>
    </section>
  );
}
