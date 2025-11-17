<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reporting extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_title',
        'report_type',
        'report_period',
        'start_date',
        'end_date',
        'filters',
        'report_data',
        'description',
        'status',
        'file_path',
        'file_type',
        'summary_stats',
        'generated_by',
        'generated_at',
        'is_scheduled',
        'schedule_frequency',
        'next_generation',
    ];

    protected $casts = [
        'filters' => 'array',
        'report_data' => 'array',
        'summary_stats' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
        'generated_at' => 'datetime',
        'next_generation' => 'datetime',
        'is_scheduled' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** -------------------------
     * Relationships
     * ------------------------- */

    public function generatedBy()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function exports()
    {
        return $this->hasMany(ReportExport::class);
    }

    /** -------------------------
     * Scopes
     * ------------------------- */

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('report_type', $type);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('start_date', [$startDate, $endDate])
                     ->orWhereBetween('end_date', [$startDate, $endDate]);
    }

    /** -------------------------
     * Accessors & Mutators
     * ------------------------- */

    public function getReportTypeNameAttribute()
    {
        $types = [
            'collection_summary' => 'Collection Summary Report',
            'collector_performance' => 'Collector Performance Report',
            'resident_activity' => 'Resident Activity Report',
            'waste_bin_status' => 'Waste Bin Status Report',
            'route_efficiency' => 'Route Efficiency Report',
            'schedule_compliance' => 'Schedule Compliance Report',
            'barangay_statistics' => 'Barangay Statistics Report',
            'waste_type_analysis' => 'Waste Type Analysis Report',
            'monthly_overview' => 'Monthly Overview Report',
            'custom' => 'Custom Report',
        ];

        return $types[$this->report_type] ?? 'Unknown Report Type';
    }

    public function getReportPeriodNameAttribute()
    {
        $periods = [
            'daily' => 'Daily',
            'weekly' => 'Weekly',
            'monthly' => 'Monthly',
            'quarterly' => 'Quarterly',
            'yearly' => 'Yearly',
            'custom' => 'Custom Period',
        ];

        return $periods[$this->report_period] ?? 'Unknown Period';
    }
}

// ============================================

class ReportTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_name',
        'report_type',
        'description',
        'default_filters',
        'included_metrics',
        'chart_configs',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'default_filters' => 'array',
        'included_metrics' => 'array',
        'chart_configs' => 'array',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** -------------------------
     * Relationships
     * ------------------------- */

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function schedules()
    {
        return $this->hasMany(ReportSchedule::class, 'template_id');
    }

    /** -------------------------
     * Scopes
     * ------------------------- */

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('report_type', $type);
    }
}

// ============================================

class ReportSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'frequency',
        'generation_time',
        'recipients',
        'delivery_method',
        'is_active',
        'last_generated',
        'next_generation',
        'created_by',
    ];

    protected $casts = [
        'recipients' => 'array',
        'generation_time' => 'datetime:H:i',
        'is_active' => 'boolean',
        'last_generated' => 'datetime',
        'next_generation' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** -------------------------
     * Relationships
     * ------------------------- */

    public function template()
    {
        return $this->belongsTo(ReportTemplate::class, 'template_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** -------------------------
     * Scopes
     * ------------------------- */

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDueForGeneration($query)
    {
        return $query->where('is_active', true)
                     ->where('next_generation', '<=', now());
    }
}

// ============================================

class ReportExport extends Model
{
    use HasFactory;

    protected $fillable = [
        'reporting_id',
        'export_format',
        'file_path',
        'file_size',
        'expires_at',
        'exported_by',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** -------------------------
     * Relationships
     * ------------------------- */

    public function report()
    {
        return $this->belongsTo(Reporting::class);
    }

    public function exportedBy()
    {
        return $this->belongsTo(User::class, 'exported_by');
    }

    /** -------------------------
     * Scopes
     * ------------------------- */

    public function scopeNotExpired($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }

    public function scopeExpired($query)
    {
        return $query->whereNotNull('expires_at')
                     ->where('expires_at', '<=', now());
    }

    /** -------------------------
     * Accessors
     * ------------------------- */

    public function getFileSizeHumanAttribute()
    {
        if (!$this->file_size) {
            return 'Unknown';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $size = $this->file_size;
        $unit = 0;

        while ($size >= 1024 && $unit < count($units) - 1) {
            $size /= 1024;
            $unit++;
        }

        return round($size, 2) . ' ' . $units[$unit];
    }
}