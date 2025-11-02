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
        Schema::create('waste_bins', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255)->nullable(false);
            $table->string('qr_code', 255)->unique();
            $table->foreignId('resident_id')->constrained('residents')->onDelete('cascade');
            $table->enum('bin_type', ['biodegradable', 'non-biodegradable', 'recyclable', 'hazardous'])
                  ->default('biodegradable');
            $table->enum('status', ['active', 'inactive', 'damaged', 'full'])
                  ->default('active');

            $table->timestamp('registered_at')->useCurrent();
            $table->timestamp('last_collected')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waste_bins');
    }
};
