# Contributing to New Avalon: Skirmish

Thank you for your interest in contributing to New Avalon: Skirmish!

## Installation

```bash
# Clone the repository
git clone https://github.com/uz0/NewAvalonSkirmish.git
cd NewAvalonSkirmish

# Install dependencies
npm install
```

## Development

### Starting Development Server

**Claude Prompt:** "start dev on bg"

```bash
npm run dev
```

This starts both the client (Vite) and server (tsx) with hot module reload.

### Checking Code Quality

**Claude Prompt:** "check lint and types"

```bash
# Run ESLint
npm run lint

# Run type checking
npm run type-check

# Run full build to verify everything compiles
npm run build
```

### Adding New Translations

**Claude Prompt:** "update locales"

When adding or updating translations:

1. Add/update the locale file in `client/locales/` (e.g., `fr.ts` for French)
2. Export it from `client/locales/index.ts`
3. Add the language code to `client/locales/types.ts` (LanguageCode type)
4. Add the display name to `LANGUAGE_NAMES` in `client/locales/index.ts`
5. Update CLAUDE.md Project Structure section if new files were added

Example locale file structure:
```typescript
import type { TranslationResource } from '@/locales/types'

export const fr: TranslationResource = {
  ui: {
    startGame: 'Commencer la partie',
    // ... all UI strings
  },
  rules: {
    title: 'Règles du jeu',
    // ... all rule sections
  },
  counters: {
    Stun: { name: 'Étourdi', description: '...' },
    // ... all counters
  },
  cards: {
    // Optional: card translations
  },
}
```

### Version Bump

**Claude Prompt:** "update version to x.x.x based on changes"

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR version** (X.0.0): Breaking changes
- **MINOR version** (0.X.0): New features (backwards compatible)
- **PATCH version** (0.0.X): Bug fixes (backwards compatible)

Steps:
1. Update `package.json` version
2. Add entry to `CHANGELOG.md` with date and changes
3. Update CLAUDE.md if API flow or structure changed

Example:
```bash
# Edit package.json
"version": "0.4.0"

# Edit CHANGELOG.md
## [0.4.0] - 2024-12-22

### Added
- New feature description

### Fixed
- Bug fix description
```

### Creating Feature Branch

**Claude Prompt:** "go to new branch version-x-x-x"

```bash
# Create and checkout new branch
git checkout -b feature/your-feature-name

# Or for version-specific branches
git checkout -b version-0-4-0
```

### Committing Changes

**Claude Prompt:** "commit all, push and open PR"

1. Stage your changes:
```bash
git add -A
```

2. Commit with version and changelog:
```bash
git commit -m "0.4.0 Add new feature description"
```

3. Push to remote:
```bash
git push -u origin feature/your-feature-name
```

4. Create Pull Request:
   - Visit: https://github.com/uz0/newavalon.xyz/pull/new/feature/refactoring
   - Or use GitHub CLI: `gh pr create`

## Review Process

### Waiting for Code Review

**Claude Prompt:** "waiting for code review approval"

After opening a PR:

1. **Wait 2-5 minutes** for CodeRabbit to review
2. Read GitHub PR comments from CodeRabbit
3. Address any issues raised
4. Request review from maintainers if needed

### Merging

**Claude Prompt:** "squash and merge"

When the PR is approved:

1. Click **"Squash and merge"** button in GitHub
2. Ensure the commit message follows the format: `VERSION Summary of changes`
3. Delete the branch after merging

### Deployment

**Claude Prompt:** "ask to make deploy"

Deployment is manual. Ask the repository owner to:
1. Pull latest changes from master
2. Build and test with Docker:
   ```bash
   docker build -t newavalonskirmish .
   docker run -d -p 8822:8080 --name test newavalonskirmish
   ```
3. Test on `http://localhost:8822`
4. Deploy to production

## Additional Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Run `npm run lint` before committing
- Use meaningful variable/function names

### Testing

Manually test:
- Game creation and joining
- Card interactions
- Language switching
- Settings changes

### Documentation

Update relevant documentation when making changes:
- `CLAUDE.md` - Project structure and API flow (MANDATORY for structural changes)
- `CHANGELOG.md` - Version history (MANDATORY for all releases)
- `CONTRIBUTING.md` - Contribution guidelines (if workflow changes)

### Issues

Before starting work on a new feature:
1. Check existing issues
2. Create an issue if none exists
3. Reference the issue in your PR (e.g., `Fixes #123`)
