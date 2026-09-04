export function getBlobCredentials() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim();

  return {
    options: token
      ? { token }
      : oidcToken && storeId
        ? { oidcToken, storeId }
        : {},
    status: {
      token: Boolean(token),
      oidc: Boolean(oidcToken),
      store: Boolean(storeId),
      environment: process.env.VERCEL_ENV || "unknown",
    },
  };
}
