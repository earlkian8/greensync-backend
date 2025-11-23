<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Route extends Model
{
    use HasFactory;

    protected $fillable = [
        'route_name',
        'barangay',
        'estimated_duration',
        'total_stops',
        'route_map_data',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = ['start_location', 'end_location'];

    /** -------------------------
     * Accessors
     * ------------------------- */

    /**
     * Get the start location from the first stop.
     */
    public function getStartLocationAttribute()
    {
        // Use already loaded relationship if available to avoid N+1 queries
        if ($this->relationLoaded('stops')) {
            $sortedStops = $this->stops->sortBy('stop_order');
            $firstStop = $sortedStops->first();
            return $firstStop ? $firstStop->stop_address : null;
        }
        
        // Fallback to query if relationship not loaded
        $firstStop = $this->stops()->orderBy('stop_order')->first();
        return $firstStop ? $firstStop->stop_address : null;
    }

    /**
     * Get the end location from the last stop.
     */
    public function getEndLocationAttribute()
    {
        // Use already loaded relationship if available to avoid N+1 queries
        if ($this->relationLoaded('stops')) {
            $sortedStops = $this->stops->sortByDesc('stop_order');
            $lastStop = $sortedStops->first();
            return $lastStop ? $lastStop->stop_address : null;
        }
        
        // Fallback to query if relationship not loaded
        $lastStop = $this->stops()->orderBy('stop_order', 'desc')->first();
        return $lastStop ? $lastStop->stop_address : null;
    }

    /** -------------------------
     * Relationships
     * ------------------------- */

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function stops()
    {
        return $this->hasMany(RouteStop::class, 'route_id');
    }

    public function assignments()
    {
        return $this->hasMany(RouteAssignment::class, 'route_id');
    }
}
