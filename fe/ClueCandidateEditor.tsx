import React from "react";
import { GameContext } from "./Game";
import { Field, Label, Control, Input } from "./Form";

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

  if (game.phase.name != "vote") {
    return false;
  }

  return (
    <section className="section">
      <nav className="panel clue-candidate-editor">
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
              <Label>Wild</Label>
              <Control>
                <ButtonChoices
                  name="wild"
                  defaultValue="No"
                  values={["Yes", "No"]}
                />
              </Control>
            </Field>
          </form>
        </div>
      </nav>
    </section>
  );
}
