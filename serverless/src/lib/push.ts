import type { Bindings } from "../types/app";

export const pushToUser = async (
  env: Bindings,
  username: string,
  type: string,
  data: unknown,
) => {
  try {
    const doId = env.USER_ROOM.idFromName(`user-${username}`);
    const stub = env.USER_ROOM.get(doId);
    await stub.fetch("http://do/push", {
      method: "POST",
      body: JSON.stringify({ type, data, username }),
    });
  } catch (error) {
    console.error(`[push] failed to push to ${username}:`, error);
  }
};

export const pushToUsers = async (
  env: Bindings,
  usernames: string[],
  type: string,
  data: unknown,
) => {
  await Promise.allSettled(
    usernames.map((username) => pushToUser(env, username, type, data)),
  );
};
