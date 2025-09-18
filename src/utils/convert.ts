import { RFNode, RFEdge, WorkflowState, ExportSchema, ExportNode, ExportConnection } from '../types';
import { v4 as uuidv4 } from 'uuid';

const nodeKindToType: Record<string, string> = {
  'trigger.manual': 'n8n-nodes-base.manualTrigger',
  'trigger.form': 'n8n-nodes-base.formTrigger',
  'trigger.cron': 'n8n-nodes-base.cron',
  'logic.if': 'n8n-nodes-base.if',
  'action.telegram': 'n8n-nodes-base.telegram',
  'action.email': 'n8n-nodes-base.emailSend',
  'action.llm.openai': '@n8n/n8n-nodes-langchain.lmChatOpenAI',
  'action.llm.gemini': '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
  'action.llm.anthropic': '@n8n/n8n-nodes-langchain.lmChatAnthropic'
};

const typeToNodeKind: Record<string, string> = Object.fromEntries(
  Object.entries(nodeKindToType).map(([k, v]) => [v, k])
);

export const convertToExport = (state: WorkflowState, workflowName: string): ExportSchema => {
  const now = new Date().toISOString();
  
  // Convert nodes
  const exportNodes: ExportNode[] = state.nodes.map(node => {
    let nodeType = nodeKindToType[node.data.kind];
    
    // Handle LLM provider mapping
    if (node.data.kind === 'action.llm') {
      const provider = node.data.parameters.provider;
      nodeType = nodeKindToType[`action.llm.${provider}`] || nodeKindToType['action.llm.openai'];
    }

    return {
      id: node.id,
      name: node.data.parameters.name || node.id,
      type: nodeType,
      typeVersion: getTypeVersion(node.data.kind),
      position: [node.position.x, node.position.y],
      parameters: node.data.parameters,
      ...(node.data.credentials && { credentials: node.data.credentials }),
      ...(node.data.webhookId && { webhookId: node.data.webhookId })
    };
  });

  // Build connections map
  const connections: Record<string, { main: ExportConnection[][] }> = {};
  
  state.nodes.forEach(node => {
    const nodeName = node.data.parameters.name || node.id;
    const outgoingEdges = state.edges.filter(edge => edge.source === node.id);
    
    if (outgoingEdges.length === 0) {
      connections[nodeName] = { main: [] };
      return;
    }

    if (node.data.kind === 'logic.if') {
      // IF nodes have two output slots
      const trueEdges = outgoingEdges.filter(edge => edge.data?.slot === 0);
      const falseEdges = outgoingEdges.filter(edge => edge.data?.slot === 1);
      
      connections[nodeName] = {
        main: [
          trueEdges.map(edge => {
            const targetNode = state.nodes.find(n => n.id === edge.target);
            return {
              node: targetNode?.data.parameters.name || edge.target,
              type: 'main',
              index: 0
            };
          }),
          falseEdges.map(edge => {
            const targetNode = state.nodes.find(n => n.id === edge.target);
            return {
              node: targetNode?.data.parameters.name || edge.target,
              type: 'main',
              index: 0
            };
          })
        ]
      };
    } else {
      // Regular nodes have one output slot
      connections[nodeName] = {
        main: [
          outgoingEdges.map(edge => {
            const targetNode = state.nodes.find(n => n.id === edge.target);
            return {
              node: targetNode?.data.parameters.name || edge.target,
              type: 'main',
              index: 0
            };
          })
        ]
      };
    }
  });

  return {
    data: {
      createdAt: now,
      updatedAt: now,
      id: uuidv4(),
      name: workflowName,
      active: false,
      isArchived: false,
      nodes: exportNodes,
      connections,
      settings: {
        executionOrder: 'v1'
      },
      staticData: null,
      meta: {
        templateCredsSetupCompleted: true
      },
      pinData: {},
      versionId: uuidv4(),
      triggerCount: 0,
      tags: [],
      scopes: [
        'workflow:create',
        'workflow:delete', 
        'workflow:execute',
        'workflow:list',
        'workflow:move',
        'workflow:read',
        'workflow:share',
        'workflow:update'
      ]
    }
  };
};

export const convertFromExport = (schema: ExportSchema): WorkflowState => {
  const nodeIdMap = new Map<string, string>();
  
  // Convert nodes back
  const nodes: RFNode[] = schema.data.nodes.map(exportNode => {
    const newId = uuidv4();
    nodeIdMap.set(exportNode.name, newId);
    
    let kind = typeToNodeKind[exportNode.type];
    
    // Handle LLM type mapping back
    if (exportNode.type.includes('langchain.lmChat')) {
      kind = 'action.llm';
    }

    return {
      id: newId,
      type: 'workflow',
      position: { x: exportNode.position[0], y: exportNode.position[1] },
      data: {
        kind: kind as any,
        parameters: exportNode.parameters,
        ...(exportNode.credentials && { credentials: exportNode.credentials }),
        ...(exportNode.webhookId && { webhookId: exportNode.webhookId })
      }
    };
  });

  // Convert connections back to edges
  const edges: RFEdge[] = [];
  
  Object.entries(schema.data.connections).forEach(([sourceName, connectionData]) => {
    const sourceId = nodeIdMap.get(sourceName);
    if (!sourceId) return;

    const sourceNode = nodes.find(n => n.id === sourceId);
    if (!sourceNode) return;

    connectionData.main.forEach((outputSlot, slotIndex) => {
      outputSlot.forEach(connection => {
        const targetId = nodeIdMap.get(connection.node);
        if (!targetId) return;

        const edgeId = `${sourceId}-${targetId}`;
        const edge: RFEdge = {
          id: edgeId,
          source: sourceId,
          target: targetId,
          ...(sourceNode.data.kind === 'logic.if' && {
            sourceHandle: slotIndex.toString(),
            data: {
              slot: slotIndex as 0 | 1,
              label: slotIndex === 0 ? 'true' : 'false'
            }
          })
        };

        edges.push(edge);
      });
    });
  });

  // Find the start node (trigger)
  const startNode = nodes.find(node => node.data.kind.startsWith('trigger.'));

  return {
    nodes,
    edges,
    startNodeId: startNode?.id
  };
};

const getTypeVersion = (kind: string): number => {
  switch (kind) {
    case 'trigger.form':
      return 2.3;
    case 'trigger.manual':
      return 1.2;
    case 'trigger.cron':
      return 1.1;
    case 'logic.if':
      return 2.0;
    case 'action.telegram':
      return 1.2;
    case 'action.email':
      return 2.1;
    case 'action.llm':
      return 1.0;
    default:
      return 1.0;
  }
};