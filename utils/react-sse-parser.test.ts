import assert from 'node:assert/strict';
import test from 'node:test';

import { ReActSSEState, parseSSELine, splitStoredReActFinal } from './react-sse-parser';

test('accepts SSE data lines with or without a space', () => {
  assert.deepEqual(parseSSELine('data:{"type":"done"}'), { type: 'done' });
  assert.deepEqual(parseSSELine('data: {"type":"done"}'), { type: 'done' });
});

test('preserves action names, JSON keys, SQL, paths and IDs', () => {
  const state = new ReActSSEState();
  const actionInput = {
    database_name: 'prod',
    query: 'SELECT order_id FROM sales WHERE total = 100.25;',
    request_id: '550e8400-e29b-41d4-a716-446655440000',
    file_path: '/srv/data/report.csv',
  };
  state.processEvent({ type: 'step.start', step: 1, id: 'step_1', title: 'sql_query', detail: '' });
  state.processEvent({ type: 'step.meta', id: 'step_1', action: 'sql_query', action_input: actionInput });
  state.processEvent({
    type: 'step.chunk',
    id: 'step_1',
    output_type: 'text',
    content: '{"order_id":1042,"total":100.25}',
  });
  state.processEvent({ type: 'step.done', id: 'step_1', status: 'done' });

  const part = state.toMessageParts('اجرای گام ناموفق بود')[0];
  assert.equal(part.type, 'tool');
  if (part.type !== 'tool') throw new Error('expected tool part');
  assert.equal(part.state.metadata?.action, 'sql_query');
  assert.deepEqual(part.state.input, actionInput);
  assert.equal(part.state.output, '{"order_id":1042,"total":100.25}');
});

test('keeps the Persian final answer and technical blocks unchanged', () => {
  const state = new ReActSSEState();
  const content =
    'نتیجه آماده است.\n```sql\nSELECT * FROM sales WHERE id = 1042;\n```\n/srv/data/report.csv';
  state.processEvent({ type: 'final', content });
  state.processEvent({ type: 'done' });

  assert.equal(state.getFinalContent(), content);
  assert.deepEqual(state.getCurrentStatusInfo(), { kind: 'completed' });
});

test('splits stored English protocol label without changing Persian final content', () => {
  const finalContent =
    'نتیجه\n```python\nprint("id_1042")\n```\npath=/srv/data/report.csv';
  const stored = `Thought: inspect\nAction: sql_query\nAction Input: {"query":"SELECT 1"}\n\nFinal Answer: ${finalContent}`;

  const split = splitStoredReActFinal(stored);

  assert.equal(split.reactContent.includes('Action: sql_query'), true);
  assert.equal(split.finalContent, finalContent);
});
