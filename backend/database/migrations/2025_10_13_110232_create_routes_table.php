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
        Schema::create('routes', function (Blueprint $table) {
            $table->id();
            $table->string('route_name', 255);
            $table->string('barangay', 100);
            $table->integer('estimated_duration')->nullable();
            $table->integer('total_stops')->default(0);
            $table->text('route_map_data')->nullable();
            $table->boolean('is_active')->default(true);

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
        Schema::dropIfExists('routes');
    }
};
