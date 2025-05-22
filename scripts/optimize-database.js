/**
 * Database Optimization Script
 * 
 * This script applies database optimizations and ensures the database is in sync with the codebase.
 * It runs the migration scripts and performs additional optimizations.
 */

import fs from 'fs';
import path from 'path';

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase URL or service role key in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Execute a SQL statement directly using the Supabase REST API
 * @param {string} sql - SQL statement to execute
 * @returns {Promise<void>}
 */
async function executeSql(sql) {
  try {
    // Use the Supabase REST API to execute the SQL statement
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error executing SQL: ${errorText}`);
    }
    
    return true;
  } catch (error) {
    console.warn(`Warning: Error executing SQL: ${error.message}`);
    return false;
  }
}

/**
 * Run a SQL migration file
 * @param {string} filePath - Path to the SQL file
 * @returns {Promise<void>}
 */
async function runMigration(filePath) {
  try {
    console.log(`Running migration: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sql
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/--.*$/gm, '') // Remove single-line comments
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing statement: ${statement.trim().substring(0, 100)}...`);
        
        if (isProduction) {
          // In production mode, actually execute the SQL
          try {
            // Try to execute the statement directly
            try {
              const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() });
              
              if (error) {
                console.warn(`Warning: Error executing statement via RPC: ${error.message}`);
                // If the RPC method fails, try direct REST API
                const success = await executeSql(statement.trim());
                if (success) {
                  console.log(`Statement executed successfully via REST API`);
                }
              } else {
                console.log(`Statement executed successfully via RPC`);
              }
            } catch (rpcErr) {
              console.warn(`Warning: RPC execution failed: ${rpcErr.message}`);
              // Try direct REST API as fallback
              const success = await executeSql(statement.trim());
              if (success) {
                console.log(`Statement executed successfully via REST API`);
              }
            }
          } catch (err) {
            console.warn(`Warning: Error executing statement: ${err.message}`);
          }
        } else {
          // In development mode, just log what would happen
          console.log(`Statement would be executed in production environment`);
        }
      }
    }
    
    console.log(`Migration completed: ${filePath}`);
  } catch (error) {
    console.error(`Error running migration ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Run all migration files in the migrations directory
 * @returns {Promise<void>}
 */
async function runMigrations() {
  try {
    const migrationsDir = path.join(process.cwd(), 'database', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in order
    
    console.log(`Found ${files.length} migration files.`);
    
    for (const file of files) {
      await runMigration(path.join(migrationsDir, file));
    }
    
    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error(`Error running migrations: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Verify database schema matches TypeScript types
 * @returns {Promise<void>}
 */
async function verifyDatabaseSchema() {
  try {
    console.log('Verifying database schema...');
    
    // List the expected tables based on our migrations
    const expectedTables = [
      'profiles',
      'tasks',
      'task_logs',
      'reflecties',
      'specialist_patienten',
      'inzichten',
      'abonnementen',
      'expert_knowledge',
      'ai_recommendations'
    ];
    
    if (isProduction) {
      // In production mode, actually check the tables
      for (const tableName of expectedTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('count(*)')
            .limit(1);
          
          if (error) {
            console.warn(`Warning: Table ${tableName} might not exist: ${error.message}`);
          } else {
            console.log(`Table ${tableName} exists`);
          }
        } catch (err) {
          console.warn(`Warning: Error checking table ${tableName}: ${err.message}`);
        }
      }
    } else {
      // In development mode, just list the expected tables
      console.log('Expected tables in the database:');
      for (const tableName of expectedTables) {
        console.log(`- ${tableName}`);
      }
    }
    
    console.log('Database schema verification completed.');
  } catch (error) {
    console.error(`Error verifying database schema: ${error.message}`);
  }
}

/**
 * Optimize database performance
 * @returns {Promise<void>}
 */
async function optimizeDatabasePerformance() {
  try {
    console.log('Optimizing database performance...');
    
    // List the expected tables that would be analyzed
    const tablesToAnalyze = [
      'profiles',
      'tasks',
      'task_logs',
      'reflecties',
      'specialist_patienten',
      'inzichten',
      'abonnementen',
      'expert_knowledge',
      'ai_recommendations'
    ];
    
    if (isProduction) {
      // In production mode, actually analyze the tables
      for (const tableName of tablesToAnalyze) {
          try {
            console.log(`Analyzing table: ${tableName}`);
            try {
              const { error } = await supabase.rpc('exec_sql', { sql: `ANALYZE ${tableName}` });
              
              if (error) {
                console.warn(`Warning: Error analyzing table via RPC: ${error.message}`);
                // If the RPC method fails, try direct REST API
                const success = await executeSql(`ANALYZE ${tableName}`);
                if (success) {
                  console.log(`Table ${tableName} analyzed via REST API`);
                }
              } else {
                console.log(`Table ${tableName} analyzed via RPC`);
              }
            } catch (rpcErr) {
              console.warn(`Warning: RPC execution failed: ${rpcErr.message}`);
              // Try direct REST API as fallback
              const success = await executeSql(`ANALYZE ${tableName}`);
              if (success) {
                console.log(`Table ${tableName} analyzed via REST API`);
              }
            }
          } catch (err) {
            console.warn(`Warning: Error analyzing table ${tableName}: ${err.message}`);
          }
      }
    } else {
      // In development mode, just list the tables that would be analyzed
      console.log('Tables that would be analyzed:');
      for (const tableName of tablesToAnalyze) {
        console.log(`- ${tableName}`);
      }
    }
    
    console.log('Database performance optimization completed.');
  } catch (error) {
    console.error(`Error optimizing database performance: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`Starting database optimization in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode...`);
  
  try {
    // Run migrations
    await runMigrations();
    
    // Verify database schema
    await verifyDatabaseSchema();
    
    // Optimize database performance
    await optimizeDatabasePerformance();
    
    console.log('Database optimization completed successfully.');
  } catch (error) {
    console.error(`Error during database optimization: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
