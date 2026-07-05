"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "@phosphor-icons/react";

interface Props {
  src: string;
  onClose: () => void;
}

export default function Lightbox({ src, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button onClick={onClose} className="absolute right-5 top-5 cursor-pointer text-white/60 transition-colors hover:text-white">
        <X size={28} weight="bold" />
      </button>
      <motion.img
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        src={src} alt=""
        className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
      />
    </motion.div>
  );
}
