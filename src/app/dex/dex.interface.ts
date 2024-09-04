import Big from 'big.js';

export type PurchaseResult = {
  transactionId: string;
};

export type SellResult = {
  transactionId: string;
};

export interface IDexService {
  estimateSolAmount(token: string, amount: Big): Promise<Big>;
  purchaseTokens(token: string, amountSol: Big): Promise<PurchaseResult>;
  sellTokens(token: string, amountToken: Big): Promise<SellResult>;
}
