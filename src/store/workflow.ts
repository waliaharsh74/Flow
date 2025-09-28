import { create } from 'zustand';
import { RFNode, RFEdge, NodeKind, WorkflowState, ValidationResult, ExportSchema, RFNodeData } from '../types';
import { validateWorkflow } from '../utils/guards';
import { convertToExport, convertFromExport } from '../utils/convert';
import { v4 as uuidv4 } from 'uuid';
import {getIncomers } from "reactflow"



interface WorkflowStore extends WorkflowState {
  selectedNodeId: string | null;
  workflowName: string;
  
  setSelectedNode: (id: string | null) => void;
  setWorkflowName: (name: string) => void;
  addTrigger: (kind: Extract<NodeKind, 'trigger.manual' | 'trigger.form' | 'trigger.cron'>) => void;
  addAction: (kind: Exclude<NodeKind, `trigger.${string}`>) => void;
  addIf: () => void;
  updateNode: (id: string, patch: Partial<RFNode['data']>) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  connectEdge: (connection: { source: string; target: string; sourceHandle?: string }) => void;
  validate: () => ValidationResult;
  importSchema: (json: ExportSchema) => void;
  exportSchema: () => ExportSchema;
  resetWorkflow: () => void;
  changeTriggerType: (newKind: Extract<NodeKind, 'trigger.manual' | 'trigger.form' | 'trigger.cron'>) => void;
  setNode: (newNode:RFNode) => void,
  getWorkflowState:()=>WorkflowState,
  getIncomingState:(nodeId:string)=>RFNode<RFNodeData, string>[]
    
  

}

const createDefaultParameters = (kind: NodeKind): any => {
  switch (kind) {
    case 'trigger.manual':
      return { options: {} };
    case 'trigger.form':
      return {
        formTitle: 'New Form',
        formDescription: '',
        elements: [],
        options: {}
      };
    case 'trigger.cron':
      return {
        cronExpression: '0 0 * * *',
        timezone: 'UTC',
        options: {}
      };
    case 'logic.if':
      return {
        conditions: {
          options: {
            caseSensitive: false,
            leftValue: '',
            typeValidation: 'strict',
            version: 2
          },
          conditions: [],
          combinator: 'and'
        },
        options: {}
      };
    case 'action.telegram':
      return {
        resource: 'chat',
        chatId: '',
        options: {}
      };
    case 'action.email':
      return {
        to: '',
        subject: '',
        html: '',
        text: '',
        options: {}
      };
    case 'action.llm':
      return {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        prompt: '',
        vars: {},
        options: {}
      };
    default:
      return { options: {} };
  }
};

