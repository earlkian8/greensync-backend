<?php

namespace Database\Seeders;

use App\Models\Resident;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ResidentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Resident::create([
            'email' => 'earlkian8@gmail.com',
            'phone_number' => '+639123456789',
            'password' => Hash::make('password'),
            'name' => 'Earl Kian',
            'barangay' => 'Tugbungan',
            'city' => 'Zamboanga City',
            'province' => 'Zamboanga del Sur',
            'country' => 'Philippines',
            'postal_code' => '1000',
            'is_verified' => true,
        ]);

        // // Create additional sample residents
        // Resident::create([
        //     'email' => 'juan.delacruz@example.com',
        //     'phone_number' => '+639234567890',
        //     'password' => Hash::make('password'),
        //     'name' => 'Juan dela Cruz',
        //     'house_no' => '456',
        //     'street' => 'Rizal Avenue',
        //     'barangay' => 'Barangay 2',
        //     'city' => 'Quezon City',
        //     'province' => 'Metro Manila',
        //     'country' => 'Philippines',
        //     'postal_code' => '1100',
        //     'is_verified' => true,
        // ]);

        // Resident::create([
        //     'email' => 'maria.santos@example.com',
        //     'phone_number' => '+639345678901',
        //     'password' => Hash::make('password'),
        //     'name' => 'Maria Santos',
        //     'house_no' => '789',
        //     'street' => 'EDSA',
        //     'barangay' => 'Barangay 3',
        //     'city' => 'Makati',
        //     'province' => 'Metro Manila',
        //     'country' => 'Philippines',
        //     'postal_code' => '1200',
        //     'is_verified' => true,
        // ]);
    }
}

