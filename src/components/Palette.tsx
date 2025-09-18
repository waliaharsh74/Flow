import { useState } from 'react';
import { useWorkflowStore } from '../store/workflow';
import { NodeKind } from '../types';

interface PaletteItem {
  kind: NodeKind;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const triggerItems: PaletteItem[] = [
  {
    kind: 'trigger.manual',
    label: 'Manual Trigger',
    description: 'Start workflow manually',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    )
  },
  {
    kind: 'trigger.form',
    label: 'Form Trigger',
    description: 'Start with form submission',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    kind: 'trigger.cron',
    label: 'Cron Trigger',
    description: 'Start on schedule',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

const actionItems: PaletteItem[] = [
  {
    kind: 'action.telegram',
    label: 'Telegram',
    description: 'Send Telegram message',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    kind: 'action.email',
    label: 'Email',
    description: 'Send email message',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    kind: 'action.llm',
    label: 'LLM Chat',
    description: 'AI chat completion',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  }
];

const logicItems: PaletteItem[] = [
  {
    kind: 'logic.if',
    label: 'IF Condition',
    description: 'Branch based on condition',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

const Palette = () => {
  const { nodes, addTrigger, addAction, addIf } = useWorkflowStore();
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

\      <div className="mb-6">
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