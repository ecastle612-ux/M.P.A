"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { PART_UOMS } from "@mpa/shared";
import { Badge, Button, EmptyState, Input, Select, Skeleton, Textarea } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";

type Part = {
  id: string;
  sku: string;
  name: string;
  uom: string;
  manufacturer: string | null;
  supplier_name: string | null;
  supplier_reference: string | null;
  critical_part: boolean;
  reorder_threshold_default: number;
  minimum_stock_default: number;
  notes: string | null;
  status: string;
  facility_part_categories?: { id: string; name: string } | null;
  compatibleAssets?: Array<{ id: string; name: string }>;
  compatibleSystems?: Array<{ id: string; name: string }>;
};

type Category = { id: string; name: string };
type AssetOption = { id: string; name: string };
type SystemOption = { id: string; name: string };
type Movement = {
  id: string;
  movement_type: string;
  quantity: number;
  quantity_delta: number;
  reason: string;
  work_order_id: string | null;
  created_at: string;
};

export function PartsCatalog() {
  const searchParams = useSearchParams();
  const preferredId = searchParams.get("partId") ?? "";
  const startCreate = searchParams.get("new") === "1";

  const [parts, setParts] = useState<Part[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [systems, setSystems] = useState<SystemOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [movements, setMovements] = useState<Movement[]>([]);
  const [assistantRecommendation, setAssistantRecommendation] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [uom, setUom] = useState<(typeof PART_UOMS)[number]>("ea");
  const [manufacturer, setManufacturer] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierReference, setSupplierReference] = useState("");
  const [criticalPart, setCriticalPart] = useState(false);
  const [reorder, setReorder] = useState(5);
  const [minimum, setMinimum] = useState(0);
  const [notes, setNotes] = useState("");
  const [compatAssets, setCompatAssets] = useState<string[]>([]);
  const [compatSystems, setCompatSystems] = useState<string[]>([]);

  const selected = useMemo(
    () => parts.find((part) => part.id === selectedId) ?? null,
    [parts, selectedId]
  );

  const refresh = useCallback(async (preferred?: string) => {
    const [partsResponse, assetsResponse, systemsResponse] = await Promise.all([
      fetch("/api/facility/parts"),
      fetch("/api/facility/assets"),
      fetch("/api/facility/systems")
    ]);
    const partsBody = await partsResponse.json();
    if (!partsResponse.ok) {
      throw new Error(partsBody.error ?? "Failed to load parts");
    }
    const rows = (partsBody.parts ?? []) as Part[];
    setParts(rows);
    setCategories(partsBody.categories ?? []);
    setAssistantRecommendation(partsBody.assistantRecommendation ?? "");
    if (assetsResponse.ok) {
      const body = await assetsResponse.json();
      setAssets((body.assets ?? []).map((a: AssetOption) => ({ id: a.id, name: a.name })));
    }
    if (systemsResponse.ok) {
      const body = await systemsResponse.json();
      setSystems((body.systems ?? []).map((s: SystemOption) => ({ id: s.id, name: s.name })));
    }
    const nextId = preferred || preferredId || selectedId || rows[0]?.id || "";
    setSelectedId(nextId);
    if (nextId) {
      const detail = await fetch(`/api/facility/parts/${nextId}`);
      const detailBody = await detail.json();
      if (detail.ok) {
        setMovements(detailBody.movements ?? []);
        if (detailBody.part) {
          setParts((current) =>
            current.map((part) => (part.id === nextId ? { ...part, ...detailBody.part } : part))
          );
        }
      }
    }
  }, [preferredId, selectedId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/facility/parts");
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load parts");
        }
        if (cancelled) {
          return;
        }
        const rows = (body.parts ?? []) as Part[];
        setParts(rows);
        setCategories(body.categories ?? []);
        setAssistantRecommendation(body.assistantRecommendation ?? "");
        const [assetsResponse, systemsResponse] = await Promise.all([
          fetch("/api/facility/assets"),
          fetch("/api/facility/systems")
        ]);
        if (assetsResponse.ok) {
          const assetsBody = await assetsResponse.json();
          setAssets(
            (assetsBody.assets ?? []).map((a: AssetOption) => ({ id: a.id, name: a.name }))
          );
        }
        if (systemsResponse.ok) {
          const systemsBody = await systemsResponse.json();
          setSystems(
            (systemsBody.systems ?? []).map((s: SystemOption) => ({ id: s.id, name: s.name }))
          );
        }
        const nextId = preferredId || rows[0]?.id || "";
        setSelectedId(nextId);
        if (nextId) {
          const detail = await fetch(`/api/facility/parts/${nextId}`);
          const detailBody = await detail.json();
          if (detail.ok && !cancelled) {
            setMovements(detailBody.movements ?? []);
            if (detailBody.part) {
              setParts((current) =>
                current.map((part) => (part.id === nextId ? { ...part, ...detailBody.part } : part))
              );
            }
          }
        }
        if (startCreate || rows.length === 0) {
          setCreating(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [preferredId, startCreate]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let category = categoryId;
      if (newCategory.trim()) {
        const categoryResponse = await fetch("/api/facility/parts/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newCategory.trim() })
        });
        const categoryBody = await categoryResponse.json();
        if (!categoryResponse.ok) {
          throw new Error(categoryBody.error ?? "Category create failed");
        }
        category = categoryBody.category.id as string;
      }
      const response = await fetch("/api/facility/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: sku.trim(),
          name: name.trim(),
          categoryId: category || null,
          uom,
          manufacturer: manufacturer.trim() || null,
          supplierName: supplierName.trim() || null,
          supplierReference: supplierReference.trim() || null,
          criticalPart,
          reorderThresholdDefault: reorder,
          minimumStockDefault: minimum,
          notes: notes.trim() || null,
          compatibleAssetIds: compatAssets,
          compatibleSystemIds: compatSystems
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Create failed");
      }
      setCreating(false);
      setNotice("Part created.");
      await refresh(body.part.id as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40 w-full max-w-3xl" />
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/facility/mission-control", label: "Facility Mission Control" },
          { label: "Parts" }
        ]}
      />
      <header className="flex max-w-5xl flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold">Parts catalog</h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Single source of truth for parts — manufacturers, suppliers, UOM, and compatibility.
          </p>
        </div>
        {!creating ? (
          <Button type="button" onClick={() => setCreating(true)}>
            Create part
          </Button>
        ) : null}
      </header>

      <section className="max-w-3xl rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Assistant recommendation
        </p>
        <p className="mt-1">{assistantRecommendation}</p>
      </section>

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-800">{notice}</p> : null}

      {creating ? (
        <form
          onSubmit={(event) => void onCreate(event)}
          className="max-w-2xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        >
          <h2 className="text-base font-semibold">Create part</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>SKU</span>
              <Input required value={sku} onChange={(e) => setSku(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span>Name</span>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>Category</span>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">None</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Or new category</span>
              <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span>UOM</span>
              <Select
                value={uom}
                onChange={(e) => setUom(e.target.value as (typeof PART_UOMS)[number])}
              >
                {PART_UOMS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Reorder default</span>
              <Input
                type="number"
                min={0}
                value={reorder}
                onChange={(e) => setReorder(Number(e.target.value) || 0)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Minimum default</span>
              <Input
                type="number"
                min={0}
                value={minimum}
                onChange={(e) => setMinimum(Number(e.target.value) || 0)}
              />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span>Manufacturer</span>
              <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span>Supplier</span>
              <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span>Supplier ref</span>
              <Input
                value={supplierReference}
                onChange={(e) => setSupplierReference(e.target.value)}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={criticalPart}
              onChange={(e) => setCriticalPart(e.target.checked)}
            />
            Critical part
          </label>
          <label className="block space-y-1 text-sm">
            <span>Compatible assets</span>
            <Select
              multiple
              value={compatAssets}
              onChange={(e) =>
                setCompatAssets(Array.from(e.target.selectedOptions).map((o) => o.value))
              }
              className="min-h-24"
            >
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1 text-sm">
            <span>Compatible building systems</span>
            <Select
              multiple
              value={compatSystems}
              onChange={(e) =>
                setCompatSystems(Array.from(e.target.selectedOptions).map((o) => o.value))
              }
              className="min-h-24"
            >
              {systems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1 text-sm">
            <span>Notes</span>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Create part"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Catalog</h2>
          {parts.length === 0 ? (
            <EmptyState title="No parts yet" description="Create the first catalog part." />
          ) : (
            <ul className="divide-y divide-[var(--mpa-color-border-default)]">
              {parts.map((part) => (
                <li key={part.id}>
                  <button
                    type="button"
                    className={`w-full px-1 py-3 text-left ${
                      selectedId === part.id ? "bg-[var(--mpa-color-bg-subtle)]" : ""
                    }`}
                    onClick={() => {
                      setSelectedId(part.id);
                      void fetch(`/api/facility/parts/${part.id}`)
                        .then((r) => r.json())
                        .then((body) => {
                          setMovements(body.movements ?? []);
                          if (body.part) {
                            setParts((current) =>
                              current.map((row) =>
                                row.id === part.id ? { ...row, ...body.part } : row
                              )
                            );
                          }
                        });
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {part.sku} · {part.name}
                      </span>
                      {part.critical_part ? <Badge variant="danger">Critical</Badge> : null}
                      <Badge variant="neutral">{part.uom}</Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          {!selected ? (
            <EmptyState title="Select a part" description="Review compatibility and history." />
          ) : (
            <>
              <h2 className="text-lg font-semibold">
                {selected.sku} · {selected.name}
              </h2>
              <dl className="grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-[var(--mpa-color-text-secondary)]">Manufacturer</dt>
                  <dd>{selected.manufacturer ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--mpa-color-text-secondary)]">Supplier</dt>
                  <dd>
                    {selected.supplier_name ?? "—"}
                    {selected.supplier_reference ? ` (${selected.supplier_reference})` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--mpa-color-text-secondary)]">Category</dt>
                  <dd>{selected.facility_part_categories?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--mpa-color-text-secondary)]">Thresholds</dt>
                  <dd>
                    reorder {selected.reorder_threshold_default} · min{" "}
                    {selected.minimum_stock_default}
                  </dd>
                </div>
              </dl>
              <div className="text-sm">
                <p className="font-medium">Compatible assets</p>
                <p className="text-[var(--mpa-color-text-secondary)]">
                  {(selected.compatibleAssets ?? []).map((a) => a.name).join(", ") || "—"}
                </p>
              </div>
              <div className="text-sm">
                <p className="font-medium">Compatible systems</p>
                <p className="text-[var(--mpa-color-text-secondary)]">
                  {(selected.compatibleSystems ?? []).map((s) => s.name).join(", ") || "—"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Movement history</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {movements.map((movement) => (
                    <li key={movement.id}>
                      {movement.movement_type} {movement.quantity_delta > 0 ? "+" : ""}
                      {movement.quantity_delta} · {movement.reason}
                      <span className="block text-xs text-[var(--mpa-color-text-secondary)]">
                        {new Date(movement.created_at).toLocaleString()}
                        {movement.work_order_id ? ` · WO ${movement.work_order_id.slice(0, 8)}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
