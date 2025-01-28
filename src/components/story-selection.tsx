"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface SavedStory {
  id: string;
  title: string;
  lastUpdated: string;
  archived: boolean;
  character: { name: string };
}

export function StorySelection() {
  const router = useRouter();
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [character, setCharacter] = useState<Character | null>(null);

  useEffect(() => {
    // Function to load data
    const loadData = () => {
      const savedCharacter = localStorage.getItem("character");
      if (savedCharacter) {
        setCharacter(JSON.parse(savedCharacter));
      } else {
        setCharacter(null);
      }

      const stories = localStorage.getItem("stories");
      if (stories) {
        setSavedStories(JSON.parse(stories));
      }
    };

    // Load initial data
    loadData();

    // Add storage event listener
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    // Also watch for local changes
    const interval = setInterval(loadData, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleDeleteStory = (storyId: string) => {
    const updatedStories = savedStories.filter(s => s.id !== storyId);
    localStorage.setItem("stories", JSON.stringify(updatedStories));
    setSavedStories(updatedStories);
    toast.success("Story deleted");
  };

  const handleStartNewAdventure = () => {
    if (!character) return;
    console.log("Starting new adventure with character:", character);
    router.push("/story/new");
  };

  const activeStories = savedStories.filter(s => !s.archived);
  const archivedStories = savedStories.filter(s => s.archived);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Adventures</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {character && (
            <Button 
              className="w-full"
              onClick={handleStartNewAdventure}
            >
              Start New Adventure
            </Button>
          )}

          {activeStories.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Continue Previous Adventures</h3>
              {activeStories.map((story) => (
                <div key={story.id} className="flex items-start gap-2">
                  <Button
                    variant="outline"
                    asChild
                    className="w-full text-left min-h-[4rem] h-auto py-2"
                    disabled={!character || character.name !== story.character.name}
                  >
                    <Link href={`/story/${story.id}`}>
                      <div className="w-full">
                        <div className="font-medium truncate">{story.title}</div>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <span className="shrink-0">Last played: {formatDistanceToNow(new Date(story.lastUpdated))} ago</span>
                          <span className="text-xs opacity-75 shrink-0">
                            Created: {new Date(parseInt(story.id.split('-')[1])).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this story?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteStory(story.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}

          {archivedStories.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Archived Adventures</h3>
              {archivedStories.map((story) => (
                <div key={story.id} className="flex items-start gap-2">
                  <Button
                    variant="outline"
                    asChild
                    className="w-full text-left min-h-[4rem] h-auto py-2"
                  >
                    <Link href={`/story/${story.id}`}>
                      <div className="w-full">
                        <div className="font-medium truncate">{story.title}</div>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <span className="shrink-0">Character: {story.character.name}</span>
                        </div>
                      </div>
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this story?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteStory(story.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 