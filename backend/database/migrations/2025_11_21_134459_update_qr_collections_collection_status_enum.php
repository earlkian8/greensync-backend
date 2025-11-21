<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();
        
        if ($driver === 'mysql' || $driver === 'mariadb') {
            // For MySQL/MariaDB
            DB::statement("ALTER TABLE qr_collections MODIFY COLUMN collection_status ENUM('successful', 'collected', 'manual', 'completed', 'skipped', 'failed') DEFAULT 'successful'");
        } elseif ($driver === 'pgsql') {
            // For PostgreSQL
            // Laravel's enum() creates a CHECK constraint, not an enum type
            // We need to drop the old constraint and create a new one with all allowed values
            
            // Drop the existing check constraint if it exists
            DB::statement("
                ALTER TABLE qr_collections 
                DROP CONSTRAINT IF EXISTS qr_collections_collection_status_check
            ");
            
            // Create new check constraint with all allowed values
            DB::statement("
                ALTER TABLE qr_collections 
                ADD CONSTRAINT qr_collections_collection_status_check 
                CHECK (collection_status IN ('successful', 'collected', 'manual', 'completed', 'skipped', 'failed'))
            ");
        } elseif ($driver === 'sqlite') {
            // SQLite doesn't support ENUM, so we need to recreate the table
            // This is a simplified approach - in production, you might want to handle this differently
            Schema::table('qr_collections', function (Blueprint $table) {
                // SQLite doesn't support modifying enum columns directly
                // The enum constraint is typically handled at the application level
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();
        
        if ($driver === 'mysql' || $driver === 'mariadb') {
            // Revert to original enum values
            DB::statement("ALTER TABLE qr_collections MODIFY COLUMN collection_status ENUM('successful', 'skipped', 'failed') DEFAULT 'successful'");
        } elseif ($driver === 'pgsql') {
            // Revert to original check constraint
            DB::statement("
                ALTER TABLE qr_collections 
                DROP CONSTRAINT IF EXISTS qr_collections_collection_status_check
            ");
            
            DB::statement("
                ALTER TABLE qr_collections 
                ADD CONSTRAINT qr_collections_collection_status_check 
                CHECK (collection_status IN ('successful', 'skipped', 'failed'))
            ");
        }
    }
};
