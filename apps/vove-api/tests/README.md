# VoveletAI API Tests

This directory contains tests for the VoveletAI API endpoints (Firebase Cloud Functions).

## Test Structure

Tests are organized by feature:

- `submitContribution.test.ts` - Tests for the contribution submission API
- `nft/` - Tests for NFT-related functions
- `zorigin/` - Tests for Z-Origin project functionality 
- `tokens/` - Tests for Let rewards and token operations
- `zborsa/` - Tests for Z-Borsa exchange functionality
- `integration/` - Cross-module integration tests

## Running Tests

```bash
# Run all tests
npm test

# Run a specific test file
npm test -- submitContribution.test.ts

# Run with coverage
npm run test:coverage
```

## Test Environment

Tests use:
- `firebase-functions-test` for Cloud Function testing
- Jest mocks for external dependencies
- In-memory Firestore implementation via jest.setup.ts

## Mock Data

The tests use consistent mock data for:
- User profiles with various Z-score levels
- Sample contributions across different categories
- Mock wallet balances for token operations
- Sample projects for Z-Origin tests

## Debugging Tests

For detailed logging during tests, set the environment variable:

```bash
DEBUG=true npm test
```

When debugging specific tests, use the `.only` modifier:

```typescript
test.only('should calculate correct rewards', async () => {
  // Only this test will run
});
```