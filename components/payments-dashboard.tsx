"use client";

import Link from "next/link";
import * as Popover from "@radix-ui/react-popover";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnOrderState,
  type ColumnSizingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  Bell, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Copy,
  CreditCard, Download, Filter, House, Landmark, Menu, MoreHorizontal, Package, Plus,
  Search, Settings, SlidersHorizontal, Users, X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatAmount, payments } from "@/lib/payments";
import { reportClientError } from "@/lib/client-telemetry";
import { TopBar } from "@/components/top-bar";
import type { Payment, PaymentMethod, PaymentStatus } from "@/types/payment";

const statusOptions: PaymentStatus[] = ["Succeeded", "Pending", "Failed", "Refunded"];
const methodOptions: PaymentMethod[] = ["Card", "PIX", "Bank transfer", "Apple Pay"];
const currencyOptions: Payment["currency"][] = ["USD", "BRL", "EUR", "GBP"];
const statusTabs: Array<"All" | PaymentStatus> = ["All", "Succeeded", "Failed", "Refunded"];
type Sort = "created-desc" | "created-asc" | "amount-desc" | "amount-asc" | "status-asc" | "status-desc";
type FilterPanel = "menu" | "status" | "currency" | "type" | "balance" | "created" | "available" | "amount";

function MultiSelect<T extends string>({ label, options, value, onChange }: { label: string; options: T[]; value: T[]; onChange: (value: T[]) => void }) {
  return <Popover.Root><Popover.Trigger asChild><button className={`filter-button ${value.length ? "active" : ""}`}>{label}{value.length ? ` (${value.length})` : ""}<ChevronDown size={15}/></button></Popover.Trigger><Popover.Portal><Popover.Content className="filter-popover" side="bottom" align="start" sideOffset={8}>
    <div className="popover-title">Filter by {label.toLowerCase()}</div>{options.map(option => <label className="check-option" key={option}><input type="checkbox" checked={value.includes(option)} onChange={() => onChange(value.includes(option) ? value.filter(item => item !== option) : [...value, option])}/><span className="fake-check">{value.includes(option) && <Check size={12}/>}</span>{option}</label>)}
  </Popover.Content></Popover.Portal></Popover.Root>;
}

