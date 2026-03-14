import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookOpen, Youtube, FileText, Presentation, Table,
  ExternalLink, Plus, Trash2, Loader2, Play, X,
} from "lucide-react";
import type { CourseResource } from "@shared/schema";

interface ResourcesResponse { resources: CourseResource[] }

const TYPE_ICONS: Record<string, React.ReactNode> = {
  youtube: <Youtube className="w-4 h-4 text-red-500" />,
  video: <Play className="w-4 h-4 text-blue-500" />,
  document: <FileText className="w-4 h-4 text-emerald-600" />,
  drive: <FileText className="w-4 h-4 text-blue-600" />,
  pdf: <FileText className="w-4 h-4 text-red-600" />,
  presentation: <Presentation className="w-4 h-4 text-orange-500" />,
  spreadsheet: <Table className="w-4 h-4 text-emerald-600" />,
};

const TYPE_LABELS: Record<string, string> = {
  youtube: "YouTube",
  video: "Video",
  document: "Documento",
  drive: "Google Drive",
  pdf: "PDF",
};

function buildEmbedUrl(resource: CourseResource): string | null {
  if (resource.youtubeVideoId || resource.resourceType === "youtube") {
    const id = resource.youtubeVideoId || resource.url.match(/[a-zA-Z0-9_-]{11}/)?.[0];
    if (id) return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
  }
  if (resource.url.includes("drive.google.com") || resource.url.includes("docs.google.com")) {
    return resource.url.replace(/\/view.*$/, "/preview").replace(/\/edit.*$/, "/preview");
  }
  return null;
}

export default function Resources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";

  const [activeResource, setActiveResource] = useState<CourseResource | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    resourceType: "youtube",
    url: "",
    isPublic: true,
    sortOrder: 0,
  });

  const { data, isLoading } = useQuery<ResourcesResponse>({
    queryKey: ["/api/resources"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newResource) => {
      const res = await apiRequest("POST", "/api/resources", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({ title: "Recurso agregado" });
      setShowCreate(false);
      setNewResource({ title: "", description: "", resourceType: "youtube", url: "", isPublic: true, sortOrder: 0 });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/resources/${id}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({ title: "Recurso eliminado" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resources = data?.resources ?? [];

  return (
    <Layout>
      <div className="space-y-6 pb-24 md:pb-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground">Materiales de Aprendizaje</h1>
              <p className="text-sm text-muted-foreground">Videos de YouTube, documentos Drive y más</p>
            </div>
          </div>
          {isAdmin && (
            <Button data-testid="button-add-resource" size="sm" className="gap-2" onClick={() => setShowCreate(!showCreate)}>
              <Plus className="w-4 h-4" /> Agregar
            </Button>
          )}
        </div>

        {/* Create form (admin only) */}
        {showCreate && isAdmin && (
          <div className="border-2 border-primary/20 rounded-2xl p-4 space-y-3 bg-primary/5">
            <h3 className="font-bold">Nuevo material</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Título *</Label>
                <Input data-testid="input-resource-title" placeholder="Inglés básico - Saludos" value={newResource.title} onChange={e => setNewResource(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <select data-testid="select-resource-type" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={newResource.resourceType} onChange={e => setNewResource(p => ({ ...p, resourceType: e.target.value }))}>
                  <option value="youtube">YouTube</option>
                  <option value="drive">Google Drive</option>
                  <option value="document">Documento</option>
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">
                  URL *
                  {newResource.resourceType === "youtube" && " (ej: https://youtube.com/watch?v=XXXXXXX)"}
                  {newResource.resourceType === "drive" && " (ej: https://drive.google.com/file/d/ID/view)"}
                </Label>
                <Input data-testid="input-resource-url" placeholder="https://..." value={newResource.url} onChange={e => setNewResource(p => ({ ...p, url: e.target.value }))} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Descripción</Label>
                <Input data-testid="input-resource-desc" placeholder="Descripción del material..." value={newResource.description} onChange={e => setNewResource(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button data-testid="button-save-resource" size="sm" disabled={createMutation.isPending || !newResource.title || !newResource.url} onClick={() => createMutation.mutate(newResource)}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Guardar
              </Button>
            </div>
          </div>
        )}

        {/* Active viewer */}
        {activeResource && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActiveResource(null)}>
            <div className="bg-card rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h3 className="font-bold text-base truncate">{activeResource.title}</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveResource(null)}><X className="w-4 h-4" /></Button>
              </div>
              {(() => {
                const embedUrl = buildEmbedUrl(activeResource);
                if (embedUrl) {
                  return (
                    <div className="relative" style={{ paddingBottom: "56.25%" }}>
                      <iframe
                        src={embedUrl}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        title={activeResource.title}
                      />
                    </div>
                  );
                }
                return (
                  <div className="p-8 text-center">
                    <a href={activeResource.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold flex items-center justify-center gap-2">
                      <ExternalLink className="w-5 h-5" /> Abrir recurso externo
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Resources Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-5">
              <BookOpen className="w-9 h-9 text-muted-foreground opacity-40" />
            </div>
            <h3 className="text-lg font-bold text-muted-foreground mb-2">Sin materiales aún</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {isAdmin
                ? "Agrega videos de YouTube, archivos de Google Drive o documentos para los estudiantes."
                : "Próximamente el equipo subirá videos, guías y materiales para tu aprendizaje."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((res, idx) => {
              const embedUrl = buildEmbedUrl(res);
              const isYouTube = res.resourceType === "youtube" || !!res.youtubeVideoId;
              const ytId = res.youtubeVideoId || (isYouTube ? res.url.match(/[a-zA-Z0-9_-]{11}/)?.[0] : null);
              const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

              return (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  data-testid={`card-resource-${res.id}`}
                  className="bg-card border-2 border-border hover:border-primary/40 hover:shadow-md transition-all rounded-2xl overflow-hidden flex flex-col cursor-pointer group"
                  onClick={() => setActiveResource(res)}
                >
                  {/* Thumbnail */}
                  <div className="h-36 bg-muted relative overflow-hidden">
                    {thumb ? (
                      <img src={thumb} alt={res.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm">
                          {TYPE_ICONS[res.resourceType] ?? <FileText className="w-6 h-6 text-muted-foreground" />}
                        </div>
                      </div>
                    )}
                    {isYouTube && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 text-white ml-1" fill="white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className="text-[10px] bg-black/60 text-white border-0 backdrop-blur-sm">
                        {TYPE_LABELS[res.resourceType] ?? res.resourceType}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-sm mb-1 line-clamp-2 flex-1">{res.title}</h3>
                    {res.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{res.description}</p>}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                        {TYPE_ICONS[res.resourceType]}
                        <span>Ver recurso</span>
                      </div>
                      {isAdmin && (
                        <Button
                          data-testid={`btn-delete-resource-${res.id}`}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                          onClick={e => { e.stopPropagation(); deleteMutation.mutate(res.id); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
