<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RouteStop extends Model
{
    use HasFactory;

    protected $fillable = [
        'route_id',
        'stop_order',
        'stop_address',
        'latitude',
        'longitude',
        'estimated_time',
        'notes',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'estimated_time' => 'datetime:H:i',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** -------------------------
     * Relationships
     * ------------------------- */

    public function route()
    {
        return $this->belongsTo(Route::class, 'route_id');
    }
}
