import type { IntentType } from ".";
import type SDKApiHandler from "../sdkApiHandler";

/**
 * Live view into the host MoneyHash instance, handed to each plugin via
 * `register(context)`.
 */
export interface PluginContext {
  readonly sdkApiHandler: SDKApiHandler;
  readonly publicApiKey: string | undefined;
  readonly lang: string;
  readonly intentType: IntentType;
}

/**
 * A plugin that can be passed to the headless SDK via `plugins: [...]`.
 *
 * A plugin is passed as an instance — `plugins: [new Agentic()]` — so plugins
 * can accept their own constructor options. On construction the host calls
 * `register(context)` and then exposes the instance on the MoneyHash instance
 * keyed by its `name` (e.g. `moneyHash.agentic`).
 */
export interface MoneyHashPlugin<Name extends string = string> {
  readonly name: Name;
  register(context: PluginContext): void;
}

type UnionToIntersection<Union> = (
  Union extends unknown ? (arg: Union) => void : never
) extends (arg: infer Intersection) => void
  ? Intersection
  : never;

/**
 * Maps a tuple of plugin instances to the shape added to the headless instance,
 * keyed by each plugin's `name` — e.g. `[new Agentic()]` becomes `{ agentic: Agentic }`.
 * Used to type `moneyHash.<plugin>` per instance, derived from the exact
 * `plugins` passed to that `new` call.
 */
export type PluginInstances<TPlugins extends readonly MoneyHashPlugin[]> =
  UnionToIntersection<
    {
      [Index in keyof TPlugins]: TPlugins[Index] extends MoneyHashPlugin<
        infer Name
      >
        ? { [Key in Name]: TPlugins[Index] }
        : never;
    }[number]
  >;
