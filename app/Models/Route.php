<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Route extends Model
{
    use HasApiTokens, HasFactory;

    protected $fillable = [
        'route_name',
        'barangay',
        'start_location',
        'end_location',
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

    /** -------------------------
     * Relationships
     * ------------------------- */

    public function creator()
    {
        return $this->belongsTo(Resident::class, 'created_by');
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
