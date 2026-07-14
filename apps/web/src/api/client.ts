export class ApiError extends Error
{
  constructor(
    readonly status: number,
    message: string
  )
  {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T>
{
  const response = await fetch(url, init);
  if (!response.ok)
  {
    let message = `Request failed (${response.status})`;
    try
    {
      const body = (await response.json()) as { error?: string };
      if (body.error)
      {
        message = body.error;
      }
    }
    catch
    {
      // keep the generic message
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204)
  {
    return undefined as T;
  }
  return (await response.json()) as T;
}

function jsonInit(method: string, body: unknown): RequestInit
{
  return {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  };
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown) => request<T>(url, jsonInit('POST', body)),
  patch: <T>(url: string, body: unknown) => request<T>(url, jsonInit('PATCH', body)),
  put: <T>(url: string, body: unknown) => request<T>(url, jsonInit('PUT', body)),
  delete: (url: string) => request<undefined>(url, { method: 'DELETE' }),
  upload: <T>(url: string, files: File[]) =>
  {
    const form = new FormData();
    for (const file of files)
    {
      form.append('file', file, file.name);
    }
    return request<T>(url, { method: 'POST', body: form });
  }
};
