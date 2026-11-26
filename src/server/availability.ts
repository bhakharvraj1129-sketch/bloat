import "server-only";
import { env } from "./env";
import { config, type FeatureKey } from "@/lib/registry";
import { featuresOffFrom } from "@/lib/availability";

/**
 * Features switched off for this deployment: the keys in BLOAT_OFF_FEATURES, plus every AI feature
 * when BLOAT_AI_PROVIDER=off (rule in lib/availability.ts). Nothing is off unless a deployment says so.
 */
export function featuresOff(): FeatureKey[] {
  return featuresOffFrom(env.offFeatures, env.aiProvider, Object.keys(config.features)) as FeatureKey[];
}
export const featureOff = (key: FeatureKey) => featuresOff().includes(key);
