import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { StoryNode } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseStoryResponse(content: string): StoryNode {
  const parts = content.split(/\n(?:Options|Choices):\s*\n/i);
  const storyContent = parts[0].trim();
  const choicesText = parts[1] || "";

  const choiceMatches = choicesText.match(/^\s*\d+\.\s*(.+)$/gm) || [];
  
  const choices = choiceMatches.map((choice, index) => ({
    id: `choice-${index + 1}`,
    text: choice.replace(/^\s*\d+\.\s*/, "").trim()
  }));

  const finalChoices = choices.length > 0 ? choices : [
    { id: 'default-1', text: 'Continue the adventure' },
    { id: 'default-2', text: 'Take a different path' }
  ];

  return {
    id: `node-${Date.now()}`,
    content: storyContent,
    choices: finalChoices
  };
}
