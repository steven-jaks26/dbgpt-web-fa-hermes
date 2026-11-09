/**
 * ReAct Agent SSE Event Parser
 *
 * Parses SSE events from the DB-GPT ReAct Agent API and converts them
 * to the OpenCode MessagePart format for rendering.
 *
 * SSE Event Types from Backend:
 * - step.start: New ReAct step started { type, step, id, title, detail }
 * - step.chunk: Streaming chunk { type, id, output_type, content }
 * - step.meta: Step metadata { type, id, thought, action, action_input }
 * - step.done: Step completed { type, id, status }
 * - context.status: Context budget status { type, used, budget, ratio, state, compact_layer }
 * - final: Final answer { type, protocol_version, content, citations }
 * - done: Stream completed { type }
 */

import type { MessagePart, ReasoningPart, ToolPart, ToolStatus } from './react-agent-types';
import { decodeFinalEvent } from './react-agent-final';
import type { AgentCitation, AgentFinalAnswer } from './react-agent-final';

// SSE Event Types
export interface SSEStepStartEvent {
  type: 'step.start';
  step: number;
  id: string;
  title: string;
  detail: string;
}

export interface SSEStepChunkEvent {
  type: 'step.chunk';
  id: string;
  output_type: 'thought' | 'text' | 'chart' | string;
  content: any;
}

export interface SSEStepMetaEvent {
  type: 'step.meta';
  id: string;
  thought?: string;
  action?: string;
  action_input?: any;
  action_intention?: string;
  action_reason?: string;
}

export interface SSEStepDoneEvent {
  type: 'step.done';
  id: string;
  status: 'done' | 'failed';
}

export interface SSEFinalEvent {
  type: 'final';
  content: string;
  protocol_version?: number;
  citations?: unknown[];
}

export interface SSETaskPreviewEvent {
  type: 'task.preview';
  content: string;
  round?: number;
}

export interface SSEDoneEvent {
  type: 'done';
}

export interface SSEContextStatusEvent {
  type: 'context.status';
  used: number;
  budget: number;
  ratio: number;
  /** Backend sends lowercase ("normal","warning","error","critical","overflow");
   *  mapped to display states in handleContextStatus. */
  state: string;
  compact_layer?: string | null;
}

// ── Human-in-the-loop: question events ──────────────────────────────────────

export interface QuestionOption {
  label: string;
  description: string;
}

export interface QuestionInfo {
  question: string;
  header: string;
  options: QuestionOption[];
  multiple?: boolean;
  custom?: boolean;
}

export interface SSEQuestionAskedEvent {
  type: 'question.asked';
  request_id: string;
  conv_id: string;
  questions: QuestionInfo[];
}

export interface SSEQuestionRepliedEvent {
  type: 'question.replied';
  request_id: string;
}

export interface SSEQuestionRejectedEvent {
  type: 'question.rejected';
  request_id: string;
}

export type SSEEvent =
  | SSEStepStartEvent
  | SSEStepChunkEvent
  | SSEStepMetaEvent
  | SSEStepDoneEvent
  | SSEContextStatusEvent
  | SSEQuestionAskedEvent
  | SSEQuestionRepliedEvent
  | SSEQuestionRejectedEvent
  | SSEFinalEvent
  | SSETaskPreviewEvent
  | SSEDoneEvent;

// Internal state for tracking context budget
export interface ContextStatus {
  used: number;
  budget: number;
  ratio: number;
  state: 'OK' | 'WARNING' | 'ERROR';
  compactLayer?: string | null;
}

export interface ReActStatusInfo {
  kind: 'executing' | 'processing' | 'completed' | 'thinking';
  /** Exact backend action name. It is never translated or normalized. */
  action?: string;
}

// Internal state for tracking steps
interface StepState {
  id: string;
  tool: string;
  status: ToolStatus;
  thought?: string;
  action?: string;
  actionInput?: any;
  actionIntention?: string;
  actionReason?: string;
  output: string[];
  error?: string;
}

/**
 * ReAct SSE Parser State
 * Manages the state of the ReAct streaming session
 */
