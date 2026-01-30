export interface DiditSessionResponse {
  session_id: string;
  session_token: string;
  status: string;
}

export interface DiditWebhookPayload {
  session_id: string;
  status: 'Approved' | 'Declined' | 'In Review';
  decision: {
    id_verification?: {
      status: string;
      confidence: number;
    };
    face_match?: {
      status: string;
      confidence: number;
    };
  };
  vendor_data?: string;
  timestamp?: string;
}

export interface DiditDecisionData {
  session_id: string;
  status: string;
  decision: Record<string, any>;
  processed_at: string;
}
