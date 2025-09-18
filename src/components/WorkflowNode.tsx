import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { RFNodeData } from '../types';
import { useWorkflowStore } from '../store/workflow';

const getNodeIcon = (kind: string) => {
  if (kind.startsWith('trigger.')) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }
  if (kind.startsWith('action.')) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    );
  }
  if (kind === 'logic.if') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return null;
};

const getNodeColor = (kind: string) => {
  if (kind.startsWith('trigger.')) return 'bg-workflow-trigger text-white';
  if (kind.startsWith('action.')) return 'bg-workflow-action text-white';
  if (kind === 'logic.if') return 'bg-workflow-logic text-white';
  return 'bg-muted text-muted-foreground';
};

const getNodeTypeLabel = (kind: string) => {
  const labels: Record<string, string> = {
    'trigger.manual': 'Manual Trigger',
    'trigger.form': 'Form Trigger',
    'trigger.cron': 'Cron Trigger',
    'logic.if': 'IF Condition',
    'action.telegram': 'Telegram',
    'action.email': 'Email',
    'action.llm': 'LLM Chat'
  };
  return labels[kind] || kind;
};

const getParameterSummary = (kind: string, parameters: any) => {
  switch (kind) {
    case 'trigger.form':
      return `Form: ${parameters.formTitle || 'Untitled'}`;
    case 'trigger.cron':
      return `Schedule: ${parameters.cronExpression || '* * * * *'}`;
    case 'action.telegram':
      return `Chat: ${parameters.chatId || 'Not configured'}`;
    case 'action.email':
      return `To: ${parameters.to || 'Not configured'}`;
    case 'action.llm':
      return `${parameters.provider || 'openai'}: ${parameters.model || 'gpt-3.5-turbo'}`;
    case 'logic.if':
      const conditionsCount = parameters.conditions?.conditions?.length || 0;
      return `${conditionsCount} condition${conditionsCount !== 1 ? 's' : ''}`;
    default:
      return '';
  }
};

const WorkflowNode = memo(({ data, selected }: NodeProps<RFNodeData>) => {
  const { selectedNodeId } = useWorkflowStore();
  const isSelected = selected || selectedNodeId === data.parameters?.name;

  const nodeColor = getNodeColor(data.kind);
  const icon = getNodeIcon(data.kind);
  const typeLabel = getNodeTypeLabel(data.kind);
  const summary = getParameterSummary(data.kind, data.parameters);

  return (
    <div className={`
      bg-workflow-node border-2 rounded-lg shadow-lg min-w-[200px] 
      ${isSelected ? 'border-primary' : 'border-workflow-node-shadow'}
      hover:shadow-xl transition-all duration-200
    `}>
      {/* Input Handle - Not for triggers */}
      {!data.kind.startsWith('trigger.') && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-workflow-port border-2 border-white"
        />
      )}

      {/* Node Header */}
      <div className={`px-3 py-2 rounded-t-lg ${nodeColor} flex items-center gap-2`}>
        {icon}
        <span className="text-sm font-medium">{typeLabel}</span>
      </div>

      {/* Node Content */}
      <div className="p-3">
        <div className="font-medium text-sm text-foreground mb-1">
          {data.parameters?.name || 'Unnamed'}
        </div>
        {summary && (
          <div className="text-xs text-muted-foreground">
            {summary}
          </div>
        )}
      </div>

      {/* Output Handles */}
      {data.kind === 'logic.if' ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="0"
            style={{ top: '40%' }}
            className="w-3 h-3 bg-green-500 border-2 border-white"
          />
          <div className="absolute -right-12 top-[35%] text-xs text-green-600 font-medium">
            TRUE
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="1"
            style={{ top: '60%' }}
            className="w-3 h-3 bg-red-500 border-2 border-white"
          />
          <div className="absolute -right-12 top-[55%] text-xs text-red-600 font-medium">
            FALSE
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-workflow-port border-2 border-white"
        />
      )}
    </div>
  );
});

WorkflowNode.displayName = 'WorkflowNode';

export default WorkflowNode;