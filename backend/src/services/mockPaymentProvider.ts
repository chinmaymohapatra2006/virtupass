/**
 * MOCK PAYMENT PROVIDER
 * 
 * Provides a production-shaped payment gateway abstraction for VirtuPass.
 * Simulates real-time transaction processing, webhook verification, and 
 * failure/cancellation outcomes without requiring live bank/UPI/Razorpay credentials.
 * 
 * Non-Negotiable:
 * - Operates entirely in volatile memory.
 * - Simulates outcomes deterministically for demo & automated testing.
 */

export interface CreateSessionParams {
  amountPaise: number;
  currency: 'INR';
  orderReference: string;
  customerEmail: string;
  metadata?: Record<string, any>;
}

export interface SessionResult {
  providerTxnRef: string;
  checkoutUrl: string;
  expiresAt: number;
}

export type SimulatedOutcome = 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING';

export interface VerificationResult {
  status: SimulatedOutcome;
  providerTxnRef: string;
  gatewayPaymentId: string;
  processedAt: string;
  failureReason?: string;
}

export interface IPaymentProvider {
  createSession(params: CreateSessionParams): Promise<SessionResult>;
  processPayment(providerTxnRef: string, outcome?: SimulatedOutcome, method?: string): Promise<VerificationResult>;
  verifyTransaction(providerTxnRef: string, expectedAmountPaise: number): Promise<VerificationResult>;
}

export class MockPaymentProvider implements IPaymentProvider {
  // Map of providerTxnRef -> transaction state
  private transactions: Map<
    string,
    {
      providerTxnRef: string;
      orderReference: string;
      amountPaise: number;
      currency: 'INR';
      status: SimulatedOutcome;
      customerEmail: string;
      paymentMethod?: string;
      failureReason?: string;
      createdAt: number;
      expiresAt: number;
      processedAt?: string;
    }
  > = new Map();

  public async createSession(params: CreateSessionParams): Promise<SessionResult> {
    const providerTxnRef = `txn_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15-minute checkout window

    this.transactions.set(providerTxnRef, {
      providerTxnRef,
      orderReference: params.orderReference,
      amountPaise: params.amountPaise,
      currency: params.currency,
      status: 'PENDING',
      customerEmail: params.customerEmail,
      createdAt: now,
      expiresAt
    });

    return {
      providerTxnRef,
      checkoutUrl: `/checkout/simulate?txn=${providerTxnRef}`,
      expiresAt
    };
  }

  /**
   * Simulates customer completing the transaction at the bank/UPI interface.
   * Can be configured with test outcome in demo mode (default: SUCCESS).
   */
  public async processPayment(
    providerTxnRef: string,
    outcome: SimulatedOutcome = 'SUCCESS',
    method: string = 'UPI'
  ): Promise<VerificationResult> {
    const txn = this.transactions.get(providerTxnRef);
    if (!txn) {
      throw new Error(`Provider transaction reference '${providerTxnRef}' not found`);
    }

    // Check expiration
    if (Date.now() > txn.expiresAt) {
      txn.status = 'CANCELLED';
      txn.failureReason = 'Payment session expired at payment gateway';
      throw new Error('Payment session expired');
    }

    txn.status = outcome;
    txn.paymentMethod = method;
    txn.processedAt = new Date().toISOString();

    if (outcome === 'FAILED') {
      txn.failureReason = 'Simulated bank decline: insufficient student account funds or network timeout';
    } else if (outcome === 'CANCELLED') {
      txn.failureReason = 'Simulated checkout aborted by user';
    } else {
      txn.failureReason = undefined;
    }

    return {
      status: txn.status,
      providerTxnRef: txn.providerTxnRef,
      gatewayPaymentId: `pay_gw_${txn.providerTxnRef.replace('txn_mock_', '')}`,
      processedAt: txn.processedAt,
      failureReason: txn.failureReason
    };
  }

  /**
   * Server-to-server gateway verification: queries the gateway authority.
   * Never relies on client-supplied status.
   */
  public async verifyTransaction(
    providerTxnRef: string,
    expectedAmountPaise: number
  ): Promise<VerificationResult> {
    const txn = this.transactions.get(providerTxnRef);
    if (!txn) {
      throw new Error(`Transaction reference '${providerTxnRef}' not found at gateway`);
    }

    if (txn.amountPaise !== expectedAmountPaise) {
      throw new Error('Payment gateway amount mismatch: detected tampering');
    }

    return {
      status: txn.status,
      providerTxnRef: txn.providerTxnRef,
      gatewayPaymentId: `pay_gw_${txn.providerTxnRef.replace('txn_mock_', '')}`,
      processedAt: txn.processedAt || new Date().toISOString(),
      failureReason: txn.failureReason
    };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();