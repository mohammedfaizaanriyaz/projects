import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  CircleUserRound,
  CookingPot,
  Gauge,
  History,
  LayoutDashboard,
  ListChecks,
  Ruler,
  Salad,
  Settings,
  Sparkles,
  Target,
  UtensilsCrossed,
  Weight
} from "lucide-react";

export const NAVIGATION = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    page: "dashboard"
  },
  {
    label: "Profiles",
    icon: CircleUserRound,
    page: "profiles"
  },
  {
    label: "Health",
    icon: Activity,
    children: [
      {
        label: "Overview",
        icon: Gauge,
        page: "health"
      },
      {
        label: "Weight tracker",
        icon: Weight,
        page: "weight"
      },
      {
        label: "Measurements",
        icon: Ruler,
        page: "measurements"
      },
      {
        label: "Body metrics",
        icon: Target,
        page: "body-metrics"
      },
      { label: "Fitness goals", icon: Target, page: "goals" }
    ]
  },
  {
    label: "Nutrition",
    icon: Salad,
    children: [
      {
        label: "Calculator",
        icon: Sparkles,
        page: "nutrition"
      },
      {
        label: "Meal builder",
        icon: UtensilsCrossed,
        page: "meals"
      },
      {
        label: "Daily log",
        icon: History,
        page: "meal-history"
      },
      {
        label: "Recipes",
        icon: CookingPot,
        page: "recipes"
      }
    ]
  },
  {
    label: "Tasks & routines",
    icon: ListChecks,
    page: "tasks"
  },
  {
    label: "Reminders",
    icon: Bell,
    page: "reminders"
  },
  {
    label: "Progress",
    icon: ChartNoAxesCombined,
    page: "progress"
  },
  {
    label: "Settings",
    icon: Settings,
    page: "settings"
  }
];
