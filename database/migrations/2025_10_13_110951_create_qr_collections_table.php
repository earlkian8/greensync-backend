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
        Schema::create('qr_collections', function (Blueprint $table) {
            $table->id();

            $table->foreignId('bin_id')
                ->constrained('waste_bins')
                ->onDelete('cascade');

            $table->foreignId('collector_id')
                ->constrained('collectors')
                ->onDelete('cascade');

            $table->foreignId('assignment_id')
                ->constrained('route_assignments')
                ->onDelete('cascade');

            $table->string('qr_code', 255);
            $table->timestamp('collection_timestamp')->useCurrent();

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('waste_weight', 8, 2)->nullable();

            $table->enum('waste_type', [
                'biodegradable', 'non-biodegradable', 'recyclable', 'special', 'all'
            ])->default('all');

            $table->enum('collection_status', [
                'successful', 'skipped', 'failed'
            ])->default('successful');

            $table->text('skip_reason')->nullable();
            $table->string('photo_url', 255)->nullable();
            $table->text('notes')->nullable();

            $table->boolean('is_verified')->default(false);

            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('residents')
                ->onDelete('set null');

            $table->timestamp('verified_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('qr_collections');
    }
};
