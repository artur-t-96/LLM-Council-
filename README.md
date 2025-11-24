# LLM Council

A Next.js application that consults multiple state-of-the-art AI models and synthesizes their responses through a "Chair" evaluator.

## Features

- **Multi-Model Consultation**: Queries three leading AI models simultaneously:
  - **GPT-5.1** (OpenAI)
  - **Claude Sonnet 4.5** (Anthropic)
  - **Grok 4.1 Fast Reasoning** (xAI)

- **Chair Evaluation**: Claude Sonnet 4.5 serves as the Chair, synthesizing all responses into one unified, authoritative answer

- **Modern UI**: Beautiful, responsive interface with real-time status indicators

- **Flexible Configuration**: API keys can be configured via environment variables or directly in the UI

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys for:
  - OpenAI (GPT-5.1)
  - Anthropic (Claude)
  - xAI (Grok)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/artur-t-96/LLM-Council-.git
cd LLM-Council-
```

2. Install dependencies:
```bash
npm install
```

3. Configure API keys:

Create a `.env.local` file in the root directory:
```env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
XAI_API_KEY=your_xai_key
```

Alternatively, you can configure keys directly in the UI by clicking the Settings icon.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter your question in the input field
2. The app queries all three AI models in parallel
3. View individual responses from each model
4. The Chair (Claude Sonnet 4.5) synthesizes a final answer

## Technology Stack

- **Framework**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS
- **AI SDKs**: 
  - OpenAI SDK
  - Anthropic SDK
  - xAI API (OpenAI-compatible)

## License

MIT
