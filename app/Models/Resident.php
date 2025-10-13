<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Resident extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'phone_number',
        'password',
        'name',
        'house_no',
        'street',
        'barangay',
        'city',
        'province',
        'country',
        'postal_code',
        'profile_image',
        'is_verified',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** -------------------------
     * Relationships
     * ------------------------- */

    public function wasteBins()
    {
        return $this->hasMany(WasteBin::class, 'resident_id');
    }

    public function collectionRequests()
    {
        return $this->hasMany(CollectionRequest::class, 'user_id');
    }

    public function verifiedCollections()
    {
        return $this->hasMany(QrCollection::class, 'verified_by');
    }
}
