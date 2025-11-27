<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class CollectionSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'collection_day',
        'collection_time',
        'frequency',
        'is_active',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'collection_time' => 'datetime:H:i',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** -------------------------
     * Relationships
     * ------------------------- */

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function routeAssignments()
    {
        return $this->hasMany(RouteAssignment::class, 'schedule_id');
    }
}
