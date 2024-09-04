import { ValueTransformer } from 'typeorm';
import Big from 'big.js';

export class BigTransformer implements ValueTransformer {
  from(value: string | null): Big | null {
    return value !== null ? new Big(value) : null;
  }

  to(value: Big | null): string | null {
    return value !== null ? value.toString() : null;
  }
}
