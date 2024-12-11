import React from "react";
import { useClueContext } from "./ClueContext";
import { GameContext, PlayerNameContext } from "./Game";
import NumberToken from "./NumberToken";
import Letter from "./Letter";

export default function ClueElement() {
  const game = React.useContext(GameContext);
  const [clue] = useClueContext();
  const currentPlayerName = React.useContext(PlayerNameContext);
  return (
    <div className="clue">
      {clue.map((token, i) => (
        <div key={i}>
          <Letter
            letter={
              token.kind == "player" && token.playerName == currentPlayerName
                ? "_"
                : game.tokenLetter(token)
            }
          />
          <NumberToken n={i + 1} />
        </div>
      ))}
    </div>
  );
}