export class ReActSSEState {
  private steps: Map<string, StepState> = new Map();
  private stepOrder: string[] = [];
  private finalAnswer: AgentFinalAnswer = { content: '', citations: [] };
  private isDone: boolean = false;
  private startTime: number;
  private endTime?: number;
  private _contextStatus: ContextStatus | null = null;
  private _pendingQuestion: SSEQuestionAskedEvent | null = null;
  private _taskPreview: string | null = null;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Process an SSE event and update internal state
   */
  processEvent(event: SSEEvent): void {
    switch (event.type) {
      case 'step.start':
        this.handleStepStart(event);
        break;
      case 'step.chunk':
        this.handleStepChunk(event);
        break;
      case 'step.meta':
        this.handleStepMeta(event);
        break;
      case 'step.done':
        this.handleStepDone(event);
        break;
      case 'context.status':
        this.handleContextStatus(event);
        break;
      case 'question.asked':
        this._pendingQuestion = event;
        break;
      case 'question.replied':
      case 'question.rejected':
        this._pendingQuestion = null;
        break;
      case 'final':
        this.handleFinal(event);
        break;
      case 'task.preview':
        if (!this._taskPreview) {
          this._taskPreview = event.content;
        }
        break;
      case 'done':
        this.handleDone();
        break;
    }
  }

  /**
   * Get the current pending question (null if none)
   */
  getPendingQuestion(): SSEQuestionAskedEvent | null {
    return this._pendingQuestion;
  }

  private handleStepStart(event: SSEStepStartEvent): void {
    const existing = this.steps.get(event.id);
    if (existing) {
      // Backend sends two step.start for the same id ("思考中" + real title).
      // Update tool name but don't duplicate in stepOrder.
      existing.tool = this.mapTitleToTool(event.title);
      return;
    }
    const step: StepState = {
      id: event.id,
      tool: this.mapTitleToTool(event.title),
      status: 'running',
      output: [],
    };
    this.steps.set(event.id, step);
    this.stepOrder.push(event.id);
  }

  private handleStepChunk(event: SSEStepChunkEvent): void {
    const step = this.steps.get(event.id);
    if (!step) return;

    if (event.output_type === 'thought') {
      // Accumulate thought content
      step.thought = (step.thought || '') + event.content;
    } else {
      // Accumulate output content
      const content = typeof event.content === 'string' ? event.content : JSON.stringify(event.content, null, 2);
      step.output.push(content);
    }
  }

  private handleStepMeta(event: SSEStepMetaEvent): void {
    const step = this.steps.get(event.id);
    if (!step) return;

    if (event.thought) step.thought = event.thought;
    if (event.action) {
      step.action = event.action;
      step.tool = this.mapActionToTool(event.action);
    }
    if (event.action_input !== undefined) {
      step.actionInput = event.action_input;
    }
    if (event.action_intention) step.actionIntention = event.action_intention;
    if (event.action_reason) step.actionReason = event.action_reason;
  }

  private handleStepDone(event: SSEStepDoneEvent): void {
    const step = this.steps.get(event.id);
    if (!step) return;

    step.status = event.status === 'done' ? 'completed' : 'error';
    if (event.status === 'failed') {
      step.error = 'step_execution_failed';
    }
  }

  private handleFinal(event: SSEFinalEvent): void {
    this.finalAnswer = decodeFinalEvent(event);
  }

  private handleDone(): void {
    this.isDone = true;
    this.endTime = Date.now();
  }

  private handleContextStatus(event: SSEContextStatusEvent): void {
    if (!Number.isFinite(event.budget) || event.budget <= 0) {
      this._contextStatus = null;
      return;
    }
    // Map backend state values (lowercase: "normal", "warning", "error",
    // "critical", "overflow") to frontend display states ("OK", "WARNING", "ERROR").
    const stateMap: Record<string, 'OK' | 'WARNING' | 'ERROR'> = {
      normal: 'OK',
      warning: 'WARNING',
      error: 'ERROR',
      critical: 'ERROR',
      overflow: 'ERROR',
      // Also accept the frontend format directly (idempotent)
      OK: 'OK',
      WARNING: 'WARNING',
      ERROR: 'ERROR',
    };
    const mappedState = stateMap[event.state] || 'OK';

    this._contextStatus = {
      used: event.used,
      budget: event.budget,
      ratio: event.ratio,
      state: mappedState,
      compactLayer: event.compact_layer,
    };
  }

