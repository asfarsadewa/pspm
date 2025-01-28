import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { StoryNode } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseStoryResponse(content: string): StoryNode {
  console.log("Parsing story response, raw content:", content)

  // Split content into story and choices
  const parts = content.split(/\n(?:Options|Choices):\s*\n/i)
  console.log("Split parts:", parts)

  const storyContent = parts[0].trim()
  const choicesText = parts[1] || ""

  console.log("Story content:", storyContent)
  console.log("Choices text:", choicesText)

  // Parse choices - look for numbered lines with content
  const choiceMatches = choicesText.match(/^\s*\d+\.\s*(.+)$/gm) || []
  console.log("Choice matches:", choiceMatches)

  const choices = choiceMatches.map((choice, index) => {
    const text = choice.replace(/^\s*\d+\.\s*/, "").trim()
    console.log(`Parsed choice ${index + 1}:`, text)
    return {
      id: `choice-${index + 1}`,
      text
    }
  })

  console.log("Final parsed choices:", choices)

  // Only use default choices if no choices were parsed
  const finalChoices = choices.length > 0 ? choices : [
    { id: 'default-1', text: 'Continue the adventure' },
    { id: 'default-2', text: 'Take a different path' }
  ]

  const node: StoryNode = {
    id: `node-${Date.now()}`,
    content: storyContent,
    choices: finalChoices
  }

  console.log("Final node:", node)
  return node
}
