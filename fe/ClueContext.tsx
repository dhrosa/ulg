import { Token } from "./Game";
import { createReducerContext } from "react-use";

type Action =
  | { type: "add"; token: Token }
  | { type: "clear" }
  | { type: "set"; tokens: Token[] };

const reducer = (tokens: Token[], action: Action) => {
  switch (action.type) {
    case "add":
      return [...tokens, action.token];
    case "clear":
      return [];
    case "set":
      return action.tokens;
    default:
      return tokens;
  }
};

export const [useClueContext, ClueContextProvider] = createReducerContext(
  reducer,
  []
);
