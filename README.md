# VoveletAI

AI-powered contribution & evaluation network.

## Project Structure

This is a monorepo managed with pnpm workspaces. The project consists of:

- `apps/web`: Next.js 14 frontend with App Router, TailwindCSS, and TypeScript
- `apps/vove-api`: Firebase Functions backend in TypeScript
- `packages/shared`: Shared types, constants, and environment configurations
- `packages/vcore`: Core logic for Z-score, Let rewards, token generation
- `packages/vove-engine`: Vove Engine character system and prompt logic
- `blockchain/contracts`: Hardhat environment for ERC-20 and ERC-721 smart contracts
- `infra/firebase`: Firebase rules and emulator setup

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Firebase CLI
- Hardhat

### Installation

1. Clone the repository
2. Copy environment files:
   ```bash
   cp .env.example .env.local
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Run the development servers:

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Lint

```bash
pnpm lint
```

## Testing with Jest + TypeScript

This project is configured to use Jest with TypeScript for testing. The configuration files and mock implementations have been set up to allow for comprehensive testing of all components.

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test files
pnpm test -- tests/basic.test.ts

# Run tests with coverage
pnpm test -- --coverage
```

### Mock Implementations

The following mock implementations are available:

#### Internal Packages

- `@vovelet/vove-engine` - Mock for Vove analysis functions
- `@vovelet/nft-engine` - Mock for NFT creation functions
- `@vovelet/vcore` - Mock for token calculation functions
- `@vovelet/shared` - Mock for shared utilities and constants

#### External Dependencies

- `firebase-admin` - Advanced mock with in-memory implementations
- `firebase-functions` - Mock for Cloud Functions
- `firebase-functions-test` - Testing utilities for Cloud Functions
- `ethers` - Mock for blockchain interactions

### Firebase Testing Structure

#### Global Mocks (jest.setup.ts)

The main setup file provides global mocks for all Firebase services:

- **firebase-admin**: Properly initialized with apps array and all services
- **firebase-functions**: Complete implementation of all trigger types
- **firebase-functions-test**: Simplified testing utilities

#### API Test Mocks (apps/vove-api/tests/setup.ts)

The API test setup includes:

- **functionsTest.wrap()**: Fixed implementation that works with existing tests
- **Context handling**: Automatically provides auth context for function calls
- **In-memory storage**: Collections stored in memory for testing
- **Cleanup utilities**: Reset state between tests

### Firebase Admin Mock

The firebase-admin mock includes:

- In-memory Firestore implementation
- Auth implementation with user management
- Storage implementation for file operations
- Enhanced FieldValue operations (serverTimestamp, increment, arrayUnion, arrayRemove)
- Properly initialized apps array to prevent apps.length issues

### Blockchain Event Listener

A script for listening to blockchain events is available at:

```
apps/vove-api/scripts/listeners/onChainEvents.ts
```

To run the listener:

```bash
cd apps/vove-api
npm run listen
```

## Environment Variables

See `.env.example` for required environment variables.

## License

[MIT](LICENSE)