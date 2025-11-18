import { useState, useEffect, useCallback } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  FileText,
  Receipt,
  FolderKanban,
  Package,
  Calendar,
  Search,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  type: "client" | "project" | "quote" | "invoice" | "item" | "event";
  title: string;
  subtitle: string;
  url: string;
  metadata?: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Fetch all data for search
  const { data: clients } = useQuery({
    queryKey: ["clients-search"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, name, email, phone, company_name").limit(100);
      return data || [];
    },
    enabled: open,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects-search"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, number, name, status, clients(name)")
        .limit(100);
      return data || [];
    },
    enabled: open,
  });

  const { data: quotes } = useQuery({
    queryKey: ["quotes-search"],
    queryFn: async () => {
      const { data } = await supabase
        .from("quotes")
        .select("id, number, status, totals_ttc, clients(name)")
        .limit(100);
      return data || [];
    },
    enabled: open,
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices-search"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("id, number, status, totals_ttc, clients(name)")
        .limit(100);
      return data || [];
    },
    enabled: open,
  });

  const { data: items } = useQuery({
    queryKey: ["items-search"],
    queryFn: async () => {
      const { data } = await supabase.from("items").select("id, name, description, unit_price_ht").limit(100);
      return data || [];
    },
    enabled: open,
  });

  const { data: events } = useQuery({
    queryKey: ["events-search"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("id, title, start_at, clients(name)").limit(100);
      return data || [];
    },
    enabled: open,
  });

  // Build search results
  const results: SearchResult[] = [];

  if (search.length >= 2) {
    const searchLower = search.toLowerCase();

    // Clients
    clients
      ?.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.phone?.includes(search) ||
          c.company_name?.toLowerCase().includes(searchLower)
      )
      .forEach((c) => {
        results.push({
          id: c.id,
          type: "client",
          title: c.name || c.company_name || "Client sans nom",
          subtitle: c.email || c.phone || "",
          url: `/clients/${c.id}`,
        });
      });

    // Projects
    projects
      ?.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchLower) ||
          p.number?.toLowerCase().includes(searchLower) ||
          p.clients?.name?.toLowerCase().includes(searchLower)
      )
      .forEach((p: any) => {
        results.push({
          id: p.id,
          type: "project",
          title: p.name,
          subtitle: p.number,
          url: `/projects/${p.id}`,
          metadata: p.status,
        });
      });

    // Quotes
    quotes
      ?.filter(
        (q) =>
          q.number?.toLowerCase().includes(searchLower) ||
          q.clients?.name?.toLowerCase().includes(searchLower)
      )
      .forEach((q: any) => {
        results.push({
          id: q.id,
          type: "quote",
          title: q.number,
          subtitle: q.clients?.name || "Client inconnu",
          url: `/quotes/${q.id}`,
          metadata: `${q.totals_ttc?.toFixed(2)} € - ${q.status}`,
        });
      });

    // Invoices
    invoices
      ?.filter(
        (i) =>
          i.number?.toLowerCase().includes(searchLower) ||
          i.clients?.name?.toLowerCase().includes(searchLower)
      )
      .forEach((i: any) => {
        results.push({
          id: i.id,
          type: "invoice",
          title: i.number,
          subtitle: i.clients?.name || "Client inconnu",
          url: `/invoices/${i.id}`,
          metadata: `${i.totals_ttc?.toFixed(2)} € - ${i.status}`,
        });
      });

    // Items
    items
      ?.filter(
        (i) =>
          i.name?.toLowerCase().includes(searchLower) ||
          i.description?.toLowerCase().includes(searchLower)
      )
      .forEach((i) => {
        results.push({
          id: i.id,
          type: "item",
          title: i.name,
          subtitle: i.description || "",
          url: `/items/${i.id}`,
          metadata: `${i.unit_price_ht?.toFixed(2)} € HT`,
        });
      });

    // Events
    events
      ?.filter(
        (e) =>
          e.title?.toLowerCase().includes(searchLower) ||
          e.clients?.name?.toLowerCase().includes(searchLower)
      )
      .forEach((e: any) => {
        results.push({
          id: e.id,
          type: "event",
          title: e.title,
          subtitle: e.clients?.name || "Sans client",
          url: `/agenda/${e.id}`,
          metadata: new Date(e.start_at).toLocaleDateString("fr-FR"),
        });
      });
  }

  // Group by type
  const groupedResults = {
    clients: results.filter((r) => r.type === "client"),
    projects: results.filter((r) => r.type === "project"),
    quotes: results.filter((r) => r.type === "quote"),
    invoices: results.filter((r) => r.type === "invoice"),
    items: results.filter((r) => r.type === "item"),
    events: results.filter((r) => r.type === "event"),
  };

  const handleSelect = useCallback((url: string) => {
    setOpen(false);
    setSearch("");
    navigate(url);
  }, [navigate]);

  const getIcon = (type: string) => {
    switch (type) {
      case "client":
        return <Users className="h-4 w-4" />;
      case "project":
        return <FolderKanban className="h-4 w-4" />;
      case "quote":
        return <FileText className="h-4 w-4" />;
      case "invoice":
        return <Receipt className="h-4 w-4" />;
      case "item":
        return <Package className="h-4 w-4" />;
      case "event":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "client":
        return "Clients";
      case "project":
        return "Projets";
      case "quote":
        return "Devis";
      case "invoice":
        return "Factures";
      case "item":
        return "Articles";
      case "event":
        return "Événements";
      default:
        return type;
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Rechercher clients, projets, devis, factures..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {search.length < 2 ? (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6">
              <Search className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Tapez au moins 2 caractères pour rechercher
              </p>
              <p className="text-xs text-muted-foreground">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>{" "}
                pour ouvrir/fermer
              </p>
            </div>
          </CommandEmpty>
        ) : results.length === 0 ? (
          <CommandEmpty>Aucun résultat trouvé</CommandEmpty>
        ) : (
          <>
            {Object.entries(groupedResults).map(([type, items]) => {
              if (items.length === 0) return null;

              return (
                <div key={type}>
                  <CommandGroup heading={getTypeLabel(type)}>
                    {items.slice(0, 5).map((result) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result.url)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getIcon(result.type)}
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">{result.title}</span>
                            {result.subtitle && (
                              <span className="text-xs text-muted-foreground truncate">
                                {result.subtitle}
                              </span>
                            )}
                          </div>
                        </div>
                        {result.metadata && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {result.metadata}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                    {items.length > 5 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground">
                        +{items.length - 5} résultat(s) supplémentaire(s)
                      </div>
                    )}
                  </CommandGroup>
                  <CommandSeparator />
                </div>
              );
            })}

            {/* Quick actions */}
            <CommandGroup heading="Actions rapides">
              <CommandItem onSelect={() => handleSelect("/clients/new")}>
                <Users className="h-4 w-4 mr-2" />
                Nouveau client
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/projects/new")}>
                <FolderKanban className="h-4 w-4 mr-2" />
                Nouveau projet
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/quotes/new")}>
                <FileText className="h-4 w-4 mr-2" />
                Nouveau devis
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/invoices/new")}>
                <Receipt className="h-4 w-4 mr-2" />
                Nouvelle facture
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
