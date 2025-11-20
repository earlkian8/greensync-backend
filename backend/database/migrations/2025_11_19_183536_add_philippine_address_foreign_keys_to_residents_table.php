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
        Schema::table('residents', function (Blueprint $table) {
            // Add foreign key columns for Philippine addresses
            $table->unsignedBigInteger('region_id')->nullable()->after('country');
            $table->unsignedBigInteger('province_id')->nullable()->after('region_id');
            $table->unsignedBigInteger('city_id')->nullable()->after('province_id');
            $table->unsignedBigInteger('barangay_id')->nullable()->after('city_id');
            
            // Add foreign key constraints
            $table->foreign('region_id')->references('id')->on('philippine_regions')->onDelete('set null');
            $table->foreign('province_id')->references('id')->on('philippine_provinces')->onDelete('set null');
            $table->foreign('city_id')->references('id')->on('philippine_cities')->onDelete('set null');
            $table->foreign('barangay_id')->references('id')->on('philippine_barangays')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('residents', function (Blueprint $table) {
            // Drop foreign key constraints first
            $table->dropForeign(['region_id']);
            $table->dropForeign(['province_id']);
            $table->dropForeign(['city_id']);
            $table->dropForeign(['barangay_id']);
            
            // Drop columns
            $table->dropColumn(['region_id', 'province_id', 'city_id', 'barangay_id']);
        });
    }
};
