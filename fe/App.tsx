import "./App.scss";
import Nav from "./Nav";
import { Routes, Route } from "react-router-dom";
import GamePage from "./GamePage";
import GameListPage from "./GameListPage";

export default function App() {
  return (
    <div className="container">
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<GameListPage />} />
          <Route path="/:gameId" element={<GamePage />} />
        </Routes>
      </main>
    </div>
  );
}
