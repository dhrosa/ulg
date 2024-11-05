import React from "react";
import "./App.scss";
import Card from "./Card";
import Nav from "./Nav";

export default function App() {
  return (
    <div className="container">
      <Nav />
      <div className="letter-card-row">
        {[..."splat".toUpperCase()].map((letter, index) => (
          <Card key={index} text={letter} />
        ))}
      </div>
    </div>
  );
}
