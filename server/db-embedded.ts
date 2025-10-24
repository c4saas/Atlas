// WARNING: Hardcoding credentials is insecure. Prefer environment variables.
// If you still need to embed, put your full Postgres connection string here.
// Example: "postgresql://user:pass@host:5432/dbname?sslmode=require"

// Using URL-encoded username because it contains '@'
export const EMBEDDED_DATABASE_URL = "postgresql://support%40c4saas.com:4dminB0ss@168.231.73.218:5432/atlas?sslmode=require";
