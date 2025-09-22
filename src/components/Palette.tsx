import { useState } from 'react';
import { useWorkflowStore } from '../store/workflow';
import { NodeKind, PaletteItem } from '../types';
import { actionItems, logicItems, triggerItems } from '@/Items-data';




const Palette = () => {
  const { nodes, addTrigger, addAction, addIf ,getWorkflowState} = useWorkflowStore();
  const [isOpen, setIsOpen] = useState(false);

  const hasTrigger = nodes.some(node => node.data.kind.startsWith('trigger.'));

  const handleAddItem = (item: PaletteItem) => {
    if (item.kind.startsWith('trigger.')) {
      addTrigger(item.kind as any);
    } else if (item.kind === 'logic.if') {
      addIf();
    } else {
      addAction(item.kind as any);
    }
    setIsOpen(false);
  };

  if (!hasTrigger) {
    return null; 
  }

  return (
    <div className="w-64 bg-workflow-node border-r border-border p-4">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Add Steps</h2>
      
 
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Logic
        </h3>
        <div className="space-y-2">
          {logicItems.map((item) => (
            <button
              key={item.kind}
              onClick={() => handleAddItem(item)}
              className="w-full p-3 bg-workflow-node hover:bg-muted rounded-lg border border-border transition-colors text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-workflow-logic text-white rounded-md group-hover:scale-110 transition-transform">
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
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Actions
        </h3>
        <div className="space-y-2">
          {actionItems.map((item) => (
            <button
              key={item.kind}
              onClick={() => handleAddItem(item)}
              className="w-full p-3 bg-workflow-node hover:bg-muted rounded-lg border border-border transition-colors text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-workflow-action text-white rounded-md group-hover:scale-110 transition-transform">
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
      </div>

      <div className="border-t border-border pt-4">
         <button
          onClick={() => setIsOpen(true)}
          className="w-full p-3 bg-workflow-trigger/10 hover:bg-workflow-trigger/20 rounded-lg border border-workflow-trigger/30 transition-colors text-left"
        >
          <div className="text-sm font-medium text-workflow-trigger">
            Change Trigger Type
          </div>
          <div className="text-xs text-workflow-trigger/70">
            Switch to different trigger
          </div>
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
                    useWorkflowStore.getState().changeTriggerType(item.kind as any);
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
};

export default Palette;