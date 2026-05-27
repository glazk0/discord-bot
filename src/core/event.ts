import type { ClientEvents } from "discord.js";

export interface Event {
  name: keyof ClientEvents;
  once?: boolean;
  execute(...args: never[]): Promise<void> | void;
}

export function defineEvent<K extends keyof ClientEvents>(event: {
  name: K;
  once?: boolean;
  execute(...args: ClientEvents[K]): Promise<void> | void;
}): Event {
  return event as unknown as Event;
}
