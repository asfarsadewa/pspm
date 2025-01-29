"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NumberAuthProps {
  onComplete: () => void;
}

export function NumberAuth({ onComplete }: NumberAuthProps) {
  const [displayNumbers, setDisplayNumbers] = useState<number[]>([]);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);

  const generateNewSequence = () => {
    // Generate 4 unique random numbers between 1-9
    const numbers = new Set<number>();
    while (numbers.size < 4) {
      numbers.add(Math.floor(Math.random() * 9) + 1);
    }
    const uniqueNumbers = Array.from(numbers);
    
    // Keep shuffling until display order is different from sequence
    let shuffledNumbers;
    do {
      shuffledNumbers = [...uniqueNumbers].sort(() => Math.random() - 0.5);
    } while (shuffledNumbers.every((num, i) => num === uniqueNumbers[i]));
    
    setDisplayNumbers(shuffledNumbers);
    setSequence(uniqueNumbers);
  };

  useEffect(() => {
    generateNewSequence();
  }, []);

  const handleNumberClick = (value: number) => {
    const targetIndex = userSequence.length;
    const newUserSequence = [...userSequence, value];
    setUserSequence(newUserSequence);

    if (newUserSequence.length === sequence.length) {
      if (newUserSequence.every((num, i) => num === sequence[i])) {
        onComplete();
      } else {
        setUserSequence([]);
        generateNewSequence();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="max-w-md w-full p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Welcome</h1>
          <p className="text-lg text-muted-foreground">
            Click the numbers in order: {sequence.join(" → ")}
          </p>
        </div>
        <div className="flex justify-center gap-4">
          {displayNumbers.map((num, i) => (
            <motion.div
              key={`${num}-${i}`}
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "rounded-full w-12 h-12 transform transition-all",
                  userSequence.includes(num) && "opacity-50"
                )}
                onClick={() => handleNumberClick(num)}
                disabled={userSequence.includes(num)}
              >
                {num}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 