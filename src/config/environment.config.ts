export default () => ({
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_PORT: process.env.DB_PORT,
  OPENAI_KEY: process.env?.OPENAI_KEY,
  SUPABASE_URL: process.env?.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env?.SUPABASE_ANON_KEY,
});
