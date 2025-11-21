<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if bin_id column already exists
        if (!Schema::hasColumn('route_stops', 'bin_id')) {
            Schema::table('route_stops', function (Blueprint $table) {
                $table->foreignId('bin_id')
                    ->nullable()
                    ->after('route_id')
                    ->constrained('waste_bins')
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('route_stops', 'bin_id')) {
            Schema::table('route_stops', function (Blueprint $table) {
                $table->dropForeign(['bin_id']);
                $table->dropColumn('bin_id');
            });
        }
    }
};
