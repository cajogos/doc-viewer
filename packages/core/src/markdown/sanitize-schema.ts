import type { Schema } from 'hast-util-sanitize';
import { defaultSchema } from 'rehype-sanitize';

// GitHub's sanitisation schema already permits GFM output (tables, task-list
// checkboxes, del, language- classes on code). Kept as a named module so the
// schema can be extended in one place if rendering needs grow.
export const sanitizeSchema: Schema = {
  ...defaultSchema
};
