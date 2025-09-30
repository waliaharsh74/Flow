import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "./../components/ui/button"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./../components/ui/card"

import { formatDistanceToNow } from "date-fns"
import { credentialApi, workFlowApi } from "@/utils/api"
import { useToast } from "@/hooks/use-toast"
import { Credential, NodeKind } from '../types'
import ModifyCredentialDialog from "./ModifyCredentialDialog"



export default function CredentialsPane() {
    const [creds, setCreds] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [editKind, setEditKind] = useState<NodeKind | undefined>(undefined);
    const { toast } = useToast();

    const loadAll = useCallback(async () => {
        try {
            setLoading(true);
            const res = await credentialApi.getCredentials();
            setCreds(res?.credArr ?? []);
        } catch (e) {
            toast({ title: "Error", description: "Failed to load credentials", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);
    const openModify = (c: Credential) => {
        setEditId(c._id);
        setEditKind(c.kind);
        setEditOpen(true);
    };
    useEffect(() => { loadAll(); }, [loadAll]);

    if (loading) return <div className="text-center py-12 text-gray-600">Loading credentials...</div>;
    if (!creds.length) return <div className="text-center py-12 text-gray-600">No credentials found.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creds.map(c => (
                    <Card key={c._id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg truncate">{c.name}</CardTitle>
                            <CardDescription className="text-xs flex items-center justify-between">
                                {c.kind}
                                <span>
                                    Updated {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                                </span>

                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-xs text-gray-600 break-all">
                                <span className="font-semibold">ID:</span> {c._id}
                            </div>
                            <div className="flex items-center justify-between">
                                <Button variant="outline" size="sm" onClick={() => openModify(c)}>
                                    Modify
                                </Button>

                                <Button variant="destructive" size="sm" onClick={() => {/* TODO: delete endpoint */ }}>
                                    Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
               <ModifyCredentialDialog
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) { setEditId(null); setEditKind(undefined); }
        }}
        id={editId}
        kind={editKind}
        onUpdated={loadAll}  
      />
        </div>
    );
}
