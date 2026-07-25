import type { WorldEvent } from "../types";

export const WORLD_INTERACT_EVENT = "proof-of-quest:interact";

export function emitWorldInteraction(zone: WorldEvent["zone"]) {
  window.dispatchEvent(
    new CustomEvent<WorldEvent>(WORLD_INTERACT_EVENT, { detail: { zone } }),
  );
}
