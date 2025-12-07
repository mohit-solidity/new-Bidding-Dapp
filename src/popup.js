import React, { useEffect } from "react";
import "./Popup.css";

export default function Popup({ show, type, message, onClose }) {

  useEffect(() => {
    if (show && type !== "loading") {
      const timer = setTimeout(() => onClose(), 2000);
      return () => clearTimeout(timer);
    }
  }, [show, type, onClose]);

  if (!show) return null;

  return (
    <div className={`auto-popup ${type}`}>
      {type === "loading" ? (
        <span>⏳ {message}</span>
      ) : (
        <span>{message}</span>
      )}
    </div>
  );
}
