import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "./../components/ui/button"
import { Input } from "./../components/ui/input"
import { Label } from "./../components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./../components/ui/dialog"

import { Textarea } from "./../components/ui/textarea"

import { useToast } from "@/hooks/use-toast"
import { NodeKind ,Credential} from "@/types"
import { credentialApi } from "@/utils/api"

type ModifyCredentialDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  id: string | null;
  kind?: NodeKind;
  onUpdated?: () => void;
};

export default function ModifyCredentialDialog({ open, onOpenChange, id, kind, onUpdated }: ModifyCredentialDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cred, setCred] = useState<Credential | null>(null);

  const [name, setName] = useState("");
  const [dataJson, setDataJson] = useState("");

  useEffect(() => {
    let cancel = false;
    async function load() {
      if (!open || !id) return;
      try {
        setLoading(true);
        const res = await credentialApi.getCredentialById(id, kind);
        const c: Credential | undefined = res?.credDetails;
        if (!c) throw new Error("Not found");

        if (!cancel) {
          setCred(c);
          setName(c.name ?? "");
          setDataJson(JSON.stringify(c.data ?? {}, null, 2));
        }
      } catch (e) {
        toast({ title: "Error", description: "Failed to load credential", variant: "destructive" });
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => { cancel = true; };
  }, [open, id, kind, toast]);

  const handleSave = async () => {
    try {
      let parsed: Record<string, any> = {};
      if (dataJson.trim()) {
        try {
          parsed = JSON.parse(dataJson);
        } catch {
          toast({ title: "Invalid JSON", description: "Please fix the data JSON.", variant: "destructive" });
          return;
        }
      }

      if (!cred) return;



      toast({ title: "Ready to update", description: "Hook PUT /credentials/:id when available." });
      onOpenChange(false);
      onUpdated?.();
    } catch (e) {
      toast({ title: "Error", description: "Failed to update credential", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Modify Credential</DialogTitle>
          <DialogDescription>
            {cred ? `Editing ${cred.name}` : "Load & edit credential details."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading…</div>
        ) : cred ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
              <div><span className="font-semibold">ID:</span> {cred._id}</div>
              <div><span className="font-semibold">Kind:</span> {cred.kind}</div>
              <div><span className="font-semibold">Created:</span> {new Date(cred.createdAt).toLocaleString()}</div>
              <div><span className="font-semibold">Updated:</span> {new Date(cred.updatedAt).toLocaleString()}</div>
            </div>

            <div>
              <Label htmlFor="cred-name">Name</Label>
              <Input id="cred-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="cred-data">Data (JSON)</Label>
              <Textarea
                id="cred-data"
                rows={10}
                value={dataJson}
                onChange={(e) => setDataJson(e.target.value)}
                placeholder='{"apiKey":"sk-..."}'
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">No credential found.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
