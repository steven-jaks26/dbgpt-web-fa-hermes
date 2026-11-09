/** Protocol-neutral view models used by the ReAct stream and renderer. */
export type ToolStatus = 'pending' | 'running' | 'completed' | 'error';

export interface ToolPart {
  id: string;
  type: 'tool';
  tool: string;
  callID?: string;
  state: {
    status: ToolStatus;
    input?: Record<string, unknown>;
    output?: string;
    error?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface TextPart {
  id: string;
  type: 'text';
  text: string;
  synthetic?: boolean;
}

export interface ReasoningPart {
  id: string;
  type: 'reasoning';
  text: string;
}

export type MessagePart = ToolPart | TextPart | ReasoningPart;
