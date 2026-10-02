// src/data/cache.ts
import fs from "fs";
import path from "path";
import type { Recipe } from "../types.js";

const CACHE_PATH = path.join(process.cwd(), "src/data/recipe-cache.json");

function loadCache(): Record<string, Recipe> {
  if (!fs.existsSync(CACHE_PATH)) return {};
  return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
}

function saveCache(cache: Record<string, Recipe>) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

export function getCachedRecipe(name: string): Recipe | null {
  const cache = loadCache();
  return cache[name.toLowerCase()] ?? null;
}

export function setCachedRecipe(name: string, recipe: Recipe) {
  const cache = loadCache();
  cache[name.toLowerCase()] = recipe;
  saveCache(cache);
}