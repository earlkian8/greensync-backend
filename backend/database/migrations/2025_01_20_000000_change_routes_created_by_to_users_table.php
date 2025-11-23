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
        Schema::table('routes', function (Blueprint $table) {
            // Drop the old foreign key constraint
            $table->dropForeign(['created_by']);
        });

        Schema::table('routes', function (Blueprint $table) {
            // Change the foreign key to reference users table
            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('routes', function (Blueprint $table) {
            // Drop the users foreign key
            $table->dropForeign(['created_by']);
        });

        Schema::table('routes', function (Blueprint $table) {
            // Restore the residents foreign key
            $table->foreign('created_by')
                ->references('id')
                ->on('residents')
                ->onDelete('cascade');
        });
    }
};

