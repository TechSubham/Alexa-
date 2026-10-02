import { fetchRecipeByName } from "./src/data/mealApi.ts";

const r = await fetchRecipeByName("Chicken Handi");
console.log(JSON.stringify(r, null, 2));
