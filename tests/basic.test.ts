import { analyzeContribution } from '@obscuranet/gpt-engine';
import { createNFTMetadata } from '@obscuranet/nft-engine';
import { calculateTokenRewards, normalizeZScore } from '@obscuranet/zcore';

describe('Basic mock tests', () => {
  test('GPT engine mocks work', async () => {
    const result = await analyzeContribution('Test contribution');
    expect(result).toBeDefined();
    expect(result.category).toBe('TECHNICAL');
    expect(result.gptScore).toBe(8.5);
  });

  test('NFT engine mocks work', async () => {
    const result = await createNFTMetadata({} as any);
    expect(result).toBe('ipfs://QmMockIpfsHash');
  });

  test('Zcore mocks work', () => {
    const mockCategory = 'TECHNICAL';
    const result = calculateTokenRewards(10, mockCategory);
    expect(result).toBeDefined();
    expect(result.STX).toBeDefined();
    expect(result[mockCategory]).toBeDefined();

    const normalized = normalizeZScore(15);
    expect(normalized).toBeLessThanOrEqual(10);
    expect(normalized).toBeGreaterThanOrEqual(0);
  });
});