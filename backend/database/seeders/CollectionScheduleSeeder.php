<?php

namespace Database\Seeders;

use App\Models\CollectionSchedule;
use App\Models\User;
use Illuminate\Database\Seeder;

class CollectionScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first admin user or create one if none exists
        $adminUser = User::first();
        
        if (!$adminUser) {
            $adminUser = User::create([
                'name' => 'Admin User',
                'email' => 'admin@greensync.com',
                'password' => bcrypt('password'),
            ]);
        }

        // Create collection schedules for different barangays
        CollectionSchedule::create([
            'barangay' => 'Barangay 1',
            'collection_day' => 'Monday',
            'collection_time' => '08:00:00',
            'frequency' => 'weekly',
            'is_active' => true,
            'notes' => 'Regular weekly collection for Barangay 1',
            'created_by' => $adminUser->id,
        ]);

        CollectionSchedule::create([
            'barangay' => 'Barangay 2',
            'collection_day' => 'Tuesday',
            'collection_time' => '09:00:00',
            'frequency' => 'weekly',
            'is_active' => true,
            'notes' => 'Regular weekly collection for Barangay 2',
            'created_by' => $adminUser->id,
        ]);

        CollectionSchedule::create([
            'barangay' => 'Barangay 3',
            'collection_day' => 'Wednesday',
            'collection_time' => '08:30:00',
            'frequency' => 'weekly',
            'is_active' => true,
            'notes' => 'Regular weekly collection for Barangay 3',
            'created_by' => $adminUser->id,
        ]);

        CollectionSchedule::create([
            'barangay' => 'Barangay 1',
            'collection_day' => 'Thursday',
            'collection_time' => '10:00:00',
            'frequency' => 'bi-weekly',
            'is_active' => true,
            'notes' => 'Bi-weekly collection for Barangay 1',
            'created_by' => $adminUser->id,
        ]);

        CollectionSchedule::create([
            'barangay' => 'Barangay 2',
            'collection_day' => 'Friday',
            'collection_time' => '09:30:00',
            'frequency' => 'weekly',
            'is_active' => true,
            'notes' => 'Regular weekly collection for Barangay 2',
            'created_by' => $adminUser->id,
        ]);

        CollectionSchedule::create([
            'barangay' => 'Barangay 3',
            'collection_day' => 'Saturday',
            'collection_time' => '07:00:00',
            'frequency' => 'monthly',
            'is_active' => true,
            'notes' => 'Monthly collection for Barangay 3',
            'created_by' => $adminUser->id,
        ]);
    }
}

