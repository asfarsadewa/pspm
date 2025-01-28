"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { generateStory } from "@/lib/actions";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import type { Story, StoryNode, Character, StoryChoice } from "@/lib/types";
import { parseStoryResponse } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

export default function StoryPage() {
  const params = useParams();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamedContent, setStreamedContent] = useState("");
  const [choices, setChoices] = useState<StoryChoice[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const generatingRef = useRef(false);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const initialized = useRef(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const storyGenerationRef = useRef<boolean>(false);
  const [characterExists, setCharacterExists] = useState(true);

  useEffect(() => {
    const initializeStory = async () => {
      if (storyGenerationRef.current) {
        console.log("Story generation already in progress, skipping...");
        return;
      }

      if (params.id === "new") {
        const character = localStorage.getItem("character");
        if (!character) {
          console.error("No character found in localStorage");
          router.push("/");
          return;
        }

        try {
          const parsedCharacter = JSON.parse(character);
          
          storyGenerationRef.current = true;
          setLoading(true);
          
          console.log("Generating new story...");
          const { content } = await generateStory(parsedCharacter);
          
          if (!content) throw new Error("No content received");
          
          const node = parseStoryResponse(content);
          const storyId = `story-${Date.now()}`;
          const newStory: Story = {
            id: storyId,
            title: `${parsedCharacter.name}'s Adventure`,
            currentNode: node,
            history: [],
            character: parsedCharacter,
            lastUpdated: new Date().toISOString()
          };

          // Save to localStorage
          const savedStories = JSON.parse(localStorage.getItem("stories") || "[]");
          savedStories.unshift(newStory);
          localStorage.setItem("stories", JSON.stringify(savedStories));

          setStory(newStory);
          setCharacterExists(true);
        } catch (error) {
          console.error("Error initializing story:", error);
          toast.error("Failed to start the story. Please try again.");
          router.push("/");
        } finally {
          setLoading(false);
          storyGenerationRef.current = false;
        }
      } else {
        loadExistingStory(params.id as string);
      }
    };

    initializeStory();
  }, [params.id]);

  const loadExistingStory = (storyId: string) => {
    const savedStories = JSON.parse(localStorage.getItem("stories") || "[]");
    const existingStory = savedStories.find((s: Story) => s.id === storyId);
    
    if (existingStory) {
      setStory(existingStory);
      // Check if the character still exists
      const character = localStorage.getItem("character");
      if (character) {
        const parsedCharacter = JSON.parse(character);
        setCharacterExists(parsedCharacter.name === existingStory.character.name);
      } else {
        setCharacterExists(false);
      }
    } else {
      router.push("/");
    }
    setLoading(false);
  };

  const handleChoice = async (choiceText: string) => {
    if (!story) return;

    try {
      setLoading(true);
      setStreamedContent("");
      
      console.log("Processing choice for story ID:", story.id);
      
      const storyContext = story.history.map(node => ({
        content: node.content,
        choice: node.selectedChoice
      }));
      
      const { content } = await generateStory(
        story.character,
        story.currentNode.content,
        choiceText,
        storyContext
      );

      const node = parseStoryResponse(content);
      node.selectedChoice = choiceText;

      // Update the existing story, maintaining the same ID
      const updatedStory = {
        ...story,
        history: [...story.history, { ...story.currentNode, selectedChoice: choiceText }],
        currentNode: node,
        lastUpdated: new Date().toISOString()
      };

      // Update in localStorage by ID
      const savedStories = JSON.parse(localStorage.getItem("stories") || "[]");
      const storyIndex = savedStories.findIndex((s: Story) => s.id === story.id);
      
      if (storyIndex !== -1) {
        // Update existing story
        savedStories[storyIndex] = updatedStory;
      } else {
        // Should never happen, but handle just in case
        console.error("Story not found in localStorage:", story.id);
        savedStories.unshift(updatedStory);
      }

      // Save back to localStorage
      localStorage.setItem("stories", JSON.stringify(savedStories));
      
      // Update local state
      setStory(updatedStory);
      setStreamedContent(content);

    } catch (error) {
      console.error("Error processing choice:", error);
      toast.error("Failed to continue the story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const nextHistoryCard = () => {
    if (story && currentHistoryIndex < story.history.length - 1) {
      setCurrentHistoryIndex(prev => prev + 1);
    }
  };

  const prevHistoryCard = () => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="mb-4">Story not found</p>
        <Button onClick={() => router.push("/")}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{story.title}</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          Exit Story
        </Button>
      </div>
      
      {!characterExists && (
        <div className="mb-4 p-4 bg-muted rounded-lg text-center">
          <p className="text-muted-foreground">
            This story's character has been deleted. Create a character with the name "{story.character.name}" to continue this adventure.
          </p>
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="prose dark:prose-invert mt-6 max-w-none">
          <ReactMarkdown>
            {loading && streamedContent ? streamedContent : story?.currentNode.content || ''}
          </ReactMarkdown>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {!loading && story?.currentNode.choices.map((choice) => (
          <Button
            key={choice.id}
            onClick={() => handleChoice(choice.text)}
            className="w-full text-left h-auto whitespace-normal"
            variant="outline"
            disabled={loading || !characterExists}
          >
            {choice.text}
          </Button>
        ))}
      </div>

      {story.history.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Story History</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentHistoryIndex(0)}
              disabled={currentHistoryIndex === 0}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative min-h-[300px] mt-4">
            <div className="relative w-full">
              {story.history.map((node, index) => (
                <Card 
                  key={node.id} 
                  className={`absolute w-full transition-all duration-300 cursor-pointer 
                    ${index === currentHistoryIndex
                      ? "z-20 rotate-0 translate-x-0 translate-y-0 opacity-100 shadow-lg hover:shadow-xl hover:-translate-y-1 bg-card"
                      : index === currentHistoryIndex - 1
                      ? "z-10 -rotate-6 -translate-x-4 translate-y-2 opacity-80 shadow-md bg-muted"
                      : index === currentHistoryIndex + 1
                      ? "z-10 rotate-6 translate-x-4 translate-y-2 opacity-80 shadow-md bg-muted"
                      : "opacity-0"
                    }
                    ${index === currentHistoryIndex ? "hover:ring-2 ring-primary/20" : ""}
                  `}
                  onClick={() => {
                    if (index === currentHistoryIndex) {
                      nextHistoryCard();
                    }
                  }}
                >
                  <div 
                    className="absolute inset-0 z-10"
                    onClick={(e) => {
                      // Prevent double click events
                      e.stopPropagation();
                      if (index === currentHistoryIndex) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        // Click on left half goes back, right half goes forward
                        if (x < rect.width / 2) {
                          prevHistoryCard();
                        } else {
                          nextHistoryCard();
                        }
                      }
                    }}
                  />
                  <div className="absolute -top-3 -left-3 z-30">
                    <Badge 
                      variant="secondary" 
                      className="h-6 w-6 rounded-full flex items-center justify-center p-0"
                    >
                      {index + 1}
                    </Badge>
                  </div>
                  <CardContent className="pt-6">
                    <div className="prose dark:prose-invert max-w-none">
                      <ReactMarkdown>{node.content}</ReactMarkdown>
                      {node.selectedChoice && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Chose: {node.selectedChoice}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
              <Button
                variant="ghost"
                size="icon"
                className={`pointer-events-auto ${currentHistoryIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
                onClick={prevHistoryCard}
                disabled={currentHistoryIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`pointer-events-auto ${
                  currentHistoryIndex === story.history.length - 1 ? 'opacity-0' : 'opacity-100'
                }`}
                onClick={nextHistoryCard}
                disabled={currentHistoryIndex === story.history.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
              {story.history.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full transition-all ${
                    index === currentHistoryIndex ? 'bg-primary w-3' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 