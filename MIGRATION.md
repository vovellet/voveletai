# ObscuraNet → VoveletAI Migration Guide

This document provides guidance for migrating from ObscuraNet to VoveletAI branding across the codebase.

## Overview of Changes

| Old Term | New Term | Context |
|----------|----------|---------|
| ObscuraNet | VoveletAI | Project/platform name |
| obscuranet | vovelet | Package names, imports |
| GPT Engine | Vove Engine | AI analysis system |
| @obscuranet/gpt-engine | @vovelet/vove-engine | Package name |
| @obscuranet/nft-engine | @vovelet/nft-engine | Package name |
| @obscuranet/zcore | @vovelet/vcore | Package name |
| @obscuranet/shared | @vovelet/shared | Package name |
| OBX, Token, Token rewards | Let, VLET, Let rewards | Token system |
| OBX Card | VoveCard | User card component |
| obx-token, obx-score | let-score, vlet | File/variable naming |

## Directory Changes

- `apps/api` → `apps/vove-api`
- `packages/gpt-engine` → `packages/vove-engine` 
- `packages/zcore` → `packages/vcore`

## Import Statements

Update all import statements in your files:

```typescript
// Old
import { calculateTokenRewards } from '@obscuranet/zcore';
import { analyzeContribution } from '@obscuranet/gpt-engine';

// New
import { calculateTokenRewards } from '@vovelet/vcore';
import { analyzeContribution } from '@vovelet/vove-engine';
```

## Environment Variables

Update any environment variable names:

```
# Old
OBSCURANET_API_KEY=xyz123
GPT_ENGINE_URL=https://api.example.com/gpt

# New
VOVELET_API_KEY=xyz123
VOVE_ENGINE_URL=https://api.example.com/vove
```

## UI Components

- Rename `OBXCard.tsx` to `VoveCard.tsx`
- Update text references in UI components from "ObscuraNet" to "VoveletAI"
- Update token references from "OBX" to "VLET" or "Let"

## Configuration Files

- Update package names in all `package.json` files
- Update import mapping in `jest.config.ts` and other config files
- Update script paths in npm scripts and CI/CD configs

## Terminology Consistency

- Z-score: Keep this term, but ensure it's connected with the "Let" system in explanations
- Tokens: Replace with "Lets" when referring to the reward currency
- "GPT" references: Replace with "Vove" when referring to the AI engine

## Tests

Ensure you update all test files to use the new package names and terminology.

## Documentation

Update all documentation to reflect the new branding and terminology.

## API Endpoints

If you have API endpoints that include the old naming, update them to match the new branding.

## Next Steps

1. After making these changes, run a full test suite to ensure everything works correctly
2. Check for any remaining references to the old branding with a project-wide search
3. Update any external services or integrations that might reference the old names