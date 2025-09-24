import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from '../store/workflow';
import { RFNode, RFEdge } from '../types';
import WorkflowNode from './WorkflowNode';
import { triggerItems } from '@/Items-data';

const nodeTypes = {
  workflow: WorkflowNode,
};

const WorkflowBuilder = () => {
  const {
    nodes,
    edges,
    selectedNodeId,
    setSelectedNode,
    connectEdge,
    validate,
    setNode
  } = useWorkflowStore();
    const [isOpen, setIsOpen] = useState(false);  

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges);

  useMemo(() => {
    setRfNodes(nodes);
  }, [nodes, setRfNodes]);

  useMemo(() => {
    setRfEdges(edges);
  }, [edges, setRfEdges]);

  const onConnect = useCallback((params: Connection | Edge) => {
    if (!params.source || !params.target) return;

    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    
    if (!sourceNode || !targetNode) return;

    if (targetNode.data.kind.startsWith('trigger.')) {
      return;
    }

    const validation = validate();
    if (!validation.ok) {
      const tempEdges = [...edges, {
        id: `${params.source}-${params.target}`,
        source: params.source!,
        target: params.target!,
        sourceHandle: params.sourceHandle,
        data: {
          slot: params.sourceHandle ? parseInt(params.sourceHandle) as 0 | 1 : undefined,
          label: params.sourceHandle === '0' ? 'true' : 
        params.sourceHandle === '1' ? 'false' : undefined
        }
      }];
      
      const hasCycle = tempEdges.some(edge => {
        return edge.source === params.target && edge.target === params.source;
      });
      
      if (hasCycle) {
        console.warn('Connection would create a cycle');
        return;
      }
    }

    connectEdge({
      source: params.source!,
      target: params.target!,
      sourceHandle: params.sourceHandle || undefined
    });
  }, [nodes, edges, connectEdge, validate]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, [setSelectedNode]);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node:Node)=>{
    setNode(node)
  }, [setNode])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const defaultEdgeOptions = {
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: 'hsl(var(--workflow-edge))',
    },
    style: {
      strokeWidth: 2,
      stroke: 'hsl(var(--workflow-edge))',
    },
  };

  if (nodes.length === 0) {
    return (
      <div className="flex-1 bg-workflow-canvas flex items-center justify-center">
        <div className="bg-workflow-node rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-workflow-trigger rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-foreground">Start Building Your Workflow</h3>
          <p className="text-muted-foreground mb-6">Begin by adding a trigger to start your automation</p>
          <button 
            onClick={() => setIsOpen(true)}
            className="bg-workflow-trigger hover:bg-workflow-trigger/90 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Add Trigger
          </button>
        </div>
         {isOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-workflow-node rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Select Trigger Type</h3>
                  <div className="space-y-2 mb-6">
                    {triggerItems.map((item) => (
                      <button
                        key={item.kind}
                        onClick={() => {
                          // useWorkflowStore.getState().addTrigger('trigger.manual')
                          useWorkflowStore.getState().addTrigger(item.kind as any);
                          setIsOpen(false);
                        }}
                        className="w-full p-3 bg-workflow-node hover:bg-muted rounded-lg border border-border transition-colors text-left group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-workflow-trigger text-white rounded-md">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground">
                              {item.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
      </div>
    );
  }

  return (
    <div className="flex-1 bg-workflow-canvas">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
      >
        <Background color="hsl(var(--muted-foreground))" gap={16} />
        <Controls 
          className="bg-workflow-node border border-border shadow-lg rounded-lg"
        />
        <MiniMap
          className="bg-workflow-node border border-border shadow-lg rounded-lg"
          nodeColor={(node) => {
            const rfNode = node as RFNode;
            if (rfNode.data.kind.startsWith('trigger.')) return 'hsl(var(--workflow-trigger))';
            if (rfNode.data.kind.startsWith('action.')) return 'hsl(var(--workflow-action))';
            if (rfNode.data.kind === 'logic.if') return 'hsl(var(--workflow-logic))';
            return 'hsl(var(--muted))';
          }}
        />
      </ReactFlow>
     
    </div>
  );
};

export default WorkflowBuilder;