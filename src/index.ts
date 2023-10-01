import { autoroutes } from "elysia-autoroutes";

import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";

import { Lucia } from "@elysiajs/lucia-auth";

import { postgres } from "@lucia-auth/adapter-postgresql";
import { queryClient } from "./drizzle";

const { lucia, oauth, elysia } = Lucia({
  adapter: postgres(queryClient, {
    key: "user_key",
    session: "user_session",
    user: "user",
  }),
});

const auth = new Elysia({ prefix: "/auth" })
  .use(elysia)
  .use(
    oauth.github({
      clientId: process.env.GH_CLIENT_ID!,
      clientSecret: process.env.GH_CLIENT_SECRET!,
    })
  )
  .guard(
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    },
    (app) =>
      app
        .put("/sign-up", async ({ body, user }) => user.signUp(body))
        .post("/sign-in", async ({ user, body: { username, password } }) => {
          await user.signIn(username, password);

          return `Sign in as ${username}`;
        })
  )
  .guard(
    {
      beforeHandle: ({ user: { validate } }) => validate(),
    },
    (app) =>
      app
        .get("/profile", ({ user }) => user.data)
        .get("/refresh", async ({ user }) => {
          await user.refresh();

          return user.data;
        })
        .get("/sign-out", async ({ user }) => {
          await user.signOut();

          return "Signed out";
        })
  );

const app = new Elysia()
  .use(elysia)
  .onBeforeHandle(async ({ path, user }) => {
    switch (path) {
      case "/swagger":
      case "/swagger/json":
        await user.validate();
    }
  })
  .use(swagger())
  .use(auth)
  .listen(3000, ({ hostname, port }) => {
    console.log(`🦊 Elysia is running at ${hostname}:${port}`);
  });

export type ElysiaApp = typeof app;
