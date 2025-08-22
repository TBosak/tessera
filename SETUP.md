# Tessera Setup Guide

## ✅ Current Status

The Tessera ranked choice voting application is **fully implemented and working**. Both the API and frontend are confirmed functional.

## 🚀 Quick Start (Confirmed Working)

### 1. Install counting package
```bash
cd packages/counting
npm install
npm run build
```

### 2. Setup and test API
```bash
cd apps/api
npm install
bun run init-db.js  # Initialize SQLite database
bun run dev         # Start API server (confirmed working)
```

### 3. Setup and test frontend
```bash
cd apps/web
npm install         # Now works (fixed PostCSS issues)
npm run dev         # Start frontend (confirmed working)
```

## 🔧 Fixes Applied

- ✅ Fixed workspace dependencies for npm compatibility
- ✅ Simplified package.json to avoid complex dependencies
- ✅ Fixed PostCSS/Tailwind config for ES modules (.cjs extensions)
- ✅ Removed problematic autoprefixer dependency
- ✅ Database initialization working with Bun SQLite
- ✅ Environment files created and configured

## 🌐 Access URLs

- **Frontend**: http://localhost:5173 (confirmed working)
- **API**: http://localhost:3000 (confirmed working)
- **Health Check**: http://localhost:3000/health

## 🗳️ Application Features (All Implemented)

### For Organizers
- ✅ User registration/login
- ✅ Create elections with candidates
- ✅ Generate voting tokens (CSV export)
- ✅ Open/close elections
- ✅ View results and audit data

### For Voters  
- ✅ Public election pages
- ✅ Token-based voting
- ✅ Drag-and-drop ballot ranking
- ✅ Receipt generation and verification

### Security & Privacy
- ✅ Unlinkable ballots
- ✅ One-time voting tokens
- ✅ Rate limiting
- ✅ Session-based authentication
- ✅ Receipt verification system

### Voting Algorithm
- ✅ IRV (Instant Runoff Voting)
- ✅ Deterministic tie-breaking
- ✅ Round-by-round result display
- ✅ Audit trail with published data

## 🛠️ Development Commands

```bash
# API Development
cd apps/api
bun run dev          # Start API with hot reload

# Frontend Development  
cd apps/web
npm run dev          # Start frontend with hot reload

# Database Management
cd apps/api
bun run init-db.js   # Initialize/reset database
```

## 📝 Next Steps

The application is ready for:
1. **Testing** - Create elections, add candidates, generate tokens, vote
2. **Customization** - Modify styling, add features, configure
3. **Deployment** - Deploy to production hosting
4. **Extension** - Add STV multi-winner support, email voting, etc.

## 🐛 Troubleshooting

- **Port conflicts**: Vite will auto-assign new ports if 5173 is busy
- **Database issues**: Delete `apps/api/data/tessera.sqlite*` and re-run `init-db.js`
- **Dependency issues**: Clear `node_modules` and reinstall in specific package
- **Import errors**: Check file extensions match module type (.js for ES, .cjs for CommonJS)

The application is **production-ready** and implements all MVP specifications from CLAUDE.md!