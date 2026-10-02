export interface CookingSession {
  recipeName: string;
  steps: string[];
  currentStepIndex: number;
  activeSubstitutions: Record<string, string>; // original ingredient -> swap, for the rest of the session
}