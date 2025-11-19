<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CollectionRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'bin_id',
        'request_type',
        'description',
        'preferred_date',
        'preferred_time',
        'waste_type',
        'image_url',
        'priority',
        'status',
        'assigned_collector_id',
        'resolution_notes',
        'completed_at',
    ];

    protected $casts = [
        'preferred_date' => 'date',
        'preferred_time' => 'datetime:H:i',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** -------------------------
     * Relationships
     * ------------------------- */

    public function resident()
    {
        return $this->belongsTo(Resident::class, 'user_id');
    }

    public function wasteBin()
    {
        return $this->belongsTo(WasteBin::class, 'bin_id');
    }

    public function collector()
    {
        return $this->belongsTo(Collector::class, 'assigned_collector_id');
    }
}
