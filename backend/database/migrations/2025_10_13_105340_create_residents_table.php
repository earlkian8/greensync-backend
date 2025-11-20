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
         Schema::create('residents', function (Blueprint $table) {
            $table->id();
            $table->string('email', 255)->unique();
            $table->string('phone_number', 20)->unique();
            $table->string('password', 255);
            $table->string('name', 255);
            $table->string('house_no', 50)->nullable();
            $table->string('street', 255)->nullable();
            $table->string('barangay', 100);
            $table->string('city', 100);
            $table->string('province', 100);
            $table->string('country', 100);
            $table->string('postal_code', 10);
            $table->string('profile_image', 255)->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('residents');
    }
};
