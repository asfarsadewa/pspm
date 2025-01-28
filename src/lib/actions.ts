'use server'

import { Character, StoryNode, StoryContext } from "@/lib/types";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function generateStory(
  character: Character,
  previousContent?: string,
  selectedChoice?: string,
  storyContext?: StoryContext[]
) {
  console.log("Generating story with:", { character, previousContent, selectedChoice, storyContext });

  const systemPrompt = `You are a creative storyteller crafting an interactive adventure story. 
Create engaging narratives with multiple choice options (2-3) at key decision points.
Each response should include a story segment followed by clear choices for the reader.
Maintain consistency with the character's backstory and previous choices.
Keep responses concise but immersive.

Format your response EXACTLY like this, with a blank line before "Choices:":
[Story content here]

Choices:
1. [First choice]
2. [Second choice]
3. [Optional third choice]

Always include the "Choices:" header followed by numbered options.
Keep story segments between 100-200 words for better pacing.`;

  // Build the complete story context
  let contextPrompt = '';
  if (storyContext && storyContext.length > 0) {
    contextPrompt = storyContext.map(ctx => 
      `${ctx.content}\n${ctx.choice ? `Player chose: ${ctx.choice}` : ''}`
    ).join('\n\n');
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": `${process.env.NEXT_PUBLIC_APP_URL}`,
        "X-Title": "Pilih Sendiri Petualanganmu"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          { 
            role: "system", 
            content: systemPrompt 
          },
          {
            role: "user",
            content: `Character Name: ${character.name}
Character Backstory: ${character.backstory}
${contextPrompt ? `Story Context:\n${contextPrompt}\n` : ''}
${previousContent ? `Current Scene: ${previousContent}` : "Start a new story"}
${selectedChoice ? `Player chose: ${selectedChoice}` : ""}
Continue the story and provide 2-3 choices.`
          }
        ],
        max_tokens: 8192,
        stream: false,
        temperature: 1 // Add some creativity while maintaining coherence
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    // console.log("Raw API response:", data);

    const content = data.choices[0].message.content;
    // console.log("Story content:", content);

    return { content };

  } catch (error) {
    console.error("Error generating story:", error);
    throw error;
  }
} 