import { Token } from "./Game";
import { createReducerContext } from "react-use";

interface AddAction {
  type: "add";
  token: Token;
}

interface ClearAction {
  type: "clear";
}

type Action = AddAction | ClearAction;

const reducer = (tokens: Token[], action: Action) => {
  switch (action.type) {
    case "add":
      return [...tokens, action.token];
    case "clear":
      return [];
    default:
      return tokens;
  }
};

export const [useClueContext, ClueContextProvider] = createReducerContext(
  reducer,
  []
);
