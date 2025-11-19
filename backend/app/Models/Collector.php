<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class Collector extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $fillable = [
        'email',
        'phone_number',
        'password',
        'name',
        'employee_id',
        'license_number',
        'license_number_image',
        'vehicle_plate_number',
        'vehicle_plate_number_image',
        'vehicle_type',
        'vehicle_type_image',
        'profile_image',
        'is_active',
        'is_verified',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_verified' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = ['profile_image_url', 'license_number_image_url', 'vehicle_plate_number_image_url', 'vehicle_type_image_url'];

    /** -------------------------
     * Accessors
     * ------------------------- */

    /**
     * Get the profile image URL.
     */
    public function getProfileImageUrlAttribute()
    {
        if ($this->profile_image) {
            return route('admin.collector-management.profile-image', $this->id);
        }
        return null;
    }

    /**
     * Get the license number image URL.
     */
    public function getLicenseNumberImageUrlAttribute()
    {
        if ($this->license_number_image) {
            return route('admin.collector-management.license-image', $this->id);
        }
        return null;
    }

    /**
     * Get the vehicle plate number image URL.
     */
    public function getVehiclePlateNumberImageUrlAttribute()
    {
        if ($this->vehicle_plate_number_image) {
            return route('admin.collector-management.vehicle-plate-image', $this->id);
        }
        return null;
    }

    /**
     * Get the vehicle type image URL.
     */
    public function getVehicleTypeImageUrlAttribute()
    {
        if ($this->vehicle_type_image) {
            return route('admin.collector-management.vehicle-type-image', $this->id);
        }
        return null;
    }

    /** -------------------------
     * Relationships
     * ------------------------- */

    public function routeAssignments()
    {
        return $this->hasMany(RouteAssignment::class, 'collector_id');
    }

    public function collectionRequests()
    {
        return $this->hasMany(CollectionRequest::class, 'assigned_collector_id');
    }

    public function qrCollections()
    {
        return $this->hasMany(QrCollection::class, 'collector_id');
    }
}
