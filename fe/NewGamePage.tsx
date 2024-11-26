import React from "react";
import { Label, Field, Control, SubmitButton } from "./Form";

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
}

export default function NewGamePage() {
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(event);
  };
  return (
    <>
      <form className="form" onSubmit={onSubmit}>
        <Field>
          <Label>Number of players</Label>
          <NumberButtonChoices
            name="playerCount"
            minValue={2}
            maxValue={6}
            defaultValue={2}
          />
        </Field>
        <Field>
          <Label>Player word length</Label>
          <NumberButtonChoices
            name="playerWordLength"
            minValue={2}
            maxValue={7}
            defaultValue={5}
          />
        </Field>
        <SubmitButton>Create</SubmitButton>
      </form>
    </>
  );
}
