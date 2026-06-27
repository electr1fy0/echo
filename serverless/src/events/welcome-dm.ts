import { Events, eventBus } from "../lib/events";
import { getOrCreateConversation, createMessage } from "../services/dms";
import { TURNSOUT_USERNAME } from "../db/seed";

export const registerWelcomeDmHandler = () => {
  eventBus.on<{ username: string }>(Events.UserRegistered, async (data, ctx) => {
    try {
      const conv = await getOrCreateConversation(ctx.db, TURNSOUT_USERNAME, data.username);
      if (!conv) return;

      const welcomeMessage = [
        `Hey @${data.username}! 👋`,
        "",
        "Welcome to **TurnsOut** — your campus community platform!",
        "",
        "Here are a few things you can do to get started:",
        "• **Explore chambers** — Join topic spaces that interest you",
        "• **Ask questions** — Get help from your campus community",
        "• **Find partners** — Use the Partner Finder for projects",
        "• **Trade items** — Buy, sell, and trade on campus",
        "• **Share rides** — Coordinate carpools with fellow students",
        "",
        "If you ever need help, just reply here or check the community guidelines.",
        "",
        "Happy connecting! 🎉",
        "— The TurnsOut Team",
      ].join("\n");

      await createMessage(ctx.db, conv.uid, TURNSOUT_USERNAME, welcomeMessage);
    } catch (error) {
      console.error("[welcome-dm] failed to send welcome message:", error);
    }
  });
};
