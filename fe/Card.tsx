import { motion } from "framer-motion";

// Colorblind-friendly pallete from https://jfly.uni-koeln.de/color/
export const PLAYER_COLORS = [
  // orange
  [230, 159, 0],
  // sky blue
  [86, 180, 233],
  // blueish green
  [0, 158, 115],
  // yellow
  [240, 228, 66],
  // blue
  [0, 114, 178],
  // vermillion
  [213, 94, 0],
  // reddish purple
  [204, 121, 167],
].map((color) => `rgb(${color.join(",")})`);

function Label({ labelText, color }: { labelText?: string; color?: string }) {
  return (
    <div
      className="label"
      style={{ backgroundColor: color || "rgb(0 0 0 / 0)" }}
    >
      {labelText}
    </div>
  );
}

export default function Card({
  text,
  label,
  color,
}: {
  text: string;
  label?: string;
  color?: string;
}) {
  return (
    <motion.div className="letter-card" whileHover={{ scale: 1.5 }}>
      <div className="text">{text}</div>
      <Label labelText={label} color={color} />
    </motion.div>
  );
}
