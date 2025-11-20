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
        Schema::create('route_assignments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('route_id')
                ->constrained('routes')
                ->onDelete('cascade');

            $table->foreignId('collector_id')
                ->constrained('collectors')
                ->onDelete('cascade');

            $table->foreignId('schedule_id')
                ->constrained('collection_schedules')
                ->onDelete('cascade');

            $table->date('assignment_date');
            $table->enum('status', [
                'pending', 'in_progress', 'completed', 'cancelled'
            ])->default('pending');

            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->text('notes')->nullable();

            $table->foreignId('assigned_by')
                ->constrained('users')
                ->onDelete('set null')
                ->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('route_assignments');
    }
};
