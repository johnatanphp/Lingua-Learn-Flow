import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecordings } from "@/hooks/use-platform";
import { PlayCircle, Clock, Eye, Video, Search, Lock } from "lucide-react";
import { useState } from "react";

export default function Recordings() {
  const { data: recordings = [], isLoading } = useRecordings();
  const [search, setSearch] = useState("");

  const filtered = recordings.filter((r: any) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black">Grabaciones</h1>
            <p className="text-muted-foreground text-sm">Clases grabadas disponibles para ti</p>
          </div>
          <Badge className="bg-violet-50 text-violet-700 border-violet-200">
            <Video className="w-3.5 h-3.5 mr-1.5" />
            {recordings.length} grabaciones
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-search-recordings"
            placeholder="Buscar grabación..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-2xl"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Video className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <p className="font-semibold text-muted-foreground">
                {recordings.length === 0 ? "No hay grabaciones disponibles" : "Sin resultados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r: any) => (
              <Card key={r.id} data-testid={`card-recording-${r.id}`} className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="bg-gradient-to-br from-violet-600/20 to-purple-600/20 h-36 flex items-center justify-center relative">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-8 h-8 text-white" />
                  </div>
                  {r.duration && (
                    <Badge className="absolute bottom-2 right-2 bg-black/60 text-white border-0 text-xs backdrop-blur-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.floor(r.duration / 60)}:{String(r.duration % 60).padStart(2, "0")}
                    </Badge>
                  )}
                  {!r.isPublic && (
                    <Badge className="absolute top-2 right-2 bg-black/60 text-white border-0 text-xs backdrop-blur-sm">
                      <Lock className="w-3 h-3 mr-1" /> Privada
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-bold text-sm line-clamp-1">{r.title}</h3>
                  {r.description && <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{r.views} vistas</span>
                    <span>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("es-ES") : "—"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
