"use client";

import * as React from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PackageType = "npm" | "pip" | "docker" | "nuget";

type ValidateResult = {
    state: "ok" | "error";
    publisher?: string;
    name?: string;
    version?: string;
    readme?: string;
    error?: string;
    errorType?: string;
};

type McpServer = {
    id: string;
    name: string;
    type: string;
    config: Record<string, unknown>;
};

type Props = {
    onBack: () => void;
    onCreated: (server: McpServer) => void;
};

export function McpAddServerView({ onBack, onCreated }: Props) {
    const [step, setStep] = React.useState<"input" | "review" | "saving">("input");

    const [pkgType, setPkgType] = React.useState<PackageType>("npm");
    const [pkgName, setPkgName] = React.useState<string>("");

    const [validateResult, setValidateResult] = React.useState<ValidateResult | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const resolvedName = (validateResult?.name || pkgName).trim();

    const runValidate = async () => {
        setError(null);
        setValidateResult(null);

        const res = await fetch("/api/mcp/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: pkgType, name: pkgName.trim() }),
        });

        const data = (await res.json()) as ValidateResult;
        setValidateResult(data);
        if (data.state !== "ok") {
            setError(data.error || "validate_failed");
            return;
        }

        setStep("review");
    };

    const createServer = async () => {
        setError(null);
        setStep("saving");

        const config = buildMinimalConfig(pkgType, resolvedName, validateResult?.version);

        const res = await fetch("/api/mcp/servers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: resolvedName, type: pkgType, config }),
        });

        if (!res.ok) {
            const data = (await res.json().catch(() => null)) as { error?: string } | null;
            setError(data?.error || `create_failed_${res.status}`);
            setStep("review");
            return;
        }

        const created = (await res.json()) as McpServer;
        onCreated(created);
    };

    return (
        <div className="flex flex-col h-full bg-card text-card-foreground border-l border-border animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-border flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8" title="Back">
                    <ArrowLeft size={18} />
                </Button>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Add MCP Server</h3>
                    <p className="text-xs text-muted-foreground">Validate a package and create a server entry.</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div className="space-y-2">
                    <Label>Package Type</Label>
                    <Select value={pkgType} onChange={(e) => setPkgType(e.target.value as PackageType)}>
                        <option value="npm">npm</option>
                        <option value="pip">pip</option>
                        <option value="docker">docker</option>
                        <option value="nuget">nuget</option>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Package Name</Label>
                    <Input
                        value={pkgName}
                        onChange={(e) => setPkgName(e.target.value)}
                        placeholder={pkgType === "docker" ? "namespace/repo" : "package-name"}
                        className="bg-secondary border-none"
                    />
                </div>

                {error && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {validateResult?.state === "ok" && (
                    <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 space-y-2">
                        <div className="text-sm font-medium">Validated</div>
                        <div className="text-xs text-muted-foreground">
                            <div>Publisher: {validateResult.publisher || "unknown"}</div>
                            <div>Name: {validateResult.name || resolvedName}</div>
                            {validateResult.version && <div>Version: {validateResult.version}</div>}
                        </div>
                    </div>
                )}

                {step !== "input" && (
                    <div className="space-y-2">
                        <Label>README (preview)</Label>
                        <Textarea
                            readOnly
                            value={validateResult?.readme || ""}
                            className="bg-secondary border-none min-h-[180px]"
                        />
                        <p className="text-xs text-muted-foreground">
                            Next step will generate a richer config from README.
                        </p>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-border bg-card/50">
                {step === "input" ? (
                    <Button
                        onClick={runValidate}
                        className="w-full flex items-center justify-center gap-2"
                        disabled={!pkgName.trim()}
                    >
                        <ChevronRight size={16} />
                        Validate
                    </Button>
                ) : (
                    <Button
                        onClick={createServer}
                        className="w-full flex items-center justify-center gap-2"
                        disabled={step === "saving" || validateResult?.state !== "ok"}
                    >
                        {step === "saving" ? "Saving..." : "Create Server"}
                    </Button>
                )}
            </div>
        </div>
    );
}

function buildMinimalConfig(type: PackageType, name: string, version?: string): Record<string, unknown> {
    if (type === "npm") {
        return {
            type: "stdio",
            command: "npx",
            args: [version ? `${name}@${version}` : name],
        };
    }

    if (type === "pip") {
        return {
            type: "stdio",
            command: "uvx",
            args: [version ? `${name}==${version}` : name],
        };
    }

    if (type === "docker") {
        return {
            type: "stdio",
            command: "docker",
            args: ["run", "-i", "--rm", name],
        };
    }

    // nuget: placeholder until we add dotnet/dnx support server-side.
    return {
        type: "stdio",
        command: "dnx",
        args: [version ? `${name}@${version}` : name, "--yes"],
    };
}
