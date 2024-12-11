import React from "react";
import { useClueContext } from "./ClueContext";
import { GameContext } from "./Game";
import ClueElement from "./ClueElement";
import { toast } from "react-toastify";

export default function ClueEditor() {
  const game = React.useContext(GameContext);
  const [clue, clueDispatch] = useClueContext();
  const [pending, startTransition] = React.useTransition();
  const submit = async () => {
    const response = await fetch(`${game.url}/clue`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clue),
    });
    if (!response.ok) {
      toast.error("Failed to submit clue.");
      console.error(response);
      return;
    }
  };
  if (!clue.length) {
    return <p>Click on letters above to add them to the clue.</p>;
  }
  return (
    <>
      <ClueElement />
      <button
        className={"button is-primary " + (pending ? "is-loading" : "")}
        onClick={() => {
          startTransition(submit);
        }}
      >
        Submit
      </button>
      <button
        className="button"
        disabled={!clue.length}
        onClick={() => {
          clueDispatch({ type: "clear" });
        }}
      >
        Reset
      </button>
    </>
  );
}
