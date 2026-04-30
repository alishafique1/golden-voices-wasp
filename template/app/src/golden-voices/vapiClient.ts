/**
 * Vapi Client — outbound AI voice call initiation
 * Docs: https://docs.vapi.ai
 */

const VAPI_BASE = "https://api.vapi.ai";

interface VapiCallPayload {
  assistantId: string;
  phoneNumberId: string;
  customer: {
    number: string;
    name: string;
    numberType?: string;
  };
  metadata?: Record<string, string>;
}

interface VapiCallResponse {
  id: string;
  status: string;
  createdAt: string;
}

export class VapiClient {
  private apiKey: string;
  private assistantId: string;
  private phoneNumberId: string;

  constructor() {
    this.apiKey = process.env.VAPI_PRIVATE_KEY ?? "";
    this.assistantId = process.env.VAPI_ASSISTANT_ID ?? "";
    this.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID ?? "";
    if (!this.apiKey) throw new Error("VAPI_PRIVATE_KEY is not set");
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Initiate an outbound call to a senior.
   * Returns the Vapi call ID.
   */
  async initiateOutboundCall(params: {
    seniorPhone: string;
    seniorName: string;
    language: "en" | "ur" | "hi";
    metadata?: Record<string, string>;
  }): Promise<string> {
    const body: VapiCallPayload = {
      assistantId: this.assistantId,
      phoneNumberId: this.phoneNumberId,
      customer: {
        number: params.seniorPhone,
        name: params.seniorName,
      },
      metadata: {
        language: params.language,
        ...params.metadata,
      },
    };

    const response = await fetch(`${VAPI_BASE}/call/phone`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vapi call initiation failed: ${response.status} ${error}`);
    }

    const data = (await response.json()) as VapiCallResponse;
    return data.id;
  }

  /**
   * Get the status of a call.
   */
  async getCall(callId: string): Promise<{ status: string; duration?: number; transcript?: string }> {
    const response = await fetch(`${VAPI_BASE}/call/${callId}`, {
      method: "GET",
      headers: this.headers(),
    });

    if (!response.ok) {
      throw new Error(`Vapi get call failed: ${response.status}`);
    }

    const data = await response.json() as any;
    return {
      status: data.status,
      duration: data.duration,
      transcript: data.transcript,
    };
  }

  /**
   * End an active call.
   */
  async endCall(callId: string): Promise<void> {
    const response = await fetch(`${VAPI_BASE}/call/${callId}/end`, {
      method: "POST",
      headers: this.headers(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vapi end call failed: ${response.status} ${error}`);
    }
  }

  /**
   * Get the assistant configuration for a language.
   * The assistant is configured in the Vapi dashboard.
   * This method can be used to verify connectivity.
   */
  async getAssistant(): Promise<any> {
    const response = await fetch(`${VAPI_BASE}/assistant/${this.assistantId}`, {
      method: "GET",
      headers: this.headers(),
    });

    if (!response.ok) {
      throw new Error(`Vapi get assistant failed: ${response.status}`);
    }

    return response.json();
  }
}

let _client: VapiClient | null = null;

export function getVapiClient(): VapiClient {
  if (!_client) {
    _client = new VapiClient();
  }
  return _client;
}
