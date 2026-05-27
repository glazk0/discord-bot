import { Client, GatewayIntentBits, Options, Partials } from "discord.js";

export function createClient(): Client {
  return new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Channel, Partials.GuildMember, Partials.User],
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      ApplicationCommandManager: 0,
      AutoModerationRuleManager: 0,
      BaseGuildEmojiManager: 0,
      GuildBanManager: 0,
      GuildEmojiManager: 0,
      GuildForumThreadManager: 0,
      GuildInviteManager: 0,
      GuildMemberManager: {
        maxSize: 1,
        keepOverLimit: (member) => member.id === member.client.user.id,
      },
      GuildStickerManager: 0,
      GuildTextThreadManager: 0,
      MessageManager: 0,
      PresenceManager: 0,
      ReactionManager: 0,
      ReactionUserManager: 0,
      StageInstanceManager: 0,
      ThreadManager: 0,
      ThreadMemberManager: 0,
      UserManager: 0,
      VoiceStateManager: 0,
      DMMessageManager: 0,
      GuildMessageManager: 0,
      GuildScheduledEventManager: 0,
    }),
    failIfNotExists: false,
  });
}
