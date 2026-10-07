import {
  CookingPot,
  Sparkles
} from "lucide-react";

import GlassCard
  from "../components/ui/GlassCard";

import PageHeader
  from "../components/ui/PageHeader";

export default function RecipesPage({ onNavigate }) {
  return (
    <>
      <PageHeader
        eyebrow="Nutrition / recipes"
        title="Recipe analysis"
        subtitle="Use the Meal Builder for ingredient-by-ingredient nutrition."
      />

      <div className="recipe-grid">
        <GlassCard glow>
          <CookingPot
            size={25}
          />
          <h3>
            Ingredient mode
          </h3>
          <p>
            Best when you know
            the actual ingredients
            and quantities.
          </p>
          <button className="text-button" onClick={() => onNavigate("meals")}>Open Meal Builder</button>
        </GlassCard>

        <GlassCard>
          <Sparkles
            size={25}
          />
          <h3>
            Dish-name mode
          </h3>
          <p>
            Search USDA and select the food that matches your dish before calculating its nutrition.
          </p>
          <button className="text-button" onClick={() => onNavigate("nutrition")}>Search foods</button>
        </GlassCard>
      </div>
    </>
  );
}
