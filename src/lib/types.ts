export interface Character {
  name: string;
  backstory: string;
}

export interface StoryChoice {
  id: string;
  text: string;
}

export interface StoryNode {
  id: string;
  content: string;
  choices: StoryChoice[];
  selectedChoice?: string;
}

export interface StoryContext {
  content: string;
  choice?: string;
}

export interface Story {
  id: string;
  title: string;
  currentNode: StoryNode;
  history: StoryNode[];
  character: Character;
  lastUpdated: string;
  archived?: boolean;
} 