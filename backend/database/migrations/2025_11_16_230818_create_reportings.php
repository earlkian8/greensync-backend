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
        Schema::create('reportings', function (Blueprint $table) {
            $table->id();
            
            $table->string('report_title');
            $table->enum('report_type', [
                'collection_summary',
                'collector_performance',
                'resident_activity',
                'waste_bin_status',
                'route_efficiency',
                'schedule_compliance',
                'barangay_statistics',
                'waste_type_analysis',
                'monthly_overview',
                'custom'
            ]);
            $table->enum('report_period', [
                'daily',
                'weekly',
                'monthly',
                'quarterly',
                'yearly',
                'custom'
            ]);
            $table->date('start_date');
            $table->date('end_date');
            
            $table->json('filters')->nullable();
            $table->json('report_data')->nullable();
            
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'generating', 'completed', 'failed'])->default('pending');
            $table->string('file_path')->nullable();
            $table->string('file_type')->nullable();
            
            $table->json('summary_stats')->nullable();
            
            $table->foreignId('generated_by')
                ->constrained('users')
                ->onDelete('cascade');
            
            $table->timestamp('generated_at')->nullable();
            
            $table->boolean('is_scheduled')->default(false);
            $table->enum('schedule_frequency', ['daily', 'weekly', 'monthly'])->nullable();
            $table->timestamp('next_generation')->nullable();
            
            $table->timestamps();
        });

        Schema::create('report_templates', function (Blueprint $table) {
            $table->id();
            
            $table->string('template_name');
            $table->enum('report_type', [
                'collection_summary',
                'collector_performance',
                'resident_activity',
                'waste_bin_status',
                'route_efficiency',
                'schedule_compliance',
                'barangay_statistics',
                'waste_type_analysis',
                'monthly_overview',
                'custom'
            ]);
            $table->text('description')->nullable();
            
            $table->json('default_filters')->nullable();
            $table->json('included_metrics')->nullable();
            $table->json('chart_configs')->nullable();
            
            $table->boolean('is_active')->default(true);
            
            $table->foreignId('created_by')
                ->constrained('users')
                ->onDelete('cascade');
            
            $table->timestamps();
        });

        Schema::create('report_schedules', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('template_id')
                ->constrained('report_templates')
                ->onDelete('cascade');
            
            $table->enum('frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);
            $table->time('generation_time')->default('00:00:00');
            $table->json('recipients')->nullable();
            $table->enum('delivery_method', ['email', 'download', 'both'])->default('email');
            $table->boolean('is_active')->default(true);
            
            $table->timestamp('last_generated')->nullable();
            $table->timestamp('next_generation')->nullable();
            
            $table->foreignId('created_by')
                ->constrained('users')
                ->onDelete('cascade');
            
            $table->timestamps();
        });

        Schema::create('report_exports', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('report_id')
                ->constrained('reportings')
                ->onDelete('cascade');
            
            $table->enum('export_format', ['pdf', 'excel', 'csv']);
            $table->string('file_path');
            $table->integer('file_size')->nullable();
            $table->timestamp('expires_at')->nullable();
            
            $table->foreignId('exported_by')
                ->constrained('users')
                ->onDelete('cascade');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_exports');
        Schema::dropIfExists('report_schedules');
        Schema::dropIfExists('report_templates');
        Schema::dropIfExists('reportings');
    }
};