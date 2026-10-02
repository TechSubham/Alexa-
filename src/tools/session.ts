import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { activeSession, setActiveSession } from "../state/store.js";
import { fetchRecipeByName } from "../data/mealApi.js";
import { SUBSTITUTIONS } from "../data/substitutions.js";


function splitIntoSteps(instructions: string): string[] {
  return instructions
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function registerSessionTools(server: McpServer) {
  server.registerTool(
    "startCookingSession",
    {
      description: "Start a guided cooking session for a named recipe",
      inputSchema: { recipeName: z.string() },
    },
    async ({ recipeName }) => {
      const recipe = await fetchRecipeByName(recipeName);
      if (!recipe) {
        return { content: [{ type: "text", text: `Couldn't find a recipe called "${recipeName}".` }] };
      }
      const steps = splitIntoSteps(recipe.instructions);
      setActiveSession({ recipeName: recipe.name, steps, currentStepIndex: 0, activeSubstitutions: {} });
      return { content: [{ type: "text", text: `Started ${recipe.name}. Step 1: ${steps[0]}` }] };
    }
  );

  server.registerTool(
    "advanceStep",
    { description: "Move to the next step in the active cooking session", inputSchema: {} },
    async () => {
      if (!activeSession) return { content: [{ type: "text", text: "No active cooking session." }] };
      activeSession.currentStepIndex++;
      if (activeSession.currentStepIndex >= activeSession.steps.length) {
        return { content: [{ type: "text", text: `${activeSession.recipeName} is done! Enjoy.` }] };
      }
      const step = activeSession.steps[activeSession.currentStepIndex];
      return { content: [{ type: "text", text: `Step ${activeSession.currentStepIndex + 1}: ${step}` }] };
    }
  );

  server.registerTool(
    "substituteIngredient",
    {
      description: "Substitute a missing ingredient mid-recipe; updates remaining steps",
      inputSchema: { missingItem: z.string() },
    },
    async ({ missingItem }) => {
      if (!activeSession) return { content: [{ type: "text", text: "No active cooking session." }] };
      const key = missingItem.toLowerCase();
      const sub = SUBSTITUTIONS[key];
      if (!sub) {
        return { content: [{ type: "text", text: `No safe substitute found for ${missingItem} — I won't guess, since a wrong swap could ruin the dish.` }] };
      }
      activeSession.activeSubstitutions[key] = sub.swap;
      // Rewrite remaining steps so future advanceStep calls already reflect the swap
      for (let i = activeSession.currentStepIndex; i < activeSession.steps.length; i++) {
        activeSession.steps[i] = activeSession.steps[i].replace(new RegExp(missingItem, "gi"), sub.swap);
      }
      return { content: [{ type: "text", text: `Substituting ${missingItem} → ${sub.swap}. ${sub.note}` }] };
    }
  );
}