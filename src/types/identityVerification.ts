export type IdentityVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface IdentityVerification {
  id: string;
  userId: string;
  idDocumentFrontUrl?: string;
  idDocumentBackUrl?: string;
  selfieUrl?: string;
  status: IdentityVerificationStatus;
  submittedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
  diditSessionId?: string;
  diditDecisionData?: any;
  diditSubmittedAt?: string;
  diditCompletedAt?: string;
}

export interface CreateIdentityVerificationData {
  idDocumentFrontUrl?: string;
  idDocumentBackUrl?: string;
  selfieUrl?: string;
}

