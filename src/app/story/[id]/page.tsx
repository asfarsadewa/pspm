"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { generateStory } from "@/lib/actions";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import type { Story } from "@/lib/types";
import { parseStoryResponse } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function StoryPage() {
  const params = useParams();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamedContent, setStreamedContent] = useState("");
  const [characterExists, setCharacterExists] = useState(true);
  const [processingChoice, setProcessingChoice] = useState<string | null>(null);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const initializingRef = useRef(false);

  const handleRouterPush = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  const processStream = async (stream: ReadableStream) => {
    console.log("=== Starting processStream ===");
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = "";

    try {
      const { value } = await reader.read();
      if (value) {
        accumulatedContent = decoder.decode(value);
        setStreamedContent(accumulatedContent);
      }

      console.log("=== Stream completed successfully ===");
      const parsedNode = parseStoryResponse(accumulatedContent);
      if (parsedNode.choices?.length > 0) {
        console.log("Setting final choices:", parsedNode.choices);
      }
      
      if (!accumulatedContent || !parsedNode.choices?.length) {
        throw new Error("Invalid response format");
      }

      return accumulatedContent;

    } catch (error) {
      console.log("=== Error in processStream ===", error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  };

  useEffect(() => {
    const loadExistingStory = (storyId: string) => {
      setProcessingChoice(null);
      setStreamedContent("");
      setCurrentHistoryIndex(0);

      const savedStories = JSON.parse(localStorage.getItem("stories") || "[]");
      const existingStory = savedStories.find((s: Story) => s.id === storyId);
      
      if (existingStory) {
        const character = localStorage.getItem("character");
        const parsedCharacter = character ? JSON.parse(character) : null;
        
        if (!parsedCharacter) {
          existingStory.archived = true;
          const updatedStories = savedStories.map((s: Story) => 
            s.id === storyId ? existingStory : s
          );
          localStorage.setItem("stories", JSON.stringify(updatedStories));
        }

        setStory(existingStory);
        setCharacterExists(!!parsedCharacter && parsedCharacter.name === existingStory.character.name);
      } else {
        handleRouterPush("/");
      }
      setLoading(false);
    };

    const initializeStory = async () => {
      if (initializingRef.current) {
        console.log("Already initializing story, skipping...");
        return;
      }

      if (params.id === "new") {
        const character = localStorage.getItem("character");
        if (!character) {
          console.error("No character found in localStorage");
          handleRouterPush("/");
          return;
        }

        try {
          initializingRef.current = true;
          setLoading(true);

          console.log("Generating new story...");
          const { stream, ok } = await generateStory(JSON.parse(character));
          
          if (!ok || !stream) throw new Error("Failed to get stream");
          
          const content = await processStream(stream);
          if (!content) throw new Error("No content received");
          
          const node = parseStoryResponse(content);
          const storyId = `story-${Date.now()}`;
          const newStory: Story = {
            id: storyId,
            title: `${JSON.parse(character).name}'s Adventure`,
            currentNode: node,
            history: [],
            character: JSON.parse(character),
            lastUpdated: new Date().toISOString()
          };

          const savedStories = JSON.parse(localStorage.getItem("stories") || "[]");
          savedStories.unshift(newStory);
          localStorage.setItem("stories", JSON.stringify(savedStories));

          setStory(newStory);
          setCharacterExists(true);
        } catch (error) {
          console.error("Error initializing story:", error);
          toast.error("Failed to start the story. Please try again.");
          handleRouterPush("/");
        } finally {
          setLoading(false);
          initializingRef.current = false;
        }
      } else {
        loadExistingStory(params.id as string);
      }
    };

    initializeStory();
  }, [params.id, handleRouterPush]);

  const handleChoice = async (choiceText: string) => {
    console.log("=== handleChoice called ===");
    console.log("Choice text:", choiceText);
    console.log("Current story:", story?.id);
    console.log("Current processingChoice:", processingChoice);

    if (!story) {
      console.log("No story found, exiting");
      return;
    }

    if (processingChoice) {
      console.log("Already processing choice:", processingChoice);
      console.log("Attempted new choice:", choiceText);
      return;
    }

    setProcessingChoice(choiceText);

    try {
      console.log("=== Starting choice generation ===");
      setStreamedContent("");
      
      const { stream, ok } = await generateStory(
        story.character,
        story.currentNode.content,
        choiceText,
        story.history.map(node => ({
          content: node.content,
          choice: node.selectedChoice
        }))
      );

      if (!ok || !stream) {
        setProcessingChoice(null);
        throw new Error("Failed to get stream");
      }
      
      const content = await processStream(stream);
      
      if (!content) {
        setProcessingChoice(null);
        throw new Error("No content received");
      }

      const node = parseStoryResponse(content);
      node.selectedChoice = choiceText;

      const updatedStory = {
        ...story,
        history: [...story.history, { ...story.currentNode, selectedChoice: choiceText }],
        currentNode: node,
        lastUpdated: new Date().toISOString()
      };

      const savedStories = JSON.parse(localStorage.getItem("stories") || "[]");
      const storyIndex = savedStories.findIndex((s: Story) => s.id === story.id);
      
      if (storyIndex !== -1) {
        savedStories[storyIndex] = updatedStory;
        localStorage.setItem("stories", JSON.stringify(savedStories));
      }

      setStory(updatedStory);
      setProcessingChoice(null);

    } catch (error) {
      console.error("=== Error in handleChoice ===", error);
      toast.error("Failed to continue the story. Please try again.");
      setProcessingChoice(null);
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

  useEffect(() => {
    return () => {
      setProcessingChoice(null);
      setStreamedContent("");
      setCurrentHistoryIndex(0);
    };
  }, [params.id]);

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
        <Button onClick={() => handleRouterPush("/")}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{story.title}</h1>
            {story.archived && (
              <Badge variant="secondary" className="mt-2">
                Archived Story
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => handleRouterPush("/")}>
              Exit Story
            </Button>
          </div>
        </div>
        
        {(story.archived || !characterExists) && (
          <div className="mb-4 p-4 bg-muted rounded-lg text-center border border-muted-foreground/20">
            <p className="text-muted-foreground">
              {story.archived 
                ? "This story is archived because its character was deleted. You can view the story but cannot continue it."
                : `This story's character has been deleted. Create a character with the name "${story.character.name}" to continue this adventure.`}
            </p>
          </div>
        )}

        <Card className="mb-6">
          <CardContent className="prose dark:prose-invert mt-6 max-w-none">
            {processingChoice ? (
              <>
                <div className="flex justify-center items-center min-h-[100px] mb-4">
                  <Spinner className="h-8 w-8" />
                </div>
                {streamedContent && (
                  <ReactMarkdown>{streamedContent}</ReactMarkdown>
                )}
              </>
            ) : (
              <ReactMarkdown>{story.currentNode.content}</ReactMarkdown>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {!processingChoice && story.currentNode.choices.map((choice) => (
            <Button
              key={choice.id}
              onClick={() => handleChoice(choice.text)}
              className="w-full text-left h-auto whitespace-normal"
              variant="outline"
              disabled={!characterExists || story.archived}
            >
              {choice.text}
            </Button>
          ))}
          {processingChoice && (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="w-full h-12 bg-muted rounded-md"
                />
              ))}
            </div>
          )}
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
                        e.stopPropagation();
                        if (index === currentHistoryIndex) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
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
    </div>
  );
} 