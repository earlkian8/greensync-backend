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
            // First, add new enum values to the existing type
            DB::statement("ALTER TYPE collection_status_enum ADD VALUE IF NOT EXISTS 'collected'");
            DB::statement("ALTER TYPE collection_status_enum ADD VALUE IF NOT EXISTS 'manual'");
            DB::statement("ALTER TYPE collection_status_enum ADD VALUE IF NOT EXISTS 'completed'");
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
            // Note: PostgreSQL doesn't support removing enum values easily
            // You would need to recreate the enum type, which is complex
            // For now, we'll leave a comment that manual intervention may be needed
            // In production, you might want to handle this more carefully
        }
    }
};
