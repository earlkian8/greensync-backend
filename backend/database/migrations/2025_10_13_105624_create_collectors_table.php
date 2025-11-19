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
        Schema::create('collectors', function (Blueprint $table) {
            $table->id();
            $table->string('email', 255)->unique();
            $table->string('phone_number', 20)->unique();
            $table->string('password', 255);
            $table->string('name', 255);
            $table->integer('employee_id')->unique();
            $table->string('license_number', 50)->nullable();
            $table->string('vehicle_plate_number', 20)->nullable();
            $table->string('vehicle_type', 50)->nullable();
            $table->string('profile_image', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collectors');
    }
};
