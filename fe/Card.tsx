import { motion } from "framer-motion";

export default function Card({ text }: { text: string }) {
  return (
    <motion.div className="letter-card" whileHover={{ scale: 1.5 }}>
      <div className="text">{text}</div>
    </motion.div>
  );
}
