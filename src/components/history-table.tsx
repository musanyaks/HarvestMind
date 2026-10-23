"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Prediction } from "@/db/schema";

const PAGE_SIZE = 10;

export function HistoryTable() {
  const [rows, setRows] = useState<Prediction[]>([]);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/predictions?limit=${PAGE_SIZE}&offset=${offset}`);
      const data = await res.json();
      if (res.ok) {
        setRows(data.rows);
        setCount(data.count);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [offset]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`/api/predictions/${id}`, { method: "DELETE" });
      await fetchData();
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(count / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  if (loading && rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
        Loading history...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">No predictions yet.</p>
          <Button className="mt-4" variant="outline" onClick={() => (window.location.href = "/predict")}>
            Make your first prediction
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Crop</th>
              <th className="px-4 py-3 font-medium">Region</th>
              <th className="px-4 py-3 font-medium">Season</th>
              <th className="px-4 py-3 font-medium">Area (ha)</th>
              <th className="px-4 py-3 font-medium">Yield (t/ha)</th>
              <th className="px-4 py-3 font-medium">Harvest (t)</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3 font-medium capitalize">{row.crop}</td>
                <td className="px-4 py-3">{row.region}</td>
                <td className="px-4 py-3 capitalize">{row.season.replace("_", " ")}</td>
                <td className="px-4 py-3">{row.areaHectares}</td>
                <td className="px-4 py-3 text-primary">{row.predictedYieldTonsPerHa}</td>
                <td className="px-4 py-3">{row.totalHarvestTons}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(row.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    isLoading={deletingId === row.id}
                    onClick={() => handleDelete(row.id)}
                    aria-label={`Delete prediction ${row.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + rows.length, count)} of {count}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((v) => Math.max(0, v - PAGE_SIZE))}
              disabled={offset === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((v) => v + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= count}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
