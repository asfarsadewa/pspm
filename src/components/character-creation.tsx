"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Character, Story } from "@/lib/types";

interface CharacterCreationProps {
  onCreateCharacter: (character: Character | null) => void;
  existingCharacter: Character | null;
}

export function CharacterCreation({ onCreateCharacter, existingCharacter }: CharacterCreationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [backstory, setBackstory] = useState("");

  // Update form when existingCharacter changes
  useEffect(() => {
    if (existingCharacter) {
      setName(existingCharacter.name);
      setBackstory(existingCharacter.backstory);
    }
  }, [existingCharacter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !backstory.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    onCreateCharacter({ name: name.trim(), backstory: backstory.trim() });
    setIsEditing(false);
  };

  const handleDeleteCharacter = () => {
    // Archive stories for this character before deleting
    const savedStories = JSON.parse(localStorage.getItem("stories") || "[]");
    const updatedStories = savedStories.map((story: Story) => {
      if (story.character.name === existingCharacter?.name) {
        return { ...story, archived: true };
      }
      return story;
    });
    localStorage.setItem("stories", JSON.stringify(updatedStories));

    // Then delete the character
    localStorage.removeItem("character");
    onCreateCharacter(null);
  };

  if (existingCharacter && !isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Character</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Name</h3>
              <p>{existingCharacter.name}</p>
            </div>
            <div>
              <h3 className="font-semibold">Backstory</h3>
              <p>{existingCharacter.backstory}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)}>Edit Character</Button>
              <Button variant="destructive" onClick={handleDeleteCharacter}>Delete Character</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingCharacter ? 'Edit Character' : 'Create Character'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-semibold">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter character name"
            />
          </div>
          <div>
            <label className="font-semibold">Backstory</label>
            <Textarea
              value={backstory}
              onChange={(e) => setBackstory(e.target.value)}
              placeholder="Write your character's backstory. A short one will do just to set the tone."
              className="min-h-[100px]"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">
              {existingCharacter ? 'Save Changes' : 'Create Character'}
            </Button>
            {isEditing && (
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 