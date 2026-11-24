"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Search } from "lucide-react";

export function TopBar({ onSearch }: { onSearch?: (value: string) => void }) {
  const [value, setValue] = useState("");
  const router = useRouter();
  return <div className="topbar-tools"><form className="top-search" onSubmit={event => { event.preventDefault(); const query = value.trim().slice(0, 120); if (onSearch) onSearch(query); else router.push(query ? `/?q=${encodeURIComponent(query)}` : "/"); }}><Search size={16}/><input aria-label="Search from top bar" placeholder="Search payments" value={value} onChange={event => setValue(event.target.value)} /><button type="submit" aria-label="Submit top search">Search</button></form><Popover.Root><Popover.Trigger asChild><button className="account-trigger" aria-label="Account menu"><span className="avatar">PM</span><span>Payme Inc.</span><ChevronDown size={14}/></button></Popover.Trigger><Popover.Portal><Popover.Content className="filter-popover account-menu" align="end" sideOffset={8}><strong>Payme Inc.</strong><span>Demo workspace</span><Link href="/settings">Account settings</Link><Link href="/home">Workspace overview</Link></Popover.Content></Popover.Portal></Popover.Root></div>;
}
