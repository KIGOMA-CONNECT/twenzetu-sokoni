import { Injectable } from '@nestjs/common';
import { UserRole, VerificationDocumentStatus } from '@afri-market/identity-domain';

export interface AiVerificationInput {
  readonly role: UserRole;
  readonly fullName: string;
  readonly businessName?: string;
  readonly ninOrRegNo?: string;
  readonly city?: string;
}

export interface AiVerificationResult {
  readonly riskScore: number;
  readonly documentStatus: VerificationDocumentStatus;
  readonly notes: string[];
}

/**
 * Deterministic stand-in for an ML-based document-verification pipeline. It
 * scores the real-info fields submitted at registration (ID/business-reg no,
 * business name, city) against simple quality heuristics and returns a
 * 0-100 risk score plus a document status.
 *
 * The real OCR/KYC integration (NIDA, RDB, etc.) plugs in behind this
 * interface; admin approval stays manual either way.
 */
@Injectable()
export class AiVerificationService {
  public async evaluate(input: AiVerificationInput): Promise<AiVerificationResult> {
    const notes: string[] = [];
    let score = 0;

    const rolesRequiringDocs: UserRole[] = ['vendor', 'driver'];
    if (!rolesRequiringDocs.includes(input.role)) {
      return { riskScore: 0, documentStatus: 'NOT_REQUIRED', notes: ['No document verification required for this role'] };
    }

    if (!input.ninOrRegNo || input.ninOrRegNo.trim().length < 6) {
      score += 45;
      notes.push('Missing or suspiciously short ID / business registration number');
    } else if (!/^[A-Za-z0-9\-/]+$/.test(input.ninOrRegNo.trim())) {
      score += 25;
      notes.push('ID / registration number contains unexpected characters');
    }

    if (input.role === 'vendor' && (!input.businessName || input.businessName.trim().length < 2)) {
      score += 25;
      notes.push('Missing business name');
    }

    if (!input.city || input.city.trim().length < 2) {
      score += 15;
      notes.push('Missing city / trading area');
    }

    if (!input.fullName || input.fullName.trim().length < 3) {
      score += 15;
      notes.push('Full name appears incomplete');
    }

    score = Math.min(100, score);

    let documentStatus: VerificationDocumentStatus;
    if (score >= 60) {
      documentStatus = 'REJECTED';
      notes.push('High-risk registration flagged for manual review');
    } else if (score >= 30) {
      documentStatus = 'PENDING';
      notes.push('Low-confidence documents, pending manual review');
    } else {
      documentStatus = 'APPROVED';
      notes.push('Documents passed automated checks');
    }

    return { riskScore: score, documentStatus, notes };
  }
}
