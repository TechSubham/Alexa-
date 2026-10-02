import { z } from "zod";
import { randomUUID } from "crypto";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { pantry } from "../state/store.js";
import { fetchRecipeByName } from "../data/mealApi.js";

export function registerPantryTools(server: McpServer) {
  server.registerTool(
    "logPantryItem",
    {
      description: "Add an item to the user's pantry",
      inputSchema: {
        name: z.string(),
        qty: z.number(),
        unit: z.string(),
        expiryDate: z.string().optional(),
      },
    },
    async ({ name, qty, unit, expiryDate }) => {
      pantry.push({ id: randomUUID(), name: name.toLowerCase(), qty, unit, expiryDate });
      return { content: [{ type: "text", text: `Logged ${qty} ${unit} of ${name}.` }] };
    }
  );

  server.registerTool(
    "useItem",
    {
      description: "Decrease the quantity of a pantry item as it's used while cooking",
      inputSchema: { name: z.string(), qty: z.number() },
    },
    async ({ name, qty }) => {
      const item = pantry.find((p) => p.name === name.toLowerCase());
      if (!item) return { content: [{ type: "text", text: `${name} isn't in your pantry.` }] };
      item.qty = Math.max(0, item.qty - qty);
      return { content: [{ type: "text", text: `Used ${qty} of ${name}. Remaining: ${item.qty}.` }] };
    }
  );

  server.registerTool(
    "flagExpiringItems",
    {
      description: "List pantry items expiring within the next 2 days",
      inputSchema: {},
    },
    async () => {
      const soon = pantry.filter((p) => {
        if (!p.expiryDate) return false;
        const daysLeft = (new Date(p.expiryDate).getTime() - Date.now()) / 86400000;
        return daysLeft <= 2;
      });
      const text = soon.length
        ? soon.map((i) => `${i.name} (expires ${i.expiryDate})`).join(", ")
        : "Nothing expiring soon.";
      return { content: [{ type: "text", text }] };
    }
  );

  server.registerTool(
    "analyzeRecipeGap",
    {
      description: "Fetch a recipe by name and compare its ingredients against the pantry",
      inputSchema: { recipeName: z.string() },
    },
    async ({ recipeName }) => {
      const recipe = await fetchRecipeByName(recipeName);
      if (!recipe) {
        return { content: [{ type: "text", text: `Couldn't find a recipe called "${recipeName}".` }] };
      }
      const have = pantry.map((p) => p.name);
      const missing = recipe.ingredients.filter((i) => !have.includes(i.name));
      const text = missing.length
        ? `Missing for ${recipe.name}: ${missing.map((m) => `${m.measure} ${m.name}`).join(", ")}`
        : `You have everything for ${recipe.name}!`;
      return { content: [{ type: "text", text }] };
    }
  );
}