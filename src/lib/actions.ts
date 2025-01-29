'use server'

import { Character, StoryContext } from "@/lib/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

export async function generateStory(
  character: Character,
  previousContent?: string,
  selectedChoice?: string,
  storyContext?: StoryContext[]
) {
  console.log("Generating story with:", { character, previousContent, selectedChoice, storyContext });

  const contextPrompt = storyContext?.map(ctx => 
    `${ctx.content}\n${ctx.choice ? `Player chose: ${ctx.choice}` : ''}`
  ).join('\n\n') || '';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a creative storyteller crafting an interactive adventure story in any language. 
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
Keep story segments between 100-200 words for better pacing.

Character Name: ${character.name}
Character Backstory: ${character.backstory}
${contextPrompt ? `Story Context:\n${contextPrompt}\n` : ''}
${previousContent ? `Current Scene: ${previousContent}` : "Start a new story"}
${selectedChoice ? `Player chose: ${selectedChoice}` : ""}
Continue the story and provide 2-3 choices.`
          }]
        }],
        generationConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${await response.text()}`);
    }

    const result = await response.json();
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Invalid API response format");
    }

    const text = result.candidates[0].content.parts[0].text;
    
    // Create a ReadableStream from the text
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(text));
        controller.close();
      }
    });

    return { stream, ok: true };

  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Error generating story:", error);
    throw error;
  }
} 