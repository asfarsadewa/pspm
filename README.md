# Pilih Sendiri Petualanganmu (Choose Your Own Adventure)

An interactive storytelling application built with Next.js 15, where users create characters and make choices that shape their adventure. The app uses Claude 3.5 Sonnet to generate dynamic, contextual story content.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: Bun
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + localStorage
- **AI Integration**: Anthropic Claude 3.5 Sonnet via OpenRouter API
- **Markdown**: ReactMarkdown for story rendering

## Getting Started

First, set up your environment variables:

```bash
# .env
OPENROUTER_API_KEY=your_api_key
NEXT_PUBLIC_APP_URL=your_app_url
```

Then run the development server:

```bash
# Install dependencies
bun install

# Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Key Features

### Character System
- Character creation with name and backstory
- Persistent character storage using localStorage
- Character-story relationship management
- Edit/Delete functionality with state sync

### Story Generation
- Dynamic story generation using Claude 3.5 Sonnet
- Context-aware story continuation based on previous choices
- Multiple choice system (2-3 options per scene)
- Story state persistence
- Archived stories support

### Interactive UI
- Card-based story display
- Interactive story history with card stack visualization
- Loading states and error handling
- Responsive design for mobile/desktop
- Toast notifications for user feedback

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Home page with character creation
│   └── story/[id]/page.tsx      # Dynamic story page
├── components/
│   ├── character-creation.tsx   # Character management UI
│   ├── story-selection.tsx      # Story list and navigation
│   └── ui/                      # shadcn components
├── lib/
│   ├── actions.ts              # Server actions & API integration
│   ├── types.ts                # TypeScript interfaces
│   └── utils.ts                # Helper functions
```

## Key Interfaces

```typescript
interface Character {
  name: string;
  backstory: string;
}

interface Story {
  id: string;
  title: string;
  currentNode: StoryNode;
  history: StoryNode[];
  character: Character;
  lastUpdated: string;
}

interface StoryNode {
  id: string;
  content: string;
  choices: StoryChoice[];
  selectedChoice?: string;
}
```

## AI Integration

The app uses Claude 3.5 Sonnet through OpenRouter API with specific prompting:
- Story segments are kept between 100-200 words
- Responses follow a strict format with story content and choices
- Context management includes character backstory and previous choices
- Temperature set to 1 for balanced creativity

## State Management

- Character state is managed in localStorage and synced across components
- Stories are stored in localStorage with the following structure:
  - Active stories at the top
  - Archived stories below
  - Each story maintains its complete history
- Real-time state sync using storage events and intervals

## UI/UX Features

### Story History
- Card stack visualization
- Swipe/click navigation
- Chapter numbering
- Choice history display
- Reset to beginning functionality

### Character Management
- Form validation
- Edit/View modes
- Character-story relationship checks
- Deletion safeguards

## Story Generation Logic

The story generation follows these steps:
1. Initial story creation with character context
2. Choice selection triggers new generation
3. Previous story content and choices are included in context
4. Response parsing separates content and choices
5. State updates with new content while preserving history

## Error Handling

- API failures with proper user feedback
- Character state validation
- Story state persistence checks
- Navigation guards
- Form validation

## Learn More

To learn more about the technologies used:
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Claude API Documentation](https://docs.anthropic.com/claude/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
