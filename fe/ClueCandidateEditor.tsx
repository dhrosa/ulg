import React from "react";
import { GameContext } from "./Game";
import { Field, Label, Control, Input } from "./Form";

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
  const [value, setValue] = React.useState(defaultValue);
  const choices = Array.from(
    { length: maxValue - minValue + 1 },
    (_, i) => i + minValue
  );
  return (
    <div className="number-buttons">
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
    </div>
  );
}

export default function ClueCandidateEditor() {
  const game = React.useContext(GameContext);

  if (game.phase.name != "vote") {
    return false;
  }

  return (
    <section className="section">
      <nav className="panel">
        <p className="panel-heading">Clue Candidate</p>
        <div className="panel-block">
          <form className="form">
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
              <Control>
                <label className="checkbox">
                  <input type="checkbox" />
                  Wild
                </label>
              </Control>
            </Field>
          </form>
        </div>
      </nav>
    </section>
  );
}
