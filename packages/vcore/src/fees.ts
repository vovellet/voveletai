/**
 * Calculate transaction fee based on Let amount
 * 
 * @param amount - The Let amount for the transaction
 * @returns Transaction fee amount
 */
export function calculateTxFee(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 0;
  }
  
  // Base fee calculation: 1% with minimum fee of 0.5 Lets
  const baseFee = Math.max(parseFloat((amount * 0.01).toFixed(2)), 0.5);
  
  // Apply discount based on amount tier
  if (amount >= 100) {
    return parseFloat((baseFee * 0.8).toFixed(2)); // 20% discount for large amounts
  } else if (amount >= 50) {
    return parseFloat((baseFee * 0.9).toFixed(2)); // 10% discount for medium amounts
  }
  
  return baseFee;
}