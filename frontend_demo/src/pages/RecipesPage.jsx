import {
  CookingPot,
  Sparkles
} from "lucide-react";

import GlassCard
  from "../components/ui/GlassCard";

import PageHeader
  from "../components/ui/PageHeader";

export default function RecipesPage() {
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
        </GlassCard>

        <GlassCard>
          <Sparkles
            size={25}
          />
          <h3>
            Dish-name mode
          </h3>
          <p>
            Faster, but the
            backend treats it as
            an estimate because
            recipes vary.
          </p>
        </GlassCard>
      </div>
    </>
  );
}
