import z from "zod";

const envSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_APP_NAME: z.string().min(1),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  console.error(
    "Invalid environment variables:\n",
    parsedEnv.error.issues
      .map((issue) => `${issue.path.toLocaleString()}: ${issue.message}`)
      .join("\n")
  );

  throw new Error("Invalid environment variables"); // Throw an error to stop the app from rendering
}

export const env = parsedEnv.data;
