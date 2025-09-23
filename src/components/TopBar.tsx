import { useState } from 'react';
import { useWorkflowStore } from '../store/workflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const TopBar = () => {
  const { workflowName, setWorkflowName, validate, exportSchema, importSchema } = useWorkflowStore();
  const [isImporting, setIsImporting] = useState(false);
  const [importJson, setImportJson] = useState('');
  const { toast } = useToast();

  const handleExport = () => {
    // const validation = validate();
    // if (!validation.ok) {
    //   toast({
    //     title: 'Export Failed',
    //     description: `Please fix these issues first: ${validation.errors.join(', ')}`,
    //     variant: 'destructive'
    //   });
    //   return;
    // }

    const schema = exportSchema();
    localStorage.setItem("localState",JSON.stringify(schema))
    // const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = `${workflowName.toLowerCase().replace(/\s+/g, '-')}.json`;
    // document.body.appendChild(a);
    // a.click();
    // document.body.removeChild(a);
    // URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'Workflow exported successfully'
    });
  };

  const handleImport = () => {
    try {
      // const schema = JSON.parse(importJson);
      const schema=localStorage.getItem("localState")
      importSchema(JSON.parse(schema));
      setIsImporting(false);
      setImportJson('');
      
      toast({
        title: 'Import Successful',
        description: 'Workflow imported successfully'
      });
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Invalid JSON format',
        variant: 'destructive'
      });
    }
  };

  const handleValidate = () => {
    const validation = validate();
    if (validation.ok) {
      toast({
        title: 'Validation Passed',
        description: 'Workflow is valid and ready for export'
      });
    } else {
      toast({
        title: 'Validation Failed',
        description: validation.errors.join(', '),
        variant: 'destructive'
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
          {/* <Button variant="outline" onClick={() => setIsImporting(true)}>
            Import
          </Button> */}
          {/* <Button variant="outline" onClick={() => handleImport()}>
            Load workflow
          </Button>
          <Button variant="outline" onClick={handleValidate}>
            Validate
          </Button>
          <Button onClick={handleExport}>
            Save workflow
          </Button> */}
        </div>
      </div>

      {/* Import Modal */}
      {isImporting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-workflow-node rounded-lg shadow-xl p-6 w-[600px] max-w-[90vw] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Import Workflow</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Paste n8n workflow JSON:</Label>
                <textarea
                  className="w-full h-64 p-3 bg-muted border border-border rounded-md font-mono text-sm resize-none"
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder="Paste your n8n workflow JSON here..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setIsImporting(false);
                    setImportJson('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!importJson.trim()}
                  className="flex-1"
                >
                  Import
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopBar;