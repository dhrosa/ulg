export default function Letter({ letter }: { letter: string }) {
  return (
    <div className="letter">
      <div>{letter}</div>
    </div>
  );
}
