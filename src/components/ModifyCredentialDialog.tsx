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
import { NodeKind, Credential } from "@/types"
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
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [dataJson, setDataJson] = useState("");
    const [form, setForm] = useState<{
        name: string;
        email?: string;
        password?: string;
        apiToken?: string;
        apiKey?: string;
        provider?: string;
    }>({ name: "" });



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
                const d = (c.data ?? {}) as Record<string, any>;
                setForm({
                    name: c.name ?? "",
                    email: d.email ?? "",
                    password: d.password ?? "",
                    apiToken: d.apiToken ?? "",
                    apiKey: d.apiKey ?? "",
                    provider: d.provider ?? (c.kind === "action.llm" ? "openai" : undefined),
                });
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
            if (!cred) return;
            const errors = validate();
            if (errors.length) {
                toast({ title: "Missing fields", description: errors.join(", "), variant: "destructive" });
                return;
            }
            setSaving(true);

            let data: Record<string, any> = {};
            switch (cred.kind) {
                case "action.email":
                    data = { email: form.email, password: form.password };
                    break;
                case "action.telegram":
                    data = { apiToken: form.apiToken };
                    break;
                case "action.llm":
                    data = { apiKey: form.apiKey, provider: form.provider };
                    break;
                default:
                    data = {};
            }

            await credentialApi.updateCredential(cred._id, { name: form.name, data });
            toast({ title: "Saved", description: "Credential updated successfully" });
            onOpenChange(false);
            onUpdated?.();
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "Failed to update credential", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };
    const validate = (): string[] => {
        if (!cred) return ["Credential not loaded"];
        const errs: string[] = [];
        if (!form.name?.trim()) errs.push("Name is required");

        switch (cred.kind) {
            case "action.email":
                if (!form.email?.trim()) errs.push("Email is required");
                if (!form.password?.trim()) errs.push("Password is required");
                break;
            case "action.telegram":
                if (!form.apiToken?.trim()) errs.push("Bot API Token is required");
                break;
            case "action.llm":
                if (!form.apiKey?.trim()) errs.push("API Key is required");
                if (!form.provider?.trim()) errs.push("Provider is required");
                break;
        }
        return errs;
    };

    const handleCredChange = useCallback((key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);
  


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
                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                            {(() => {
                                switch (cred.kind) {
                                    case "action.email":
                                        return (
                                            <>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Email
                                                </label>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    required
                                                    placeholder="you@example.com"
                                                    value={form.email ?? ""}
                                                    onChange={(e) => handleCredChange("email", e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />

                                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Password
                                                </label>
                                                <input
                                                    id="password"
                                                    type="password"
                                                    required
                                                    placeholder="********"
                                                    value={form.password ?? ""}
                                                    onChange={(e) => handleCredChange("password", e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />
                                            </>
                                        );

                                    case "action.telegram":
                                        return (
                                            <>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Bot API Token
                                                </label>
                                                <input
                                                    id="apiToken"
                                                    type="text"
                                                    required
                                                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                                    value={form.apiToken ?? ""}
                                                    onChange={(e) => handleCredChange("apiToken", e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />
                                            </>
                                        );

                                    case "action.llm":
                                        return (
                                            <>
                                                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                                                    API Key
                                                </label>
                                                <input
                                                    id="apiKey"
                                                    type="text"
                                                    required
                                                    placeholder="sk-..."
                                                    value={form.apiKey ?? ""}
                                                    onChange={(e) => handleCredChange("apiKey", e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />

                                                <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Provider
                                                </label>
                                                <select
                                                    id="provider"
                                                    value={form.provider ?? "openai"}
                                                    onChange={(e) => handleCredChange("provider", e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                >
                                                    <option value="openai">OpenAI</option>
                                                    <option value="anthropic">Anthropic</option>
                                                    <option value="custom">Custom</option>
                                                </select>
                                            </>
                                        );

                                    default:
                                        return (
                                            <div className="text-sm text-gray-500">
                                                Unknown kind: {cred.kind}
                                            </div>
                                        );
                                }
                            })()}
                        </form>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? "Saving..." : "Save"}
                            </Button>                        </div>
                    </div>
                ) : (
                    <div className="py-8 text-center text-gray-500">No credential found.</div>
                )}
            </DialogContent>
        </Dialog>
    );
}
