import { useParams } from "react-router-dom";

export default function GamePage() {
  const { gameId } = useParams();
  return <p>{gameId}</p>;
}
