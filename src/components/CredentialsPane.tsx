import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "./../components/ui/button"
import { Input } from "./../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./../components/ui/card"

import { formatDistanceToNow } from "date-fns"
import { credentialApi, workFlowApi } from "@/utils/api"
import { useToast } from "@/hooks/use-toast"
import { Credential, NodeKind } from '../types'
import ModifyCredentialDialog from "./ModifyCredentialDialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { MoreVertical, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"



export default function CredentialsPane() {
    const [creds, setCreds] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [editKind, setEditKind] = useState<NodeKind | undefined>(undefined);
    const [search, setSearch] = useState("");
    const [kindFilter, setKindFilter] = useState<NodeKind | "all">("all");
    const [sortField, setSortField] = useState<"name" | "updatedAt" | "createdAt">("updatedAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(1);
    const perPage = 6;
    const { toast } = useToast();

    const handleDelete = useCallback(async (id) => {
            try {
                await credentialApi.deleteCredential(id);
                setCreds((existing) => existing.filter((credential) => credential._id !== id));
                toast({ title: "Deleted", description: "Credential deleted successfully" });
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Failed to delete credential";
                toast({ title: "Error", description: message, variant: "destructive" });
            }

        },[toast]);

    const loadAll = useCallback(async () => {
        try {
            setLoading(true);
            const res = await credentialApi.getCredentials();
            setCreds(res?.credArr ?? []);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to load credentials";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);
    const availableKinds = useMemo(() => Array.from(new Set(creds.map((c) => c.kind))), [creds]);

    const filteredCreds = useMemo(() => {
        const searchTerm = search.trim().toLowerCase();
        return creds
            .filter((credential) => {
                if (kindFilter !== "all" && credential.kind !== kindFilter) return false;
                if (!searchTerm) return true;
                return (
                    credential.name.toLowerCase().includes(searchTerm) ||
                    credential._id.toLowerCase().includes(searchTerm) ||
                    credential.kind.toLowerCase().includes(searchTerm)
                );
            })
            .sort((a, b) => {
                const direction = sortDirection === "asc" ? 1 : -1;
                switch (sortField) {
                    case "name":
                        return a.name.localeCompare(b.name) * direction;
                    case "createdAt":
                        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
                    case "updatedAt":
                    default:
                        return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * direction;
                }
            });
    }, [creds, kindFilter, search, sortDirection, sortField]);

    const totalPages = Math.max(1, Math.ceil(filteredCreds.length / perPage));
    const paginatedCreds = useMemo(
        () => filteredCreds.slice((page - 1) * perPage, page * perPage),
        [filteredCreds, page, perPage],
    );
    const hasCreds = useMemo(() => creds.length > 0, [creds]);
    const openModify = (c: Credential) => {
        setEditId(c._id);
        setEditKind(c.kind);
        setEditOpen(true);
    };
    useEffect(() => { loadAll(); }, [loadAll]);
    useEffect(() => { setPage(1); }, [search, kindFilter, sortField, sortDirection]);
    useEffect(() => { setPage((current) => Math.min(current, totalPages)); }, [totalPages]);

    if (loading) return <div className="text-center py-12 text-gray-600">Loading credentials...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search credentials"
                            className="pl-9"
                        />
                    </div>
                    <Select value={kindFilter} onValueChange={(value: NodeKind | "all") => setKindFilter(value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by kind" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All kinds</SelectItem>
                            {availableKinds.map((kind) => (
                                <SelectItem key={kind} value={kind}>{kind}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={sortField}
                        onValueChange={(value: "name" | "updatedAt" | "createdAt") => setSortField(value)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="updatedAt">Updated</SelectItem>
                            <SelectItem value="createdAt">Created</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Toggle credential sort direction"
                        onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
                    >
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>
                </div>
                <div className="text-sm text-gray-500">{filteredCreds.length} credentials found</div>
            </div>

            {hasCreds ? (
                filteredCreds.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedCreds.map(c => (
                            <Card key={c._id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg truncate">{c.name}</CardTitle>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleDelete(c._id)} className="text-destructive">
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
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


                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-600 border rounded-lg">No credentials match your filters.</div>
                )
            ) : (
                <div className="text-center py-12 text-gray-600">No credentials found.</div>
            )}

            {hasCreds && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
                    <span>
                        Showing {filteredCreds.length ? (page - 1) * perPage + 1 : 0}–
                        {Math.min(page * perPage, filteredCreds.length)} of {filteredCreds.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <span className="mx-1">Page {page} of {totalPages}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
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
