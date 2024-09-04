import { BigTransformer } from './app/common/transformers/big.transformer';

export const die = (msg: string): never => {
  console.error(`Fatal error: ${msg}`);
  process.exit(1);
};

export const port = Number(process.env.PORT ?? 3000);

export const decimalConfig = {
  precision: 20,
  scale: 10,
  transformer: new BigTransformer(),
  default: '0',
};

export const walletSecretKey =
  process.env.WALLET_SECRET_KEY ?? die(`WALLET_SECRET_KEY is not defined`);

export const walletPublicKey =
  process.env.WALLET_PUBLIC_KEY ?? die(`WALLET_PUBLIC_KEY is not defined`);

export const apiUrl = process.env.API_URL ?? die(`API_URL is not defined`);
