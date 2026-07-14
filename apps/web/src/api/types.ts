export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';

export interface Tag
{
  id: string;
  name: string;
  color: string;
}

export interface DocumentWithTags
{
  id: string;
  directoryId: string | null;
  title: string;
  filename: string;
  relPath: string;
  size: number;
  missing: boolean;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

export interface Directory
{
  id: string;
  parentId: string | null;
  name: string;
  createdAt: string;
}

export interface TreeDirectoryNode
{
  type: 'directory';
  directory: Directory;
  children: TreeNode[];
}

export interface TreeDocumentNode
{
  type: 'document';
  document: DocumentWithTags;
}

export type TreeNode = TreeDirectoryNode | TreeDocumentNode;

export interface Settings
{
  theme: ThemePreference;
}

export interface SyncResult
{
  added: number;
  restored: number;
  markedMissing: number;
}

export interface AuthState
{
  authenticated: boolean;
  username?: string;
}
