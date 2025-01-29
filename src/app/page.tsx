"use client";

import { CharacterCreation } from "@/components/character-creation";
import { StorySelection } from "@/components/story-selection";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Character } from "@/lib/types";

export default function Home() {
  const [character, setCharacter] = useState<Character | null>(null);

  useEffect(() => {
    const savedCharacter = localStorage.getItem("character");
    if (savedCharacter) {
      setCharacter(JSON.parse(savedCharacter));
    }
  }, []);

  const handleCreateCharacter = (newCharacter: Character | null) => {
    if (newCharacter) {
      localStorage.setItem("character", JSON.stringify(newCharacter));
    }
    setCharacter(newCharacter);
  };

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="relative mb-8 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center">
          Pilih Sendiri Petualanganmu
        </h1>
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <ThemeToggle />
        </div>
      </div>
      <div className="max-w-2xl mx-auto space-y-6">
        <CharacterCreation 
          onCreateCharacter={handleCreateCharacter} 
          existingCharacter={character}
        />
        <StorySelection />
      </div>
    </div>
  );
}
