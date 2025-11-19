<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class Resident extends Authenticatable
{
    use HasApiTokens, HasFactory;

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

    protected $appends = ['profile_image_url'];

    /** -------------------------
     * Accessors
     * ------------------------- */

    /**
     * Get the profile image URL.
     */
    public function getProfileImageUrlAttribute()
    {
        if ($this->profile_image) {
            return Storage::url($this->profile_image);
        }
        return null;
    }

    /** -------------------------
     * Helper Methods
     * ------------------------- */

    /**
     * Check if the address is complete.
     */
    public function isAddressComplete(): bool
    {
        return !empty($this->barangay) && 
               !empty($this->city) && 
               !empty($this->province) && 
               !empty($this->country) && 
               !empty($this->postal_code);
    }

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