function StatusBadge({ status }: { status: PaymentStatus }) { return <span className={`status status-${status.toLowerCase()}`}><i />{status}</span>; }
function relative(date: Date) { const hours = Math.max(1, Math.floor((Date.now() - date.getTime()) / 3600000)); return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`; }
function availability(payment: Payment) { return payment.status === "Pending" ? "Pending" : "Available"; }
function availableAt(payment: Payment) { return new Date(payment.created.getTime() + 2 * 86400000); }

export function PaymentsDashboard() {
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<PaymentStatus[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [currencies, setCurrencies] = useState<Payment["currency"][]>([]);
  const [balanceTypes, setBalanceTypes] = useState<string[]>([]);
  const [serverData, setServerData] = useState<{ payments: Payment[]; total: number } | null>(null);
  const [range, setRange] = useState("30 days");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [dateMode, setDateMode] = useState("30 days");
  const [availableRange, setAvailableRange] = useState("Any time");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState<Sort>("created-desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [copied, setCopied] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const requestVersion = useRef(0);
  const [filterPanel, setFilterPanel] = useState<FilterPanel>("menu");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const draggingColumn = useRef<string | null>(null);
  const [wrapCells, setWrapCells] = useState(false);
  const [urlReady, setUrlReady] = useState(false);
  const skipUrlWrite = useRef(false);

  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(window.location.search);
      const selected = <T extends string,>(key: string, options: readonly T[]) => params.getAll(key).filter((value): value is T => options.includes(value as T));
      const allowedRange = ["Today", "7 days", "30 days", "Custom"];
      const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z")) && new Date(value + "T00:00:00Z").toISOString().startsWith(value);
      let restoredRange = params.get("range") ?? "30 days";
      const from = params.get("from") ?? ""; const to = params.get("to") ?? "";
      if (!allowedRange.includes(restoredRange) || (restoredRange === "Custom" && (!validDate(from) || !validDate(to) || from > to))) restoredRange = "30 days";
      const minValue = params.get("min") ?? ""; const maxValue = params.get("max") ?? "";
      const validAmount = (value: string) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0);
      const sortValue = params.get("sort") ?? "created-desc";
      const pageValue = Number(params.get("page") ?? 0); const sizeValue = Number(params.get("pageSize") ?? 25);
      skipUrlWrite.current = true;
      setQuery((params.get("q") ?? "").slice(0, 120)); setStatuses(selected("status", statusOptions)); setMethods(selected("method", methodOptions)); setCurrencies(selected("currency", currencyOptions));
      setBalanceTypes(selected("balance", ["Available", "Pending"])); setAvailableRange(["Any time", "7 days", "30 days"].includes(params.get("available") ?? "") ? params.get("available")! : "Any time");
      setRange(restoredRange); setDateMode(restoredRange); setCustomFrom(restoredRange === "Custom" ? from : ""); setCustomTo(restoredRange === "Custom" ? to : "");
      setMin(validAmount(minValue) && (!maxValue || Number(minValue) <= Number(maxValue)) ? minValue : ""); setMax(validAmount(maxValue) && (!minValue || Number(minValue) <= Number(maxValue)) ? maxValue : "");
      setSort((["created-desc", "created-asc", "amount-desc", "amount-asc", "status-asc", "status-desc"] as string[]).includes(sortValue) ? sortValue as Sort : "created-desc");
      setPage(Number.isSafeInteger(pageValue) && pageValue >= 0 ? pageValue : 0); setPageSize([25, 50, 100].includes(sizeValue) ? sizeValue : 25); setUrlReady(true);
    };
    restore(); window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  useEffect(() => {
    if (!urlReady) return;
    if (skipUrlWrite.current) { skipUrlWrite.current = false; return; }
    const params = new URLSearchParams();
    if (query) params.set("q", query); statuses.forEach(value => params.append("status", value)); methods.forEach(value => params.append("method", value)); currencies.forEach(value => params.append("currency", value)); balanceTypes.forEach(value => params.append("balance", value));
    if (range !== "30 days") params.set("range", range); if (range === "Custom") { params.set("from", customFrom); params.set("to", customTo); }
    if (availableRange !== "Any time") params.set("available", availableRange); if (min) params.set("min", min); if (max) params.set("max", max);
    if (sort !== "created-desc") params.set("sort", sort); if (page) params.set("page", String(page)); if (pageSize !== 25) params.set("pageSize", String(pageSize));
    const suffix = params.toString(); window.history.replaceState(window.history.state, "", `${window.location.pathname}${suffix ? `?${suffix}` : ""}${window.location.hash}`);
  }, [urlReady, query, statuses, methods, currencies, balanceTypes, range, customFrom, customTo, availableRange, min, max, sort, page, pageSize]);

  const fallbackFiltered = useMemo(() => {
    const days = range === "Today" ? 1 : range === "7 days" ? 7 : range === "30 days" ? 30 : 10000;
    const after = range === "Custom" ? new Date(`${customFrom}T00:00:00.000Z`).getTime() : Date.now() - days * 86400000;
    const before = range === "Custom" ? new Date(`${customTo}T00:00:00.000Z`).getTime() + 86400000 : Infinity;
    const term = query.toLowerCase().trim();
    const availableDays = availableRange === "7 days" ? 7 : availableRange === "30 days" ? 30 : 10000;
    const availableAfter = Date.now() - availableDays * 86400000;
    return payments.filter(payment =>
      (!term || payment.id.toLowerCase().includes(term) || payment.customer.email.includes(term) || payment.last4?.includes(term)) &&
      (!statuses.length || statuses.includes(payment.status)) &&
      (!methods.length || methods.includes(payment.method)) &&
      (!currencies.length || currencies.includes(payment.currency)) &&
      (!balanceTypes.length || balanceTypes.includes(availability(payment))) &&
      (!min || payment.amount >= Number(min) * 100) && (!max || payment.amount <= Number(max) * 100) &&
      payment.created.getTime() >= after && payment.created.getTime() < before && availableAt(payment).getTime() >= availableAfter,
    ).sort((a, b) => {
      const tie = a.id.localeCompare(b.id);
      if (sort.startsWith("created")) return (sort.endsWith("desc") ? b.created.getTime() - a.created.getTime() : a.created.getTime() - b.created.getTime()) || tie;
      if (sort.startsWith("amount")) return (sort.endsWith("desc") ? b.amount - a.amount : a.amount - b.amount) || tie;
      return (sort.endsWith("desc") ? b.status.localeCompare(a.status) : a.status.localeCompare(b.status)) || tie;
    });
  }, [query, statuses, methods, currencies, balanceTypes, range, customFrom, customTo, availableRange, min, max, sort]);

  useEffect(() => {
    if (!urlReady) return;
    const controller = new AbortController();
    const version = ++requestVersion.current;
    const params = new URLSearchParams({ q: query, range, sort, page: String(page), pageSize: String(pageSize) });
    statuses.forEach(value => params.append("status", value));
    methods.forEach(value => params.append("method", value));
    currencies.forEach(value => params.append("currency", value));
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    if (range === "Custom") { params.set("from", customFrom); params.set("to", customTo); }
    setLoading(true);
    setError(false);
    setServerData(null);
    fetch(`/api/payments?${params}`, { signal: controller.signal, cache: "no-store", headers: { "Cache-Control": "no-cache" } })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Unable to load payments")))
      .then((data: { payments: Array<Omit<Payment, "created"> & { created: string }>; total: number }) => {
        if (version !== requestVersion.current) return;
        setServerData({ total: data.total, payments: data.payments.map(payment => ({ ...payment, created: new Date(payment.created) })) });
        setError(false);
        setLoading(false);
      })
      .catch(() => { if (!controller.signal.aborted && version === requestVersion.current) { reportClientError("payment_request_failed"); setError(true); setLoading(false); } });
    return () => controller.abort();
  }, [urlReady, query, statuses, methods, currencies, range, customFrom, customTo, min, max, sort, page, pageSize]);

  const setAndReset = <T,>(setter: (value: T) => void, value: T) => { setter(value); setPage(0); };
  const clientRows = useMemo(
    () => fallbackFiltered.slice(page * pageSize, page * pageSize + pageSize),
    [fallbackFiltered, page, pageSize],
  );
  // Advanced-only computed fields are deliberately evaluated locally, while the required filters remain server queried.
  const usesClientAdvancedFilter = balanceTypes.length > 0 || availableRange !== "Any time";
  const total = usesClientAdvancedFilter ? fallbackFiltered.length : (serverData?.total ?? fallbackFiltered.length);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const rows = usesClientAdvancedFilter ? clientRows : (serverData?.payments ?? clientRows);
  const activeTab = statuses.length === 1 && statusTabs.includes(statuses[0]) ? statuses[0] : "All";

  const copy = async (id: string) => { try { await navigator.clipboard.writeText(id); setCopied(id); window.setTimeout(() => setCopied(""), 1400); } catch { reportClientError("clipboard_failed"); } };
  const exportCsv = () => {
    const csv = ["Payment ID,Customer,Email,Amount,Status,Method,Created", ...rows.map(payment => [payment.id, payment.customer.name, payment.customer.email, formatAmount(payment.amount, payment.currency), payment.status, payment.method, payment.created.toISOString()].map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "payme-payments.csv"; anchor.click(); URL.revokeObjectURL(url);
  };

  const columns = useMemo<ColumnDef<Payment>[]>(() => [
    { accessorKey: "id", header: "Payment ID", enableHiding: false, cell: ({ row }) => <div className="id-cell"><button onClick={() => copy(row.original.id)} aria-label={`Copy ${row.original.id}`}>{copied === row.original.id ? <Check size={15}/> : <Copy size={15}/>}</button><Link href={`/payments/${encodeURIComponent(row.original.id)}`}>{row.original.id.slice(0, 17)}…</Link></div> },
    { id: "customer", header: "Customer", enableHiding: false, cell: ({ row }) => <div className="customer"><strong>{row.original.customer.name}</strong><span>{row.original.customer.email}</span></div> },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => <strong>{formatAmount(row.original.amount, row.original.currency)}</strong> },
    { accessorKey: "currency", header: "Currency", cell: ({ row }) => <span>{row.original.currency}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status}/> },
    { id: "method", header: "Payment method", cell: ({ row }) => <div className="method"><CreditCard size={16}/><span>{row.original.method === "Card" ? `${row.original.brand} •••• ${row.original.last4}` : row.original.method}</span></div> },
    { id: "balance", header: "Balance type", cell: ({ row }) => <span className="muted-cell">{availability(row.original)}</span> },
    { accessorKey: "created", header: "Created", cell: ({ row }) => <span className="created" title={relative(row.original.created)}>{row.original.created.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</span> },
    { id: "availableAt", header: "Available at", cell: ({ row }) => <span className="created">{availability(row.original) === "Pending" ? "Pending" : relative(availableAt(row.original))}</span> },
    { id: "more", header: "", enableHiding: false, cell: () => <button className="icon-button" aria-label="More actions"><MoreHorizontal size={18}/></button> },
  ], [copied]);
  const table = useReactTable({ data: rows, columns, state: { columnVisibility, columnOrder, columnSizing }, onColumnVisibilityChange: setColumnVisibility, onColumnOrderChange: setColumnOrder, onColumnSizingChange: setColumnSizing, columnResizeMode: "onChange", defaultColumn: { minSize: 90, maxSize: 500, size: 150 }, getCoreRowModel: getCoreRowModel() });
  const moveColumn = (source: string, destination: string) => {
    const order = table.getAllLeafColumns().map(column => column.id);
    const from = order.indexOf(source); const to = order.indexOf(destination);
    if (from < 0 || to < 0 || from === to) return;
    order.splice(from, 1); order.splice(to, 0, source); setColumnOrder(order);
  };
  const clear = () => { setQuery(""); setStatuses([]); setMethods([]); setCurrencies([]); setBalanceTypes([]); setRange("30 days"); setDateMode("30 days"); setCustomFrom(""); setCustomTo(""); setAvailableRange("Any time"); setMin(""); setMax(""); setPage(0); };
  const selectTab = (tab: "All" | PaymentStatus) => setAndReset(setStatuses, tab === "All" ? [] : [tab]);
  const hasFilters = Boolean(query || statuses.length || methods.length || currencies.length || balanceTypes.length || min || max || range !== "30 days" || availableRange !== "Any time");

  const toggle = <T extends string,>(items: T[], setter: (value: T[]) => void, item: T) => setter(items.includes(item) ? items.filter(value => value !== item) : [...items, item]);
  const closeFiltersSoon = () => window.setTimeout(() => setMoreFiltersOpen(false), 0);
  const columnChoices = table.getAllLeafColumns().filter(column => column.getCanHide());
  const filterCount = Number(statuses.length > 0) + Number(currencies.length > 0) + Number(methods.length > 0) + Number(balanceTypes.length > 0) + Number(range !== "30 days") + Number(availableRange !== "Any time") + Number(Boolean(min || max));
  const filterItems: Array<{ panel: FilterPanel; label: string; value: string; clear: () => void }> = [
    { panel: "status", label: "Status", value: statuses.join(", "), clear: () => setAndReset(setStatuses, []) },
    { panel: "currency", label: "Currency", value: currencies.join(", "), clear: () => setAndReset(setCurrencies, []) },
    { panel: "type", label: "Type", value: methods.join(", "), clear: () => setAndReset(setMethods, []) },
    { panel: "balance", label: "Balance type", value: balanceTypes.join(", "), clear: () => setAndReset(setBalanceTypes, []) },
    { panel: "created", label: "Created at", value: range === "30 days" ? "" : range === "Custom" ? `${customFrom} – ${customTo}` : range, clear: () => { setAndReset(setRange, "30 days"); setDateMode("30 days"); } },
    { panel: "available", label: "Available at", value: availableRange === "Any time" ? "" : availableRange, clear: () => setAndReset(setAvailableRange, "Any time") },
    { panel: "amount", label: "Amount range", value: min || max ? `${min || "0"} – ${max || "∞"}` : "", clear: () => { setMin(""); setMax(""); setPage(0); } },
  ];

  return <main className="app-shell"><aside className="sidebar"><div className="brand"><span>p</span>payme</div><nav><p>WORKSPACE</p><Link href="/home"><House size={17}/>Home</Link><Link className="active" href="/"><CreditCard size={17}/>Payments</Link><Link href="/customers"><Users size={17}/>Customers</Link><Link href="/balances"><Landmark size={17}/>Balances</Link><Link href="/payouts"><Download size={17}/>Payouts</Link><Link href="/products"><Package size={17}/>Products</Link><p>MORE</p><Link href="/settings"><Settings size={17}/>Settings</Link></nav><div className="account"><div className="avatar">PM</div><div><strong>Payme Inc.</strong><span>Admin workspace</span></div><ChevronDown size={16}/></div></aside><section className="content"><header className="topbar"><button className="mobile-menu"><Menu/></button><div className="breadcrumb">Payments <ChevronRight size={15}/> <strong>All payments</strong></div><TopBar onSearch={value => setAndReset(setQuery, value)}/><div className="top-actions"><button className="icon-button" aria-label="Help"><CircleHelp size={19}/></button><button className="icon-button" aria-label="Notifications"><Bell size={19}/></button><button className="create" onClick={() => window.alert("Demo mode: payment creation is ready for API integration.")}><Plus size={17}/>Create payment</button></div></header><div className="page"><div className="title-row"><div><h1>Payments</h1><p>View and manage payments from your customers.</p></div><button className="export" onClick={exportCsv}><Download size={16}/>Export</button></div>
    <div className="tabs" aria-label="Payment status">{statusTabs.map(tab => <button key={tab} className={activeTab === tab ? "selected" : ""} onClick={() => selectTab(tab)}>{tab}</button>)}</div>
    <div className="toolbar"><div className="search"><Search size={17}/><input aria-label="Search payments" value={query} onChange={event => setAndReset(setQuery, event.target.value)} placeholder="Search by payment ID, email, or card"/>{query && <button onClick={() => setAndReset(setQuery, "")} aria-label="Clear search"><X size={15}/></button>}</div><MultiSelect label="Method" options={methodOptions} value={methods} onChange={value => setAndReset(setMethods, value)}/>
      <Popover.Root open={moreFiltersOpen} onOpenChange={open => { setMoreFiltersOpen(open); if (open) { setFilterPanel("menu"); setDateMode(range); setDraftFrom(customFrom); setDraftTo(customTo); } }}><Popover.Trigger asChild><button className={`filter-button ${filterCount ? "active" : ""}`}><Filter size={15}/>{filterCount ? `${filterCount} filter${filterCount === 1 ? "" : "s"}` : "More filters"}</button></Popover.Trigger><Popover.Portal><Popover.Content className="filter-popover advanced-popover" side="bottom" align="start" sideOffset={8}>
        {filterPanel === "menu" ? <><div className="popover-title">Filter</div>{filterItems.map(item => <div className="filter-menu-row" key={item.panel}><button className="filter-menu-item" onClick={() => setFilterPanel(item.panel)}>{item.label}{!item.value && <ChevronRight size={15}/>}</button>{item.value && <button className="filter-chip" aria-label={`Clear ${item.label} filter`} onClick={item.clear}>{item.value}<X size={12}/></button>}</div>)}</> : <div className="advanced-panel"><button className="panel-back" onClick={() => setFilterPanel("menu")}><ChevronLeft size={17}/>{filterPanel === "status" ? "Status" : filterPanel === "type" ? "Type" : filterPanel === "balance" ? "Balance type" : filterPanel === "created" ? "Created at" : filterPanel === "available" ? "Available at" : filterPanel === "amount" ? "Amount range" : "Currency"}</button>
          {filterPanel === "status" && statusOptions.map(option => <label className="check-option" key={option}><input type="checkbox" checked={statuses.includes(option)} onChange={() => { toggle(statuses, setStatuses, option); setPage(0); }}/><span className="fake-check">{statuses.includes(option) && <Check size={12}/>}</span>{option}</label>)}
          {filterPanel === "currency" && currencyOptions.map(option => <label className="check-option" key={option}><input type="checkbox" checked={currencies.includes(option)} onChange={() => { toggle(currencies, setCurrencies, option); setPage(0); closeFiltersSoon(); }}/><span className="fake-check">{currencies.includes(option) && <Check size={12}/>}</span>{option}</label>)}
          {filterPanel === "type" && methodOptions.map(option => <label className="check-option" key={option}><input type="checkbox" checked={methods.includes(option)} onChange={() => { toggle(methods, setMethods, option); setPage(0); closeFiltersSoon(); }}/><span className="fake-check">{methods.includes(option) && <Check size={12}/>}</span>{option}</label>)}
          {filterPanel === "balance" && ["Available", "Pending"].map(option => <label className="check-option" key={option}><input type="checkbox" checked={balanceTypes.includes(option)} onChange={() => { toggle(balanceTypes, setBalanceTypes, option); setPage(0); closeFiltersSoon(); }}/><span className="fake-check">{balanceTypes.includes(option) && <Check size={12}/>}</span>{option}</label>)}
          {filterPanel === "created" && <div className="date-filter"><label className="control-label">Created within<select value={dateMode} onChange={event => { const value = event.target.value; setDateMode(value); if (value !== "Custom") { setAndReset(setRange, value); closeFiltersSoon(); } }}><option>Today</option><option>7 days</option><option>30 days</option><option>Custom</option></select></label>{dateMode === "Custom" && <><label className="control-label">From (UTC)<input type="date" value={draftFrom} onChange={event => setDraftFrom(event.target.value)}/></label><label className="control-label">To (UTC)<input type="date" value={draftTo} min={draftFrom || undefined} onChange={event => setDraftTo(event.target.value)}/></label><button className="apply-date" disabled={!draftFrom || !draftTo || draftFrom > draftTo} onClick={() => { setCustomFrom(draftFrom); setCustomTo(draftTo); setAndReset(setRange, "Custom"); closeFiltersSoon(); }}>Apply</button></>}</div>}
          {filterPanel === "available" && <label className="control-label">Available within<select value={availableRange} onChange={event => { setAndReset(setAvailableRange, event.target.value); closeFiltersSoon(); }}><option>Any time</option><option>7 days</option><option>30 days</option></select></label>}
          {filterPanel === "amount" && <div className="amounts"><label>Minimum<input inputMode="decimal" placeholder="0.00" value={min} onChange={event => setAndReset(setMin, event.target.value)}/></label><label>Maximum<input inputMode="decimal" placeholder="No maximum" value={max} onChange={event => setAndReset(setMax, event.target.value)}/></label></div>}
        </div>}</Popover.Content></Popover.Portal></Popover.Root><div className="toolbar-spacer"/>
      <Popover.Root><Popover.Trigger asChild><button className="icon-button columns-trigger" aria-label="Adjust columns"><SlidersHorizontal size={17}/></button></Popover.Trigger><Popover.Portal><Popover.Content className="filter-popover columns-popover" side="bottom" align="end" sideOffset={8}><div className="popover-title">Table settings</div><label className="switch-row">Wrap cell text <input type="checkbox" checked={wrapCells} onChange={event => setWrapCells(event.target.checked)}/><span className="switch"/></label><div className="column-heading">Columns</div>{columnChoices.map(column => <label className="check-option" key={column.id}><input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()}/><span className="fake-check">{column.getIsVisible() && <Check size={12}/>}</span>{String(column.columnDef.header)}</label>)}<button className="reset-columns" onClick={() => { setColumnVisibility({}); setColumnOrder([]); setColumnSizing({}); setWrapCells(false); }}>Reset to default</button></Popover.Content></Popover.Portal></Popover.Root></div>
    {hasFilters && <div className="active-filters"><span>Filters applied</span><button onClick={clear}>Clear all</button></div>}<div className="table-card">{!urlReady || loading ? <div className="state" role="status"><div className="loader"/><p>Loading payments…</p></div> : error ? <div className="state"><h3>Couldn’t load payments</h3><p>Check your connection and try again.</p><button onClick={() => window.location.reload()}>Try again</button></div> : total === 0 ? <div className="state"><Search size={25}/><h3>No payments found</h3><p>Try adjusting your filters or search terms.</p><button onClick={clear}>Clear filters</button></div> : <><div className={`table-wrap ${wrapCells ? "wrap-cells" : ""}`}><table style={{ width: table.getTotalSize(), tableLayout: "fixed" }}><thead>{table.getHeaderGroups().map(group => <tr key={group.id}>{group.headers.map(header => <th key={header.id} style={{ width: header.getSize() }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (draggingColumn.current) moveColumn(draggingColumn.current, header.column.id); draggingColumn.current = null; }}>{header.isPlaceholder ? null : ["created", "amount", "status"].includes(header.column.id) ? <button className="sort-head" onClick={() => setAndReset(setSort, sort === `${header.column.id}-desc` ? `${header.column.id}-asc` as Sort : `${header.column.id}-desc` as Sort)}>{flexRender(header.column.columnDef.header, header.getContext())}<ChevronDown size={14}/></button> : flexRender(header.column.columnDef.header, header.getContext())}<button className="column-drag" draggable aria-label={`Drag ${String(header.column.columnDef.header || "Actions")} column`} title="Drag to reorder" onDragStart={event => { draggingColumn.current = header.column.id; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", header.column.id); }} onDragEnd={() => { draggingColumn.current = null; }}>⋮⋮</button><span className="column-resize" role="separator" aria-label={`Resize ${String(header.column.columnDef.header || "Actions")} column`} aria-orientation="vertical" tabIndex={0} onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); setColumnSizing(previous => ({ ...previous, [header.column.id]: Math.max(90, Math.min(500, header.getSize() + (event.key === "ArrowRight" ? 10 : -10))) })); } }} onDoubleClick={() => header.column.resetSize()}/></th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map(row => <tr key={row.id}>{row.getVisibleCells().map(cell => <td key={cell.id} style={{ width: cell.column.getSize() }}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div><footer className="pagination"><span>Showing <strong>{safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, total)}</strong> of <strong>{total}</strong> payments</span><div><select aria-label="Rows per page" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(0); }}><option value="25">25 per page</option><option value="50">50 per page</option><option value="100">100 per page</option></select><button disabled={safePage === 0} onClick={() => setPage(safePage - 1)} aria-label="Previous page"><ChevronLeft size={17}/></button><span className="page-count">{safePage + 1} / {totalPages}</span><button disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)} aria-label="Next page"><ChevronRight size={17}/></button></div></footer></>}</div></div></section></main>;
}