const generateNodeName = (kind: NodeKind, existingNodes: RFNode[]): string => {
  const baseName = kind.split('.')[1] || kind;
  const existingNames = existingNodes.map(n => n.data.parameters.name || n.id);
  
  let counter = 1;
  let name = baseName;
  
  while (existingNames.includes(name)) {
    name = `${baseName}${counter}`;
    counter++;
  }
  
  return name;
};

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  startNodeId: undefined,
  selectedNodeId: null,
  workflowName: 'My Workflow',

  getWorkflowState:()=>{
    const {nodes,edges,startNodeId,workflowName}=get()
    return {
      nodes, edges, startNodeId, workflowName
    }
  },

  setNode:(newNode)=>{
    const { nodes } = get();

    const newNodeArray=nodes
    const i = nodes.findIndex((prev)=>prev.id===newNode.id)
    newNodeArray[i]=newNode
    set(prevState=>({
      nodes:newNodeArray
    }))
  },
 

  setSelectedNode: (id) => set({ selectedNodeId: id }),
  
  setWorkflowName: (name) => set({ workflowName: name }),

  addTrigger: (kind) => {
    const { nodes } = get();
    
    if (nodes.some(node => node.data.kind.startsWith('trigger.'))) {
      return;
    }

    const id = uuidv4();
    const name = generateNodeName(kind, nodes);
    const parameters = createDefaultParameters(kind);
    parameters.name = name;

    const newNode: RFNode = {
      id,
      type: 'workflow',
      position: { x: 400, y: 200 },
      data: {
        kind,
        parameters,
        ...(kind === 'trigger.form' && { webhookId: uuidv4() })
      }
    };

    set(state => ({
      nodes: [...state.nodes, newNode],
      startNodeId: id
    }));
  },

  addAction: (kind) => {
    const { nodes } = get();
    const id = uuidv4();
    const name = generateNodeName(kind, nodes);
    const parameters = createDefaultParameters(kind);
    parameters.name = name;

    const newNode: RFNode = {
      id,
      type: 'workflow',
      position: { x: 400, y: 400 },
      data: {
        kind,
        parameters,
        ...(kind.startsWith('action.') && {
          credentials: {
            [kind === 'action.telegram' ? 'telegramApi' : 
              kind === 'action.email' ? 'resendApi' :
              kind === 'action.llm' ? `${parameters.provider}Api` : 'api']: {
              id: uuidv4(),
              name: `Default ${kind.split('.')[1]} credentials`
            }
          }
        }),
      }
    };

    set(state => ({
      nodes: [...state.nodes, newNode]
    }));
  },

  addIf: () => {
    const { nodes } = get();
    const id = uuidv4();
    const name = generateNodeName('logic.if', nodes);
    const parameters = createDefaultParameters('logic.if');
    parameters.name = name;

    const newNode: RFNode = {
      id,
      type: 'workflow',
      position: { x: 400, y: 400 },
      data: {
        kind: 'logic.if',
        parameters
      }
    };

    set(state => ({
      nodes: [...state.nodes, newNode]
    }));
  },

  updateNode: (id, patch) => {
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === id
          ? { ...node, data: { ...node.data, ...patch } }
          : node
      )
    }));
  },

  deleteNode: (id) => {
    const { nodes, edges, startNodeId } = get();
    
    if (id === startNodeId) {
      return; 
    }

    set(state => ({
      nodes: state.nodes.filter(node => node.id !== id),
      edges: state.edges.filter(edge => edge.source !== id && edge.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
    }));
  },

  deleteEdge: (id) => {
    set(state => ({
      edges: state.edges.filter(edge => edge.id !== id)
    }));
  },

  connectEdge: (connection) => {
    const id = `${connection.source}-${connection.target}`;
    
    const newEdge: RFEdge = {
      id,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      data: {
        slot: connection.sourceHandle ? parseInt(connection.sourceHandle) as 0 | 1 : undefined,
        label: connection.sourceHandle === '0' ? 'true' : 
        connection.sourceHandle === '1' ? 'false' : undefined
      }
    };

    set(state => ({
      edges: [...state.edges, newEdge]
    }));
  },

  validate: () => {
    const { nodes, edges, startNodeId } = get();
    return validateWorkflow({ nodes, edges, startNodeId });
  },

  importSchema: (json) => {
    const workflowState = convertFromExport(json);
    set({
      nodes: workflowState.nodes,
      edges: workflowState.edges,
      startNodeId: workflowState.startNodeId,
      workflowName: json.data.name,
      selectedNodeId: null
    });
  },

  exportSchema: () => {
    const { nodes, edges, startNodeId, workflowName } = get();
    return convertToExport({ nodes, edges, startNodeId }, workflowName);
  },

  resetWorkflow: () => {
    set({
      nodes: [],
      edges: [],
      startNodeId: undefined,
      selectedNodeId: null
    });
  },

  changeTriggerType: (newKind) => {
    const { startNodeId, nodes } = get();
    if (!startNodeId) return;

    const triggerNode = nodes.find(n => n.id === startNodeId);
    if (!triggerNode) return;

    const parameters = createDefaultParameters(newKind);
    parameters.name = triggerNode.data.parameters.name;

    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === startNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                kind: newKind,
                parameters,
                ...(newKind === 'trigger.form' && { webhookId: uuidv4() })
              }
            }
          : node
      )
    }));
  },
  getIncomingState: (nodeId) => {
    const { startNodeId, nodes,edges } = get();

    const triggerNode = nodes.find(n => n.id === nodeId);
    if (!triggerNode) return;
    const incomers=getIncomers(triggerNode,nodes,edges)
    return incomers

    
  }
  
}));