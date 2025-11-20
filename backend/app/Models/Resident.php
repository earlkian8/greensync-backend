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
        'region_id',
        'province_id',
        'city_id',
        'barangay_id',
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

    protected $appends = ['profile_image_url', 'full_address'];

    /** -------------------------
     * Accessors
     * ------------------------- */

    /**
     * Get the profile image URL.
     */
    public function getProfileImageUrlAttribute()
    {
        if ($this->profile_image) {
            return route('resident.profile-image', ['resident' => $this->id]);
        }
        return null;
    }

    /**
     * Get the full address string.
     */
    public function getFullAddressAttribute()
    {
        $parts = [];
        
        if ($this->house_no) {
            $parts[] = $this->house_no;
        }
        
        if ($this->street) {
            $parts[] = $this->street;
        }
        
        // Use new structure if available, otherwise fallback to old
        if ($this->barangayRelation) {
            $parts[] = $this->barangayRelation->name;
        } elseif ($this->barangay) {
            $parts[] = $this->barangay;
        }
        
        if ($this->cityRelation) {
            $parts[] = $this->cityRelation->name;
        } elseif ($this->city) {
            $parts[] = $this->city;
        }
        
        if ($this->provinceRelation) {
            $parts[] = $this->provinceRelation->name;
        } elseif ($this->province) {
            $parts[] = $this->province;
        }
        
        if ($this->postal_code) {
            $parts[] = $this->postal_code;
        }
        
        return implode(', ', $parts);
    }

    /** -------------------------
     * Helper Methods
     * ------------------------- */

    /**
     * Check if the address is complete.
     * Checks both new structure (foreign keys) and old structure (string fields) for backward compatibility.
     */
    public function isAddressComplete(): bool
    {
        // Check new structure with foreign keys
        if ($this->region_id && $this->province_id && $this->city_id && $this->barangay_id) {
            return !empty($this->house_no) && !empty($this->street) && !empty($this->postal_code);
        }
        
        // Fallback to old structure for backward compatibility
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

    /**
     * Get the region that owns the resident.
     */
    public function region()
    {
        return $this->belongsTo(\Woenel\Prpcmblmts\Models\PhilippineRegion::class, 'region_id');
    }

    /**
     * Get the province that owns the resident.
     */
    public function provinceRelation()
    {
        return $this->belongsTo(\Woenel\Prpcmblmts\Models\PhilippineProvince::class, 'province_id');
    }

    /**
     * Get the city that owns the resident.
     */
    public function cityRelation()
    {
        return $this->belongsTo(\Woenel\Prpcmblmts\Models\PhilippineCity::class, 'city_id');
    }

    /**
     * Get the barangay that owns the resident.
     */
    public function barangayRelation()
    {
        return $this->belongsTo(\Woenel\Prpcmblmts\Models\PhilippineBarangay::class, 'barangay_id');
    }
}