  /**
   * Get latest context budget status (null if none received yet)
   */
  getContextStatus(): ContextStatus | null {
    return this._contextStatus;
  }

  /**
   * Map ReAct step title to OpenCode tool name
   */
  private mapTitleToTool(title: string): string {
    const lowerTitle = title.toLowerCase();

    // Map common tool names
    if (lowerTitle.includes('load_skill')) return 'skill';
    if (lowerTitle.includes('select_skill')) return 'question';
    if (lowerTitle.includes('load_file')) return 'read';
    if (lowerTitle.includes('execute_analysis')) return 'bash';
    if (lowerTitle.includes('load_tools')) return 'list';
    if (lowerTitle.includes('execute_tool')) return 'bash';
    if (lowerTitle.includes('terminate')) return 'task';
    if (lowerTitle.includes('react round')) return 'task';

    // Knowledge base tools — keep the action name as the tool type
    if (lowerTitle.startsWith('kb_') || lowerTitle.startsWith('semantic_search')) {
      return lowerTitle;
    }

    return 'task'; // Default tool
  }

  /**
   * Map ReAct action name to OpenCode tool name
   */
  private mapActionToTool(action: string): string {
    const lowerAction = action.toLowerCase();

    // Knowledge base tools — keep the action name as the tool type so the
    // frontend can render the real tool name (kb_ls, kb_grep, kb_cat, ...).
    if (lowerAction.startsWith('kb_') || lowerAction === 'semantic_search') {
      return lowerAction;
    }

    // Map common actions to OpenCode tool types
    const actionMap: Record<string, string> = {
      load_skills: 'list',
      select_skill: 'question',
      load_skill: 'skill',
      load_file: 'read',
      execute_analysis: 'bash',
      load_tools: 'list',
      execute_tool: 'bash',
      terminate: 'task',
      // Add more mappings as needed
      read: 'read',
      write: 'write',
      edit: 'edit',
      search: 'grep',
      grep: 'grep',
      glob: 'glob',
      bash: 'bash',
      webfetch: 'webfetch',
    };

    return actionMap[lowerAction] || 'task';
  }

  /**
   * Convert current state to OpenCode MessagePart array
   */
  toMessageParts(failedMessage = 'Step execution failed'): MessagePart[] {
    const parts: MessagePart[] = [];

    for (const stepId of this.stepOrder) {
      const step = this.steps.get(stepId);
      if (!step) continue;

      // Skip terminate action — its output is shown as finalContent, not as a step card
      if (step.action && step.action.toLowerCase() === 'terminate') {
        // If terminate has output and we don't yet have finalContent, use it
        if (!this.finalAnswer.content && step.output.length > 0) {
          this.finalAnswer = decodeFinalEvent(step.output.join('\n'));
        } else if (
          !this.finalAnswer.content &&
          step.actionInput &&
          typeof step.actionInput === 'object' &&
          typeof step.actionInput.output === 'string'
        ) {
          this.finalAnswer = decodeFinalEvent(step.actionInput.output);
        }
        continue;
      }

      // Add thinking/reasoning part if available
      if (step.thought) {
        parts.push({
          id: `${stepId}-reasoning`,
          type: 'reasoning',
          text: step.thought,
        } as ReasoningPart);
      }

      // Add tool part
      const toolPart: ToolPart = {
        id: stepId,
        type: 'tool',
        tool: step.tool,
        state: {
          status: step.status,
          input: step.actionInput
            ? typeof step.actionInput === 'object'
              ? step.actionInput
              : { value: step.actionInput }
            : undefined,
          output: step.output.length > 0 ? step.output.join('\n') : undefined,
          error: step.error === 'step_execution_failed' ? failedMessage : step.error,
          metadata:
            step.action || step.actionIntention
              ? {
                  action: step.action,
                  intention: step.actionIntention,
                  reason: step.actionReason,
                }
              : undefined,
        },
      };
      parts.push(toolPart);
    }

    return parts;
  }

