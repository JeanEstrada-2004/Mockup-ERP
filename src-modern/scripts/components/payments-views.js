import { isModuleEnabled } from '../config/variants.js';

export function paymentsWorkspace() {
  return { allowed: isModuleEnabled('payments') };
}
