import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: "postgresql://postgres:mysecretpassword@localhost:5432/taskflow?schema=public",
  },
});