import "./App.scss";
import Nav from "./Nav";
import { Routes, Route } from "react-router-dom";
import NewGamePage from "./NewGamePage";

export default function App() {
  return (
    <div className="container">
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<p>hi</p>} />
          <Route path="/new" element={<NewGamePage />} />
        </Routes>
      </main>
    </div>
  );
}
