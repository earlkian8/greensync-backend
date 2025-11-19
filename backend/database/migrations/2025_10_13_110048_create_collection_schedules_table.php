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
        Schema::create('collection_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('barangay', 100);
            
            $table->enum('collection_day', [
                'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
            ]);

            $table->time('collection_time');

            $table->enum('waste_type', [
                'biodegradable', 'non-biodegradable', 'recyclable', 'special', 'all'
            ])->default('all');

            $table->enum('frequency', [
                'weekly', 'bi-weekly', 'monthly'
            ])->default('weekly');

            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();

            $table->foreignId('created_by')
                ->constrained('residents')
                ->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collection_schedules');
    }
};
