<?php

namespace Database\Seeders;

use App\Models\Collector;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CollectorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Collector::create([
            'email' => 'earlkian8@gmail.com',
            'phone_number' => '+639123456789',
            'password' => Hash::make('password'),
            'name' => 'Earl Kian',
            'employee_id' => 1001,
            'license_number' => 'DL-2024-001234',
            'vehicle_plate_number' => 'ABC-1234',
            'vehicle_type' => 'Truck',
            'is_active' => true,
            'is_verified' => true,
        ]);

        // // Create additional sample collectors
        // Collector::create([
        //     'email' => 'collector1@greensync.com',
        //     'phone_number' => '+639234567890',
        //     'password' => Hash::make('password'),
        //     'name' => 'John Collector',
        //     'employee_id' => 1002,
        //     'license_number' => 'DL-2024-002345',
        //     'vehicle_plate_number' => 'XYZ-5678',
        //     'vehicle_type' => 'Van',
        //     'is_active' => true,
        //     'is_verified' => true,
        // ]);

        // Collector::create([
        //     'email' => 'collector2@greensync.com',
        //     'phone_number' => '+639345678901',
        //     'password' => Hash::make('password'),
        //     'name' => 'Jane Waste Manager',
        //     'employee_id' => 1003,
        //     'license_number' => 'DL-2024-003456',
        //     'vehicle_plate_number' => 'DEF-9012',
        //     'vehicle_type' => 'Truck',
        //     'is_active' => true,
        //     'is_verified' => true,
        // ]);

        // Collector::create([
        //     'email' => 'collector3@greensync.com',
        //     'phone_number' => '+639456789012',
        //     'password' => Hash::make('password'),
        //     'name' => 'Michael Driver',
        //     'employee_id' => 1004,
        //     'license_number' => 'DL-2024-004567',
        //     'vehicle_plate_number' => 'GHI-3456',
        //     'vehicle_type' => 'Van',
        //     'is_active' => true,
        //     'is_verified' => true,
        // ]);
    }
}