  /**
   * Get final assistant message
   */
  getFinalContent(): string {
    return this.finalAnswer.content;
  }

  /** Get the canonical final answer, including structured citations. */
  getFinalAnswer(): AgentFinalAnswer {
    return {
      content: this.finalAnswer.content,
      citations: [...this.finalAnswer.citations],
    };
  }

  /** Get structured citations attached to the final answer. */
  getCitations(): AgentCitation[] {
    return [...this.finalAnswer.citations];
  }

  /**
   * Get the one-time task preview ("Plan: ...") if the model emitted one.
   */
  getTaskPreview(): string | null {
    return this._taskPreview;
  }

  /**
   * Check if stream is complete
   */
  isComplete(): boolean {
    return this.isDone;
  }

  /**
   * Check if still working (has running steps or not done)
   */
  isWorking(): boolean {
    if (this.isDone) return false;

    for (const step of this.steps.values()) {
      if (step.status === 'running' || step.status === 'pending') {
        return true;
      }
    }

    return !this.isDone;
  }

  /**
   * Get start time
   */
  getStartTime(): number {
    return this.startTime;
  }

  /**
   * Get end time (if complete)
   */
  getEndTime(): number | undefined {
    return this.endTime;
  }

  /**
   * Get current status text for display
   */
  getCurrentStatusInfo(): ReActStatusInfo {
    // Find the last running step
    for (let i = this.stepOrder.length - 1; i >= 0; i--) {
      const step = this.steps.get(this.stepOrder[i]);
      if (step && step.status === 'running') {
        if (step.action) {
          return { kind: 'executing', action: step.action };
        }
        return { kind: 'processing' };
      }
    }

    if (this.isDone) return { kind: 'completed' };
    return { kind: 'thinking' };
  }

  /** Backwards-compatible English display formatter. UI hooks localize status. */
  getCurrentStatus(): string {
    const status = this.getCurrentStatusInfo();
    if (status.kind === 'executing') return `Executing ${status.action}...`;
    if (status.kind === 'processing') return 'Processing...';
    if (status.kind === 'completed') return 'Completed';
    return 'Thinking...';
  }
}

/**
 * Parse a single SSE data line
 */
export function parseSSELine(line: string): SSEEvent | null {
  // SSE permits both `data:value` and `data: value`.
  if (!line.startsWith('data:')) {
    return null;
  }

  const jsonStr = line.slice('data:'.length).trimStart();
  if (!jsonStr) {
    return null;
  }

  try {
    return JSON.parse(jsonStr) as SSEEvent;
  } catch (e) {
    console.error('Failed to parse SSE event:', jsonStr, e);
    return null;
  }
}

/**
 * Parse multiple SSE lines (split by \n\n)
 */
export function parseSSEChunk(chunk: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const lines = chunk.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('data:')) {
      const event = parseSSELine(trimmedLine);
      if (event) {
        events.push(event);
      }
    }
  }

  return events;
}

/**
 * Split the canonical English ReAct history label from its final payload.
 * The returned final content is not trimmed, translated, or otherwise changed.
 */
export function splitStoredReActFinal(content: string): {
  reactContent: string;
  finalContent?: string;
} {
  // `formatReActResponse` writes this exact two-newline boundary. Requiring the
  // full boundary avoids treating ordinary prose or a single code line as the
  // protocol delimiter.
  const marker = /(?:^|\n\n)Final Answer:/g;
  let lastMatch: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;
  while ((match = marker.exec(content)) !== null) lastMatch = match;
  if (!lastMatch) return { reactContent: content };

  const payloadStart = lastMatch.index + lastMatch[0].length;
  const rawFinal = content.slice(payloadStart);
  return {
    reactContent: content.slice(0, lastMatch.index),
    finalContent: rawFinal.startsWith(' ') ? rawFinal.slice(1) : rawFinal,
  };
}

/**
 * Create a new ReAct SSE state instance
 */
export function createReActSSEState(): ReActSSEState {
  return new ReActSSEState();
}
