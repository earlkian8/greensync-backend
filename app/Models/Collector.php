<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Collector extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'phone_number',
        'password',
        'name',
        'employee_id',
        'license_number',
        'vehicle_plate_number',
        'vehicle_type',
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

    /** -------------------------
     * Relationships
     * ------------------------- */

    // public function routeAssignments()
    // {
    //     return $this->hasMany(RouteAssignment::class, 'collector_id');
    // }

    // public function collectionRequests()
    // {
    //     return $this->hasMany(CollectionRequest::class, 'assigned_collector_id');
    // }

    // public function qrCollections()
    // {
    //     return $this->hasMany(QrCollection::class, 'collector_id');
    // }
}
