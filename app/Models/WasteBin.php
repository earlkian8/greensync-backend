<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WasteBin extends Model
{
    use HasFactory;

    protected $fillable = [
        'qr_code',
        'resident_id',
        'bin_type',
        'status',
        'registered_at',
        'last_collected',
    ];

    protected $casts = [
        'registered_at' => 'datetime',
        'last_collected' => 'datetime',
    ];

    /** -------------------------
     * Relationships
     * ------------------------- */

    // public function resident()
    // {
    //     return $this->belongsTo(Resident::class, 'resident_id');
    // }

    // public function collectionRequests()
    // {
    //     return $this->hasMany(CollectionRequest::class, 'bin_id');
    // }

    // public function qrCollections()
    // {
    //     return $this->hasMany(QrCollection::class, 'bin_id');
    // }
}
