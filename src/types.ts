import { Node, Edge } from 'reactflow';

export type NodeKind = 
  | 'trigger.manual'
  | 'trigger.form' 
  | 'trigger.cron'
  | 'logic.if'
  | 'action.telegram'
  | 'action.email'
  | 'action.llm';

export interface FormField {
  fieldLabel: string;
  requiredField?: boolean;
}

export interface IfCondition {
  id: string;
  leftValue: string;
  rightValue: string;
  operator: {
    type: 'string' | 'number' | 'boolean' | 'dateTime' | 'any';
    operation: 'equals' | 'gt' | 'lt' | 'gte' | 'lte' | 'notEquals' | 'contains';
    name: string;
  };
}

export interface RFNodeData {
  kind: NodeKind;
  parameters: any;
  credentials?: Record<string, { id: string; name: string }>;
  webhookId?: string;
}

export interface RFNode extends Node {
  data: RFNodeData;
}

export interface RFEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  data?: {
    slot?: 0 | 1;
    label?: 'true' | 'false';
  };
}

export interface WorkflowState {
  nodes: RFNode[];
  edges: RFEdge[];
  startNodeId?: string;
}

export interface ExportConnection {
  node: string;
  type: 'main';
  index: number;
}

export interface ExportNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: any;
  credentials?: Record<string, { id: string; name: string }>;
  webhookId?: string;
}

export interface ExportSchema {
  data: {
    createdAt: string;
    updatedAt: string;
    id: string;
    name: string;
    active: boolean;
    isArchived: boolean;
    nodes: ExportNode[];
    connections: Record<string, { main: ExportConnection[][] }>;
    settings: {
      executionOrder: string;
    };
    staticData: null;
    meta: {
      templateCredsSetupCompleted: boolean;
    };
    pinData: Record<string, any>;
    versionId: string;
    triggerCount: number;
    tags: any[];
    scopes: string[];
  };
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}