import { getActionUsageScores, getFavoriteItems, getRecentItems } from "./storage";
import type { CommandCenterResult } from "./types";

const USAGE_BOOST_CAP = 40;
const USAGE_BOOST_PER_USE = 5;
const RECENT_ACTION_BOOST = 18;
const FAVORITE_BOOST = 12;

/** Raise frequently used / recent / favorite actions automatically. */
export function applyUsageRanking(items: CommandCenterResult[]): CommandCenterResult[] {
  const usage = getActionUsageScores();
  const recentKeys = new Set(getRecentItems().slice(0, 6).map((item) => item.key));
  const favoriteKeys = new Set(getFavoriteItems().map((item) => item.key));

  return items
    .map((item) => {
      const usageKey = item.favoriteKey ?? item.id;
      const uses = usage[usageKey] ?? 0;
      const usageBoost = Math.min(uses * USAGE_BOOST_PER_USE, USAGE_BOOST_CAP);
      const recentBoost = recentKeys.has(usageKey) ? RECENT_ACTION_BOOST : 0;
      const favoriteBoost = favoriteKeys.has(usageKey) ? FAVORITE_BOOST : 0;
      return {
        ...item,
        score: item.score + usageBoost + recentBoost + favoriteBoost
      };
    })
    .sort((left, right) => right.score - left.score);
}
