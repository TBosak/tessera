# Tessera - Ranked Choice Voting

A modern, secure, and auditable ranked choice voting application built with React, Bun, and SQLite.

## Features

- **Instant Runoff Voting (IRV)** for single-winner elections
- **Secure token-based voting** with unlinkable ballots
- **Full transparency** with published receipts and audit data
- **Drag-and-drop ballot interface** with accessibility support
- **Real-time results** with round-by-round visualization
- **Deterministic tie-breaking** for reproducible results

## Architecture

### Frontend (`apps/web`)
- React 18 + Vite + TypeScript
- TailwindCSS with neobrutalism design system
- Drag-and-drop voting interface with @dnd-kit
- TanStack Query for state management

### Backend (`apps/api`)
- Bun runtime with Hono framework
- SQLite database with WAL mode
- Zod validation and JWT sessions
- Rate limiting and security middleware

### Counting (`packages/counting`)
- Pure TypeScript IRV implementation
- Deterministic tie-breaking with seeded PRNG
- Extensible for STV (multi-winner) support

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) runtime for the API
- Node.js 18+ for the frontend
- Windows, macOS, or Linux

### Installation

1. **Clone and setup**
   ```bash
   git clone <your-repo>
   cd tessera
   ```

2. **Install counting package**
   ```bash
   cd packages/counting
   npm install
   npm run build
   cd ../..
   ```

3. **Install and setup API**
   ```bash
   cd apps/api
   npm install
   cp .env.example .env
   # Edit .env if needed for your setup
   bun run init-db.js  # Initialize database
   cd ../..
   ```

4. **Install frontend (if needed)**
   ```bash
   cd apps/web
   npm install  # This may take a while
   cp .env.example .env
   cd ../..
   ```

### Running the Application

1. **Start the API server**
   ```bash
   cd apps/api
   bun run dev
   ```

2. **In another terminal, start the frontend**
   ```bash
   cd apps/web
   npm run dev
   ```

3. **Open your browser**
   - Frontend: http://localhost:5173
   - API: http://localhost:3000

## Usage

### For Organizers

1. **Create Account** - Register at `/login`
2. **Create Election** - Set title, description, and voting parameters
3. **Add Candidates** - Upload candidate info and photos
4. **Generate Tokens** - Create secure voting tokens for distribution
5. **Open Voting** - Make election live for voters
6. **Monitor Progress** - Track votes and manage election
7. **Close & View Results** - End voting and publish transparent results

### For Voters

1. **Visit Election** - Go to `/e/election-slug`
2. **Enter Token** - Use your secure voting token
3. **Rank Candidates** - Drag and drop to create your ranking
4. **Cast Vote** - Submit your ballot
5. **Save Receipt** - Keep your receipt hash for verification

### For Auditors

- **View Results** - `/e/election-slug/results` - See round-by-round IRV counting
- **Check Receipts** - `/e/election-slug/receipts` - Verify vote inclusion
- **Download Data** - Get ballots JSON and audit information
- **Replay Counting** - Verify results with deterministic algorithm

## Security Features

- **Unlinkable Ballots** - Votes cannot be traced back to voters
- **Receipt Verification** - Voters can confirm their vote was counted
- **Rate Limiting** - Prevents abuse and spam
- **Token-based Access** - One-time use tokens prevent multiple voting
- **Deterministic Counting** - Results can be independently verified

## Development

### Project Structure
```
tessera/
├── apps/
│   ├── api/          # Bun + Hono backend
│   └── web/          # React + Vite frontend
├── packages/
│   └── counting/     # IRV/STV algorithms
└── ...
```

### Commands
```bash
# Install all dependencies
bun install

# Development (all apps)
bun run dev

# Build for production
bun run build

# Type checking
bun run typecheck

# Run tests
bun run test
```

### Database

The application uses SQLite with WAL mode for simplicity and reliability:

- **Schema** - See `apps/api/src/db/schema.sql`
- **Migrations** - Run with `bun run migrate`
- **Backups** - Copy the SQLite files

## Deployment

### Environment Variables

**API (.env)**
```bash
DB_PATH=./data/tessera.sqlite
SESSION_SECRET=your-super-secret-key
SITE_URL=https://yourdomain.com
NODE_ENV=production
```

**Web (.env)**
```bash
VITE_API_URL=https://api.yourdomain.com
```

### Build & Deploy

1. **Build applications**
   ```bash
   bun run build
   ```

2. **Deploy API** - Any Node.js/Bun hosting (Railway, Fly.io, etc.)

3. **Deploy Frontend** - Static hosting (Vercel, Netlify, etc.)

4. **Set up database** - Run migrations on production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Create an issue for bugs or feature requests
- Check the documentation in `/docs` (coming soon)
- Review the specifications in `CLAUDE.md`