import { RFNode, RFEdge, WorkflowState, ValidationResult } from '../types';

export const validateWorkflow = (state: WorkflowState): ValidationResult => {
  const errors: string[] = [];
  
  // Check for exactly one trigger
  const triggers = state.nodes.filter(node => node.data.kind.startsWith('trigger.'));
  if (triggers.length === 0) {
    errors.push('Workflow must have exactly one trigger');
  } else if (triggers.length > 1) {
    errors.push('Workflow can only have one trigger');
  }

  // Check that all nodes are reachable from trigger
  if (state.startNodeId) {
    const reachableNodes = getReachableNodes(state.nodes, state.edges, state.startNodeId);
    const unreachableNodes = state.nodes.filter(node => 
      node.id !== state.startNodeId && !reachableNodes.has(node.id)
    );
    
    unreachableNodes.forEach(node => {
      errors.push(`Node "${node.data.parameters.name || node.id}" is not reachable from trigger`);
    });
  }

  // Check no edges target triggers
  const triggerTargets = state.edges.filter(edge => {
    const targetNode = state.nodes.find(n => n.id === edge.target);
    return targetNode?.data.kind.startsWith('trigger.');
  });
  
  if (triggerTargets.length > 0) {
    errors.push('Triggers cannot have incoming connections');
  }

  // Check IF nodes have both outputs
  const ifNodes = state.nodes.filter(node => node.data.kind === 'logic.if');
  ifNodes.forEach(ifNode => {
    const outgoingEdges = state.edges.filter(edge => edge.source === ifNode.id);
    const trueEdges = outgoingEdges.filter(edge => edge.data?.slot === 0);
    const falseEdges = outgoingEdges.filter(edge => edge.data?.slot === 1);
    
    if (trueEdges.length === 0) {
      errors.push(`IF node "${ifNode.data.parameters.name || ifNode.id}" missing TRUE output`);
    }
    if (falseEdges.length === 0) {
      errors.push(`IF node "${ifNode.data.parameters.name || ifNode.id}" missing FALSE output`);
    }
  });

  // Check for cycles
  if (hasCycles(state.nodes, state.edges)) {
    errors.push('Workflow contains cycles (loops are not allowed)');
  }

  return {
    ok: errors.length === 0,
    errors
  };
};

const getReachableNodes = (nodes: RFNode[], edges: RFEdge[], startId: string): Set<string> => {
  const visited = new Set<string>();
  const queue = [startId];
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    
    visited.add(currentId);
    
    // Find all nodes this one connects to
    const outgoingEdges = edges.filter(edge => edge.source === currentId);
    outgoingEdges.forEach(edge => {
      if (!visited.has(edge.target)) {
        queue.push(edge.target);
      }
    });
  }
  
  return visited;
};

const hasCycles = (nodes: RFNode[], edges: RFEdge[]): boolean => {
  const visited = new Set<string>();
  const inStack = new Set<string>();
  
  const dfs = (nodeId: string): boolean => {
    if (inStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    
    visited.add(nodeId);
    inStack.add(nodeId);
    
    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    for (const edge of outgoingEdges) {
      if (dfs(edge.target)) return true;
    }
    
    inStack.delete(nodeId);
    return false;
  };
  
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true;
    }
  }
  
  return false;
};

export const enforceSingleTrigger = (nodes: RFNode[], newKind: string): boolean => {
  const existingTriggers = nodes.filter(node => node.data.kind.startsWith('trigger.'));
  return !(newKind.startsWith('trigger.') && existingTriggers.length > 0);
};

export const canConnectNodes = (
  sourceNode: RFNode,
  targetNode: RFNode,
  sourceHandle?: string
): boolean => {
  // No edges into triggers
  if (targetNode.data.kind.startsWith('trigger.')) {
    return false;
  }

  // IF nodes need specific slot handling
  if (sourceNode.data.kind === 'logic.if') {
    return sourceHandle === '0' || sourceHandle === '1';
  }

  return true;
};