import { useState } from 'react';
import { useWorkflowStore } from '../store/workflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWorkflowsStore } from '@/store/worflows';
import { workFlowApi } from '../utils/api'

const TopBar = ({ workflowId }) => {
  const { workflowName, setWorkflowName, validate, importSchema } = useWorkflowStore();
  const { loadWorkflow, updateWorkflow } = useWorkflowsStore();
  const { toast } = useToast();

  const handleExport = async () => {
    try {

      const workflowData = loadWorkflow(workflowId);
      if (!workflowData) {
        toast({
          title: 'Error!',
          description: 'Workflow not found',
          variant: 'destructive'
        });
        return;
      }

      const result = await updateWorkflow(workflowId, {
        name: workflowData.name,
        description: workflowData.description,
        nodes: workflowData.nodes,
        edges: workflowData.edges,
        startNodeId: workflowData.startNodeId,
        isActive: workflowData.isActive,
      });      // await workFlowApi.saveWorflowDb(workflowId,name,description,nodes,edges,startNodeId,isActive)
      if (result.success) {
        toast({
          title: 'Saved!',
          description: 'Workflow saved successfully'
        });
      } else {
        toast({
          title: 'Error!',
          description: result.error || "Can't Save WorkFlow",
          variant: 'destructive'
        });
      }



    } catch (error) {
      console.log(error)
      toast({
        title: 'Error!',
        description: "Can't Save WorkFlow "
      });
    }




  };



  
  return (
    <>
      <div className="h-16 bg-workflow-node border-b border-border flex items-center px-6 gap-4">
        <div className="flex">
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="max-w-xs bg-transparent border-none text-lg font-semibold p-0 h-auto focus-visible:ring-0"
            placeholder="Workflow Name"
          />
        </div>

        <div className="flex items-center gap-2">
          
          <Button onClick={handleExport}>
            Save workflow
          </Button>
        </div>
      </div>

     
    </>
  );
};

export default TopBar;