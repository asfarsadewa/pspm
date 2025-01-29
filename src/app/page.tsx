"use client";

import { CharacterCreation } from "@/components/character-creation";
import { StorySelection } from "@/components/story-selection";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);

  useEffect(() => {
    const savedCharacter = localStorage.getItem("character");
    if (savedCharacter) {
      setCharacter(JSON.parse(savedCharacter));
    }
  }, []);

  const handleCreateCharacter = (newCharacter: Character) => {
    localStorage.setItem("character", JSON.stringify(newCharacter));
    setCharacter(newCharacter);
  };

  const handleStartNewAdventure = () => {
    if (!character) return;
    console.log("Starting new adventure with character:", character);
    router.push("/story/new");
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
