import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';
import type {
  Directory,
  DocumentWithTags,
  Settings,
  SyncResult,
  Tag,
  TreeNode
} from './types.js';

export function useTree()
{
  return useQuery({
    queryKey: ['tree'],
    queryFn: () => api.get<{ tree: TreeNode[] }>('/api/tree').then((body) => body.tree)
  });
}

export function useDocument(id: string | undefined)
{
  return useQuery({
    queryKey: ['doc', id],
    enabled: id !== undefined,
    queryFn: () =>
      api.get<{ document: DocumentWithTags; html: string }>(`/api/documents/${id}?include=html`)
  });
}

export function useTags()
{
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<{ tags: Tag[] }>('/api/tags').then((body) => body.tags)
  });
}

export function useSettings()
{
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ settings: Settings }>('/api/settings').then((body) => body.settings)
  });
}

function useInvalidate(...keys: string[][])
{
  const client = useQueryClient();
  return () =>
  {
    for (const key of keys)
    {
      void client.invalidateQueries({ queryKey: key });
    }
  };
}

export function useUploadDocuments()
{
  const invalidate = useInvalidate(['tree']);
  return useMutation({
    mutationFn: (input: { files: File[]; directoryId?: string | null }) =>
    {
      const url = input.directoryId
        ? `/api/documents?directoryId=${input.directoryId}`
        : '/api/documents';
      return api.upload<{ documents: DocumentWithTags[] }>(url, input.files);
    },
    onSuccess: invalidate
  });
}

export function usePatchDocument()
{
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      filename?: string;
      directoryId?: string | null;
      tagIds?: string[];
    }) =>
    {
      const { id, ...body } = input;
      return api.patch<{ document: DocumentWithTags }>(`/api/documents/${id}`, body);
    },
    onSuccess: (_data, variables) =>
    {
      void client.invalidateQueries({ queryKey: ['tree'] });
      void client.invalidateQueries({ queryKey: ['doc', variables.id] });
    }
  });
}

export function useDeleteDocument()
{
  const invalidate = useInvalidate(['tree']);
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/documents/${id}`),
    onSuccess: invalidate
  });
}

export function useCreateDirectory()
{
  const invalidate = useInvalidate(['tree']);
  return useMutation({
    mutationFn: (input: { name: string; parentId?: string | null }) =>
      api.post<{ directory: Directory }>('/api/directories', input),
    onSuccess: invalidate
  });
}

export function usePatchDirectory()
{
  const invalidate = useInvalidate(['tree']);
  return useMutation({
    mutationFn: (input: { id: string; name?: string; parentId?: string | null }) =>
    {
      const { id, ...body } = input;
      return api.patch<{ directory: Directory }>(`/api/directories/${id}`, body);
    },
    onSuccess: invalidate
  });
}

export function useDeleteDirectory()
{
  const invalidate = useInvalidate(['tree']);
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/directories/${id}`),
    onSuccess: invalidate
  });
}

export function useCreateTag()
{
  const invalidate = useInvalidate(['tags'], ['tree']);
  return useMutation({
    mutationFn: (input: { name: string; color: string }) =>
      api.post<{ tag: Tag }>('/api/tags', input),
    onSuccess: invalidate
  });
}

export function useUpdateTag()
{
  const invalidate = useInvalidate(['tags'], ['tree'], ['doc']);
  return useMutation({
    mutationFn: (input: { id: string; name?: string; color?: string }) =>
    {
      const { id, ...body } = input;
      return api.patch<{ tag: Tag }>(`/api/tags/${id}`, body);
    },
    onSuccess: invalidate
  });
}

export function useDeleteTag()
{
  const invalidate = useInvalidate(['tags'], ['tree'], ['doc']);
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/tags/${id}`),
    onSuccess: invalidate
  });
}

export function usePutSettings()
{
  const client = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<Settings>) =>
      api.put<{ settings: Settings }>('/api/settings', settings),
    onSuccess: (data) =>
    {
      client.setQueryData(['settings'], data.settings);
    }
  });
}

export function useSync()
{
  const invalidate = useInvalidate(['tree']);
  return useMutation({
    mutationFn: () => api.post<SyncResult>('/api/sync', {}),
    onSuccess: invalidate
  });
}
