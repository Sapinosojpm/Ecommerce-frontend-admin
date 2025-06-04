import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";
import animationData from "../assets/Animation - 1749008248519.json";

const BotHelloLottie = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if animation was already shown this session
    const shown = localStorage.getItem("botHelloShown");

    if (!shown) {
      setVisible(true);
      // Set timeout to hide animation after 5 seconds
      const timeout = setTimeout(() => {
        setVisible(false);
        // Mark as shown in localStorage
      localStorage.setItem("botHelloShown", "true");
      }, 5000);

      // Cleanup timeout on unmount
      return () => clearTimeout(timeout);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed z-50 pointer-events-none bottom-3 right-2 w-60 h-60">
      <Lottie animationData={animationData} loop={false} />
    </div>
  );
};

export default BotHelloLottie;
