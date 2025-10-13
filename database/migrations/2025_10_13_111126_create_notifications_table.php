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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();

            // Who receives this notification
            $table->enum('recipient_type', [
                'resident', 'collector', 'all_residents', 'all_collectors', 'specific'
            ])->default('specific');

            // Optional recipient for specific targets
            $table->unsignedBigInteger('recipient_id')->nullable();

            // Sender (could be admin or system)
            $table->unsignedBigInteger('sender_id')->nullable();

            $table->string('title', 255);
            $table->text('message');

            $table->enum('notification_type', [
                'schedule', 'alert', 'announcement', 'request_update', 'route_assignment'
            ])->default('alert');

            $table->enum('priority', [
                'low', 'medium', 'high', 'urgent'
            ])->default('medium');

            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();

            // Optional link or route (for frontend redirects)
            $table->string('action_url', 255)->nullable();

            $table->timestamps();

            // Optional foreign key relations
            $table->foreign('recipient_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('sender_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
