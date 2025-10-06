import { useState } from 'react';
import { useWorkflowStore } from '../store/workflow';
import { FormField, IfCondition } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { CloudCog, Trash, Workflow } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useNavigate } from 'react-router-dom';
interface sidePanelProps {
  workflowId: string
}

const SidePanel = ({workflowId}:sidePanelProps) => {
  const { nodes, edges,selectedNodeId, updateNode, deleteNode, resetWorkflow,getWorkflowState, changeTriggerType, startNodeId,getIncomingState } = useWorkflowStore();
    const navigate=useNavigate()

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  if (!selectedNode) {
    return;
  }

  const updateParameter = (key: string, value: any) => {
    updateNode(selectedNode.id, {
      parameters: {
        ...selectedNode.data.parameters,
        [key]: value
      }
    });
  };

  const handleDelete = () => {
    if (selectedNode.id === startNodeId) {
      resetWorkflow();

    } else {
      deleteNode(selectedNode.id);

    }
  }; 

  const renderTriggerEditor = () => {
    switch (selectedNode.data.kind) {
      case 'trigger.manual':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This trigger starts the workflow manually when executed.
            </p>
          </div>
        );

      case 'trigger.form':
        return <FormTriggerEditor node={selectedNode} updateParameter={updateParameter} workflowId={workflowId}/>;

      case 'trigger.cron':
        return <CronTriggerEditor node={selectedNode} updateParameter={updateParameter} />;

      default:
        return null;
    }
  };

  const renderActionEditor = () => {
    switch (selectedNode.data.kind) {
      case 'action.telegram':
        return <TelegramActionEditor node={selectedNode} updateParameter={updateParameter} />;

      case 'action.email':
        return <EmailActionEditor node={selectedNode} updateParameter={updateParameter} />;

      case 'action.llm':
        return <LLMActionEditor node={selectedNode} updateParameter={updateParameter} />;

      default:
        return null;
    }
  };

  const renderLogicEditor = () => {
    if (selectedNode.data.kind === 'logic.if') {
      return <IfLogicEditor node={selectedNode} updateParameter={updateParameter} />;
    }
    return null;
  };

  return (
    <div className="w-80 bg-workflow-node border-l border-border p-4 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {selectedNode.data.kind.replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h2>

          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  {/* onClick={handleDelete}> */}
                  <Trash />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    {selectedNode.id === startNodeId
                      ? "This is your start trigger. Deleting it will remove the entire workflow. Do you want to delete the entire workflow?"
                      : "Delete this node and its connections?"}

                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant='destructive' onClick={handleDelete}>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {selectedNode.data.kind.startsWith('action.') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/workflows/${workflowId}/edit/action/${selectedNode.id}`)}
                className="gap-2"
              >
                <Workflow className="h-4 w-4" />
                Action editor
              </Button>
            )}
          
          </div>
        </div>

        <Separator />

        

        <Separator />

        {selectedNode.data.kind.startsWith('trigger.') && renderTriggerEditor()}
        {selectedNode.data.kind.startsWith('action.') && renderActionEditor()}
        {selectedNode.data.kind.startsWith('logic.') && renderLogicEditor()}
      </div>
    </div>
  );
};

const FormTriggerEditor = ({ node, updateParameter,workflowId }: any) => {
  const [newField, setNewField] = useState<FormField>({ fieldLabel: '', requiredField: false });
    const navigate=useNavigate()


  const addField = () => {
    if (!newField.fieldLabel) return;

    const currentFields = node.data.parameters.formFields?.values || [];
    updateParameter('formFields', {
      values: [...currentFields, newField]
    });
    setNewField({ fieldLabel: '', requiredField: false });
  };

  const removeField = (index: number) => {
    const currentFields = node.data.parameters.formFields?.values || [];
    updateParameter('formFields', {
      values: currentFields.filter((_: any, i: number) => i !== index)
    });
  };

  return (
    // <div className="space-y-4">
    //   <div className="space-y-2">
    //     <Label>Form Title</Label>
    //     <Input
    //       value={node.data.parameters.formTitle || ''}
    //       onChange={(e) => updateParameter('formTitle', e.target.value)}
    //       placeholder="Enter form title"
    //     />
    //   </div>

    //   <div className="space-y-2">
    //     <Label>Form Description</Label>
    //     <Textarea
    //       value={node.data.parameters.formDescription || ''}
    //       onChange={(e) => updateParameter('formDescription', e.target.value)}
    //       placeholder="Enter form description"
    //       rows={3}
    //     />
    //   </div>

    //   <div className="space-y-2">
    //     <Label>Form Fields</Label>
    //     <div className="space-y-2">
    //       {(node.data.parameters.formFields?.values || []).map((field: FormField, index: number) => (
    //         <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
    //           <span className="flex-1 text-sm">{field.fieldLabel}</span>
    //           {field.requiredField && (
    //             <span className="text-xs text-destructive">Required</span>
    //           )}
    //           <Button
    //             variant="ghost"
    //             size="sm"
    //             onClick={() => removeField(index)}
    //           >
    //             ×
    //           </Button>
    //         </div>
    //       ))}
    //     </div>

    //     <div className="space-y-2 p-3 bg-muted rounded">
    //       <Input
    //         placeholder="Field label"
    //         value={newField.fieldLabel}
    //         onChange={(e) => setNewField({ ...newField, fieldLabel: e.target.value })}
    //       />
    //       <div className="flex items-center space-x-2">
    //         <Checkbox
    //           id="required"
    //           checked={newField.requiredField}
    //           onCheckedChange={(checked) => setNewField({ ...newField, requiredField: !!checked })}
    //         />
    //         <Label htmlFor="required">Required field</Label>
    //       </div>
    //       <Button onClick={addField} disabled={!newField.fieldLabel}>
    //         Add Field
    //       </Button>
    //     </div>
    //   </div>
    // </div>
     <div className="flex items-center space-x-2">

    
    <Button onClick={()=>navigate(`/form/${workflowId}`)}>
      Edit form
    </Button>
    <Button onClick={()=>navigate(`/form/live/${workflowId}/${node.id}`)} >
          View Live
         </Button>
    </div>
  );
};

const CronTriggerEditor = ({ node, updateParameter }: any) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>Cron Expression</Label>
      <Input
        value={node.data.parameters.cronExpression || ''}
        onChange={(e) => updateParameter('cronExpression', e.target.value)}
        placeholder="0 0 * * *"
      />
      <p className="text-xs text-muted-foreground">
        Format: minute hour day month weekday
      </p>
    </div>

    <div className="space-y-2">
      <Label>Timezone</Label>
      <Input
        value={node.data.parameters.timezone || 'UTC'}
        onChange={(e) => updateParameter('timezone', e.target.value)}
        placeholder="UTC"
      />
    </div>
  </div>
);

const TelegramActionEditor = ({ node, updateParameter }: any) => (
  <div className="space-y-4">
    
  </div>
);

const EmailActionEditor = ({ node, updateParameter }: any) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>To</Label>
      <Input
        value={node.data.parameters.to || ''}
        onChange={(e) => updateParameter('to', e.target.value)}
        placeholder="recipient@example.com"
      />
    </div>

    <div className="space-y-2">
      <Label>Subject</Label>
      <Input
        value={node.data.parameters.subject || ''}
        onChange={(e) => updateParameter('subject', e.target.value)}
        placeholder="Email subject"
      />
    </div>

    <div className="space-y-2">
      <Label>HTML Content</Label>
      <Textarea
        value={node.data.parameters.html || ''}
        onChange={(e) => updateParameter('html', e.target.value)}
        placeholder="HTML email content"
        rows={4}
      />
    </div>

    <div className="space-y-2">
      <Label>Text Content</Label>
      <Textarea
        value={node.data.parameters.text || ''}
        onChange={(e) => updateParameter('text', e.target.value)}
        placeholder="Plain text email content"
        rows={4}
      />
    </div>
  </div>
);

const LLMActionEditor = ({ node, updateParameter }: any) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>Provider</Label>
      <Select
        value={node.data.parameters.provider || 'openai'}
        onValueChange={(value) => updateParameter('provider', value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="openai">OpenAI</SelectItem>
          <SelectItem value="anthropic">Anthropic</SelectItem>
          <SelectItem value="gemini">Google Gemini</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label>Model</Label>
      <Input
        value={node.data.parameters.model || 'gpt-3.5-turbo'}
        onChange={(e) => updateParameter('model', e.target.value)}
        placeholder="gpt-3.5-turbo"
      />
    </div>

    <div className="space-y-2">
      <Label>Prompt</Label>
      <Textarea
        value={node.data.parameters.prompt || ''}
        onChange={(e) => updateParameter('prompt', e.target.value)}
        placeholder="Enter your prompt"
        rows={6}
      />
    </div>
  </div>
);

const IfLogicEditor = ({ node, updateParameter }: any) => {
  const conditions = node.data.parameters.conditions?.conditions || [];

  const addCondition = () => {
    const newCondition: IfCondition = {
      id: `condition_${Date.now()}`,
      leftValue: '',
      rightValue: '',
      operator: {
        type: 'string',
        operation: 'equals',
        name: 'equals'
      }
    };

    updateParameter('conditions', {
      ...node.data.parameters.conditions,
      conditions: [...conditions, newCondition]
    });
  };

  const removeCondition = (id: string) => {
    updateParameter('conditions', {
      ...node.data.parameters.conditions,
      conditions: conditions.filter((c: IfCondition) => c.id !== id)
    });
  };

  const updateCondition = (id: string, field: string, value: any) => {
    updateParameter('conditions', {
      ...node.data.parameters.conditions,
      conditions: conditions.map((c: IfCondition) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Conditions</Label>
          <Button onClick={addCondition} size="sm">Add Condition</Button>
        </div>

        {conditions.map((condition: IfCondition) => (
          <div key={condition.id} className="space-y-2 p-3 bg-muted rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Condition</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCondition(condition.id)}
              >
                ×
              </Button>
            </div>

            <Input
              placeholder="Left value"
              value={condition.leftValue}
              onChange={(e) => updateCondition(condition.id, 'leftValue', e.target.value)}
            />

            <Select
              value={condition.operator.operation}
              onValueChange={(value) => updateCondition(condition.id, 'operator', {
                ...condition.operator,
                operation: value,
                name: value
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="notEquals">Not Equals</SelectItem>
                <SelectItem value="gt">Greater Than</SelectItem>
                <SelectItem value="lt">Less Than</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Right value"
              value={condition.rightValue}
              onChange={(e) => updateCondition(condition.id, 'rightValue', e.target.value)}
            />
          </div>
        ))}
      </div>

      {conditions.length > 1 && (
        <div className="space-y-2">
          <Label>Combinator</Label>
          <Select
            value={node.data.parameters.conditions?.combinator || 'and'}
            onValueChange={(value) => updateParameter('conditions', {
              ...node.data.parameters.conditions,
              combinator: value
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="and">AND</SelectItem>
              <SelectItem value="or">OR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default SidePanel;