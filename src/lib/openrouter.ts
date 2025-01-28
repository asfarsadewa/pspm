import type { Character, StoryNode } from "@/lib/types";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function generateStoryContent(
  character: Character,
  previousContent?: string,
  selectedChoice?: string
) {
  const systemPrompt = `You are a creative storyteller crafting an interactive adventure story. 
Create engaging narratives with multiple choice options (2-3) at key decision points.
Each response should include a story segment followed by clear choices for the reader.
Maintain consistency with the character's backstory and previous choices.
Keep responses concise but immersive.`;

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Character Name: ${character.name}
Character Backstory: ${character.backstory}
${previousContent ? `Previous Story: ${previousContent}` : "Start a new story"}
${selectedChoice ? `Player chose: ${selectedChoice}` : ""}
Continue the story and provide 2-3 choices.`
    }
  ];

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": `${process.env.NEXT_PUBLIC_APP_URL}`,
        "X-Title": "Pilih Sendiri Petualanganmu"
      },
      body: JSON.stringify({
        model: "deepseek-ai/deepseek-coder-33b-instruct",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return parseStoryResponse(data.choices[0].message.content);
  } catch (error) {
    console.error("Error generating story:", error);
    throw error;
  }
}

function parseStoryResponse(content: string): StoryNode {
  // Split content into story and choices
  const parts = content.split(/\n(?:Options|Choices):\n/i);
  const storyContent = parts[0].trim();
  const choicesText = parts[1] || "";

  // Parse choices
  const choiceMatches = choicesText.match(/\d+\.\s+(.+)/g) || [];
  const choices = choiceMatches.map((choice, index) => ({
    id: `choice-${index + 1}`,
    text: choice.replace(/^\d+\.\s+/, "").trim()
  }));

  return {
    id: `node-${Date.now()}`,
    content: storyContent,
    choices
  };
} 