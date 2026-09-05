export function getDatabaseUrl() {
  const known = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ].find(Boolean);

  if (known) return known.trim();

  const prefixed = Object.entries(process.env).find(
    ([name, value]) =>
      (name.endsWith("_DATABASE_URL") || name.endsWith("_POSTGRES_URL")) &&
      typeof value === "string" &&
      value.startsWith("postgres"),
  );

  return prefixed?.[1]?.trim();
}
