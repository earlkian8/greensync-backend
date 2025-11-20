<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QrCollection extends Model
{
    use HasFactory;

    protected $fillable = [
        'bin_id',
        'collector_id',
        'assignment_id',
        'qr_code',
        'collection_timestamp',
        'latitude',
        'longitude',
        'waste_weight',
        'waste_type',
        'collection_status',
        'skip_reason',
        'photo_url',
        'notes',
        'is_verified',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'collection_timestamp' => 'datetime',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'waste_weight' => 'decimal:2',
        'is_verified' => 'boolean',
        'verified_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** -------------------------
     * Relationships
     * ------------------------- */

    public function wasteBin()
    {
        return $this->belongsTo(WasteBin::class, 'bin_id');
    }

    public function collector()
    {
        return $this->belongsTo(Collector::class, 'collector_id');
    }

    public function assignment()
    {
        return $this->belongsTo(RouteAssignment::class, 'assignment_id');
    }

    public function verifier()
    {
        return $this->belongsTo(Resident::class, 'verified_by');
    }
}
