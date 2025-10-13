<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RouteAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'route_id',
        'collector_id',
        'schedule_id',
        'assignment_date',
        'status',
        'start_time',
        'end_time',
        'notes',
        'assigned_by',
    ];

    protected $casts = [
        'assignment_date' => 'date',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** -------------------------
     * Relationships
     * ------------------------- */

    // public function route()
    // {
    //     return $this->belongsTo(Route::class, 'route_id');
    // }

    // public function collector()
    // {
    //     return $this->belongsTo(Collector::class, 'collector_id');
    // }

    // public function schedule()
    // {
    //     return $this->belongsTo(CollectionSchedule::class, 'schedule_id');
    // }

    // public function assignedBy()
    // {
    //     return $this->belongsTo(User::class, 'assigned_by');
    // }

    // public function qrCollections()
    // {
    //     return $this->hasMany(QrCollection::class, 'assignment_id');
    // }
}
