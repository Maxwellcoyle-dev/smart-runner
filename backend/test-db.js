// Test database connection to Supabase
require("dotenv").config();
const { pool } = require("./config/database");

async function testConnection() {
  try {
    console.log("Testing database connection...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✅ Set" : "❌ Missing");

    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful!");
    console.log("Current time:", result.rows[0].now);

    // Test users table
    const usersResult = await pool.query("SELECT COUNT(*) FROM users");
    console.log("✅ Users table exists, row count:", usersResult.rows[0].count);

    // Test subscription plans
    const plansResult = await pool.query(
      "SELECT tier, price_monthly FROM subscription_plans ORDER BY price_monthly"
    );
    console.log("✅ Subscription plans found:", plansResult.rows.length);
    plansResult.rows.forEach((plan) => {
      console.log(`   - ${plan.tier}: $${plan.price_monthly}`);
    });

    // Test all tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log("\n✅ All tables:");
    tablesResult.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    await pool.end();
    console.log("\n✅ All tests passed! Database is ready.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Check your DATABASE_URL in .env file");
    console.error("2. Verify you ran the migration script in Supabase");
    console.error("3. Check your Supabase project settings");
    process.exit(1);
  }
}

testConnection();

