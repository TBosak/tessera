import { queries } from '../db/database.js';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

export function generateUniqueSlug(title: string): string {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;
  
  // Check if slug already exists and increment counter if needed
  while (queries.getElectionBySlug.get(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}