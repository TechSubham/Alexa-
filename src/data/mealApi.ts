// src/data/mealApi.ts
import type { Recipe } from "../types.js";
import { getCachedRecipe, setCachedRecipe } from "./cache.js";

export async function fetchRecipeByName(name: string): Promise<Recipe | null> {
  const cached = getCachedRecipe(name);
  if (cached) return cached;

  const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(name)}`);
  const data = await res.json();
  const meal = data.meals?.[0];
  if (!meal) return null;

  const ingredients: { name: string; measure: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) ingredients.push({ name: ing.trim().toLowerCase(), measure: measure?.trim() ?? "" });
  }

  const recipe: Recipe = { name: meal.strMeal, ingredients, instructions: meal.strInstructions };
  setCachedRecipe(name, recipe);
  return recipe;
}