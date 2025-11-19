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
        Schema::create('collection_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('residents')
                ->onDelete('cascade');

            $table->foreignId('bin_id')
                ->constrained('waste_bins')
                ->onDelete('cascade');

            $table->string('request_type', 255);
            $table->text('description')->nullable();
            $table->date('preferred_date')->nullable();
            $table->time('preferred_time')->nullable();

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->enum('waste_type', [
                'biodegradable', 'non-biodegradable', 'recyclable', 'special', 'all'
            ])->default('all');

            $table->string('image_url', 255)->nullable();

            $table->enum('priority', [
                'low', 'medium', 'high', 'urgent'
            ])->default('medium');

            $table->enum('status', [
                'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
            ])->default('pending');

            $table->foreignId('assigned_collector_id')
                ->nullable()
                ->constrained('collectors')
                ->onDelete('set null');

            $table->text('resolution_notes')->nullable();
            $table->timestamps();
            $table->timestamp('completed_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collection_requests');
    }
};
