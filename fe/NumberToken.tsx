import Tag from "./Tag";

export default function NumberToken({ n }: { n: number }) {
  const hslColors = [
    "0 100% 84%",
    "33 100% 84%",
    "62 100% 86%",
    "110 100% 87%",
    "185 100% 80%",
    "217 100% 81%",
    "249 100% 85%",
    "300 100% 89%",
  ];
  const color = `hsl(${hslColors[(n - 1) % hslColors.length]})`;
  return (
    <Tag className="token is-rounded" style={{ backgroundColor: color }}>
      {n}
    </Tag>
  );
}
