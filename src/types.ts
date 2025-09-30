import { Node, Edge } from 'reactflow';

export type NodeKind = 
  | 'trigger.manual'
  | 'trigger.form' 
  | 'trigger.cron'
  | 'logic.if'
  | 'action.telegram'
  | 'action.email'
  | 'action.llm';

export type AppState = "loading" | "auth" | "dashboard" | "editor" | "authenticated"

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
export interface Credential {
  _id: string;
  user: string; 
  name: string;
  kind: NodeKind;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface RFNodeData {
  kind: NodeKind;
  parameters: any;
  credentials?: string | Credential;
  webhookId?: string;
  toolBar?:any
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
  credentials?:  string | Credential;
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
export interface PaletteItem {
  kind: NodeKind;
  label: string;
  description: string;
  icon: React.ReactNode;
}



export type FormSchema = {
    title: string;
    description?: string;
    elements: FormElement[];
    name: "form"
};

export type BaseElement = {
    id: string;
    fieldName: string;
    type: "text" | "password" | "textarea" | "number" | "date" | "radio" | "checkbox" | "file";
    required?: boolean;
    placeholder?: string;
};

export type RadioOption = { id: string; label: string; value: string };

export type RadioElement = BaseElement & {
    type: "radio";
    options: RadioOption[];
};

export type CheckboxElement = BaseElement & {
    type: "checkbox";
};

export type FileElement = BaseElement & {
    type: "file";
    multiple?: boolean;
    accept?: string;
};

export type TextElement = BaseElement & { type: "text" | "password" | "textarea" | "number" };
export type DateElement = BaseElement & { type: "date" };

export type FormElement = RadioElement | CheckboxElement | FileElement | TextElement | DateElement;

export type FormValues = Record<string, any>;