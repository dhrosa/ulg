import React from "react";
import "./App.scss";
import Card, { PLAYER_COLORS } from "./Card";
import Nav from "./Nav";

export default function App() {
  return (
    <div className="container">
      <Nav />
      <main>
        <div className="letter-card-row">
          {[..."splat".toUpperCase()].map((letter, index) => (
            <Card
              key={index}
              text={letter}
              color={PLAYER_COLORS[index]}
              label={letter}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
