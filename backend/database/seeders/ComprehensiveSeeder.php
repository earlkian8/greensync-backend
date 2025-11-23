<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Resident;
use App\Models\Collector;
use App\Models\WasteBin;
use App\Models\CollectionRequest;
use App\Models\Route;
use App\Models\RouteStop;
use App\Models\RouteAssignment;
use App\Models\CollectionSchedule;
use App\Models\QrCollection;
use App\Models\Notification;
use App\Models\ActivityLogs;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

/**
 * Comprehensive Seeder
 * 
 * Seeds almost all tables in the database with comprehensive test data.
 * Focuses on earlkian8 accounts (admin user, resident, and collector).
 * 
 * Creates:
 * - Admin user (earlkian8@gmail.com)
 * - Resident (earlkian8@gmail.com) with multiple bins and collection requests
 * - Collector (earlkian8@gmail.com) with routes, assignments, and collection history
 * - Additional residents, collectors, routes, route assignments
 * - Collection schedules, QR collections (history), notifications, and activity logs
 */
class ComprehensiveSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create/Get Admin User (earlkian8)
        $adminUser = User::firstOrCreate(
            ['email' => 'earlkian8@gmail.com'],
            [
                'name' => 'Earl Kian',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Zamboanga City barangays
        $zamboangaBarangays = [
            'Arena Blanco', 'Ayala', 'Baliwasan', 'Baluno', 'Boalan', 'Bolong', 'Buenavista', 'Bunguiao',
            'Busay', 'Cabaluay', 'Cabatangan', 'Cacao', 'Calabasa', 'Calarian', 'Camino Nuevo', 'Campo Islam',
            'Canelar', 'Capisan', 'Cawit', 'Culianan', 'Curuan', 'Dita', 'Divisoria', 'Dulian (Upper Bunguiao)',
            'Dulian (Upper Pasonanca)', 'Guisao', 'Guiwan', 'Kasanyangan', 'La Paz', 'Labuan', 'Lamisahan',
            'Landang Gua', 'Landang Laum', 'Lanzones', 'Lapakan', 'Latuan (Curuan)', 'Licomo', 'Limaong',
            'Limpapa', 'Lubigan', 'Lumayang', 'Lumbangan', 'Lunzuran', 'Maasin', 'Malagutay', 'Mampang',
            'Manalipa', 'Mangusu', 'Manicahan', 'Mariki', 'Mercedes', 'Muti', 'Pamucutan', 'Pangapuyan',
            'Panubigan', 'Pasilmanta (Sacol Island)', 'Pasobolong', 'Pasonanca', 'Patalon', 'Putik', 'Quiniput',
            'Recodo', 'Rio Hondo', 'Salaan', 'San Jose Cawa-Cawa', 'San Jose Gusu', 'San Ramon', 'San Roque',
            'Sangali', 'Santa Barbara', 'Santa Catalina', 'Santa Maria', 'Santo Niño', 'Sibulao (Caruan)',
            'Sinubung', 'Sinunoc', 'Tagasilay', 'Taguiti', 'Talabaan', 'Talisayan', 'Talon-Talon', 'Taluksangay',
            'Tetuan', 'Tictapul', 'Tigbalabag', 'Tigtabon', 'Tolosa', 'Tugbungan', 'Tulungatung', 'Tumaga',
            'Tumalutab', 'Tumitus', 'Victoria', 'Vitali', 'Zambowood', 'Zone I (Poblacion)', 'Zone II (Poblacion)',
            'Zone III (Poblacion)', 'Zone IV (Poblacion)'
        ];

        // Create/Get Earl Kian Resident
        $earlResident = Resident::firstOrCreate(
            ['email' => 'earlkian8@gmail.com'],
            [
                'phone_number' => '+639123456789',
                'password' => Hash::make('password'),
                'name' => 'Earl Kian',
                'house_no' => '123',
                'street' => 'Main Street',
                'barangay' => 'Tetuan',
                'city' => 'Zamboanga City',
                'province' => 'Zamboanga del Sur',
                'country' => 'Philippines',
                'postal_code' => '7000',
                'is_verified' => true,
            ]
        );

        // Create/Get Earl Kian Collector
        $earlCollector = Collector::firstOrCreate(
            ['email' => 'earlkian8@gmail.com'],
            [
                'phone_number' => '+639123456789',
                'password' => Hash::make('password'),
                'name' => 'Earl Kian',
                'employee_id' => 1001,
                'license_number' => 'DL-2024-001234',
                'vehicle_plate_number' => 'ABC-1234',
                'vehicle_type' => 'Truck',
                'is_active' => true,
                'is_verified' => true,
            ]
        );

        // Create additional residents (for variety)
        $residents = [$earlResident];
        $usedPhoneNumbers = ['+639123456789']; // Track used phone numbers
        for ($i = 2; $i <= 15; $i++) {
            // Generate unique phone number
            do {
                $phoneNumber = '+639' . str_pad(rand(100000000, 999999999), 9, '0', STR_PAD_LEFT);
            } while (in_array($phoneNumber, $usedPhoneNumbers));
            $usedPhoneNumbers[] = $phoneNumber;
            
            $residents[] = Resident::firstOrCreate(
                ['email' => "resident{$i}@example.com"],
                [
                    'phone_number' => $phoneNumber,
                    'password' => Hash::make('password'),
                    'name' => "Resident {$i}",
                    'house_no' => (string)(100 + $i),
                    'street' => "Street {$i}",
                    'barangay' => $zamboangaBarangays[($i - 2) % count($zamboangaBarangays)],
                    'city' => 'Zamboanga City',
                    'province' => 'Zamboanga del Sur',
                    'country' => 'Philippines',
                    'postal_code' => '7000',
                    'is_verified' => true,
                ]
            );
        }

        // Create waste bins for Earl Kian (focus on him)
        $earlBins = [];
        $binTypes = ['biodegradable', 'non-biodegradable', 'recyclable', 'hazardous'];
        for ($i = 1; $i <= 5; $i++) {
            $earlBins[] = WasteBin::create([
                'name' => "Earl's Bin {$i}",
                'qr_code' => 'EARL-BIN-' . str_pad($i, 6, '0', STR_PAD_LEFT),
                'resident_id' => $earlResident->id,
                'bin_type' => $binTypes[($i - 1) % 4],
                'status' => $i <= 3 ? 'active' : ($i == 4 ? 'full' : 'active'),
                'registered_at' => now()->subDays(30 - $i * 5),
                'last_collected' => $i <= 3 ? now()->subDays(rand(1, 7)) : null,
            ]);
        }

        // Create waste bins for other residents
        $allBins = $earlBins;
        foreach ($residents as $index => $resident) {
            if ($resident->id === $earlResident->id) continue; // Skip Earl, already done
            
            $numBins = rand(1, 3);
            for ($j = 1; $j <= $numBins; $j++) {
                $allBins[] = WasteBin::create([
                    'name' => "{$resident->name}'s Bin {$j}",
                    'qr_code' => 'BIN-' . str_pad($resident->id * 10 + $j, 6, '0', STR_PAD_LEFT),
                    'resident_id' => $resident->id,
                    'bin_type' => $binTypes[($j - 1) % 4],
                    'status' => rand(0, 10) > 1 ? 'active' : 'full',
                    'registered_at' => now()->subDays(rand(1, 60)),
                    'last_collected' => rand(0, 10) > 2 ? now()->subDays(rand(1, 14)) : null,
                ]);
            }
        }

        // Create collection requests for Earl Kian (focus on him)
        $earlRequests = [];
        $requestStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
        $priorities = ['low', 'medium', 'high', 'urgent'];
        $wasteTypes = ['biodegradable', 'non-biodegradable', 'recyclable', 'special', 'all'];

        for ($i = 1; $i <= 8; $i++) {
            $status = $requestStatuses[($i - 1) % 5];
            $earlRequests[] = CollectionRequest::create([
                'user_id' => $earlResident->id,
                'bin_id' => $earlBins[rand(0, count($earlBins) - 1)]->id,
                'request_type' => $i % 2 == 0 ? 'scheduled' : 'on-demand',
                'description' => "Collection request #{$i} from Earl Kian",
                'preferred_date' => now()->addDays(rand(1, 14)),
                'preferred_time' => Carbon::createFromTime(rand(8, 16), rand(0, 59)),
                'latitude' => 6.9214 + (rand(-100, 100) / 10000),
                'longitude' => 122.0769 + (rand(-100, 100) / 10000),
                'waste_type' => $wasteTypes[($i - 1) % 5],
                'priority' => $priorities[($i - 1) % 4],
                'status' => $status,
                'assigned_collector_id' => $status !== 'pending' && $status !== 'cancelled' ? $earlCollector->id : null,
                'completed_at' => $status === 'completed' ? now()->subDays(rand(1, 30)) : null,
            ]);
        }

        // Create collection requests for other residents
        foreach ($residents as $resident) {
            if ($resident->id === $earlResident->id) continue;
            
            $residentBins = WasteBin::where('resident_id', $resident->id)->get();
            if ($residentBins->isEmpty()) continue;

            $numRequests = rand(1, 4);
            for ($i = 1; $i <= $numRequests; $i++) {
                CollectionRequest::create([
                    'user_id' => $resident->id,
                    'bin_id' => $residentBins->random()->id,
                    'request_type' => rand(0, 1) ? 'scheduled' : 'on-demand',
                    'description' => "Collection request from {$resident->name}",
                    'preferred_date' => now()->addDays(rand(1, 21)),
                    'preferred_time' => Carbon::createFromTime(rand(8, 16), rand(0, 59)),
                    'latitude' => 14.5995 + (rand(-100, 100) / 10000),
                    'longitude' => 120.9842 + (rand(-100, 100) / 10000),
                    'waste_type' => $wasteTypes[rand(0, 4)],
                    'priority' => $priorities[rand(0, 3)],
                    'status' => $requestStatuses[rand(0, 4)],
                    'assigned_collector_id' => rand(0, 10) > 3 ? $earlCollector->id : null,
                    'completed_at' => rand(0, 10) > 6 ? now()->subDays(rand(1, 20)) : null,
                ]);
            }
        }

        // Create additional collectors
        $collectors = [$earlCollector];
        for ($i = 2; $i <= 5; $i++) {
            // Generate unique phone number for collectors
            do {
                $phoneNumber = '+639' . str_pad(rand(200000000, 299999999), 9, '0', STR_PAD_LEFT);
            } while (in_array($phoneNumber, $usedPhoneNumbers));
            $usedPhoneNumbers[] = $phoneNumber;
            
            $collectors[] = Collector::firstOrCreate(
                ['email' => "collector{$i}@greensync.com"],
                [
                    'phone_number' => $phoneNumber,
                    'password' => Hash::make('password'),
                    'name' => "Collector {$i}",
                    'employee_id' => 1000 + $i,
                    'license_number' => 'DL-2024-' . str_pad($i, 6, '0', STR_PAD_LEFT),
                    'vehicle_plate_number' => 'XYZ-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                    'vehicle_type' => $i % 2 == 0 ? 'Truck' : 'Van',
                    'is_active' => true,
                    'is_verified' => true,
                ]
            );
        }

        // Create collection schedules
        $schedules = [];
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $frequencies = ['weekly', 'bi-weekly', 'monthly'];
        
        for ($i = 0; $i < 7; $i++) {
            $barangay = $zamboangaBarangays[$i % count($zamboangaBarangays)];
            $schedules[] = CollectionSchedule::firstOrCreate(
                [
                    'barangay' => $barangay,
                    'collection_day' => $days[$i],
                ],
                [
                    'collection_time' => Carbon::createFromTime(8 + ($i % 3), 0),
                    'frequency' => $frequencies[$i % 3],
                    'is_active' => true,
                    'notes' => "Regular collection schedule for {$barangay}",
                    'created_by' => $adminUser->id,
                ]
            );
        }

        // Create routes (focus on Earl Kian as creator - using admin user)
        $routes = [];
        for ($i = 0; $i < 5; $i++) {
            $barangay = $zamboangaBarangays[$i % count($zamboangaBarangays)];
            $route = Route::create([
                'route_name' => "Route " . ($i + 1) . " - {$barangay}",
                'barangay' => $barangay,
                'estimated_duration' => rand(60, 180), // minutes
                'total_stops' => rand(5, 15),
                'is_active' => $i < 4,
                'created_by' => $adminUser->id, // Admin user creates routes
            ]);
            $routes[] = $route;

            // Create route stops for this route
            $availableBins = collect($allBins)->where('resident_id', '!=', $earlResident->id)->values();
            $numStops = min(rand(5, 12), $availableBins->count());
            $routeBins = $availableBins->random($numStops);
            $stopOrder = 1;
            foreach ($routeBins as $bin) {
                RouteStop::create([
                    'route_id' => $route->id,
                    'bin_id' => $bin->id,
                    'stop_order' => $stopOrder++,
                    'stop_address' => $bin->resident->full_address ?? "Address for Bin {$bin->id}",
                    'latitude' => 6.9214 + (rand(-100, 100) / 10000),
                    'longitude' => 122.0769 + (rand(-100, 100) / 10000),
                    'estimated_time' => Carbon::createFromTime(8 + ($stopOrder % 8), ($stopOrder * 5) % 60),
                    'notes' => "Stop {$stopOrder} for {$bin->name}",
                ]);
            }
            $route->update(['total_stops' => $stopOrder - 1]);
        }

        // Create route assignments (focus on Earl Kian collector)
        $assignments = [];
        foreach ($routes as $index => $route) {
            // Assign most routes to Earl Kian
            $collector = $index < 3 ? $earlCollector : $collectors[rand(1, count($collectors) - 1)];
            
            $assignment = RouteAssignment::create([
                'route_id' => $route->id,
                'collector_id' => $collector->id,
                'schedule_id' => $schedules[($index % count($schedules))]->id,
                'assignment_date' => now()->addDays(rand(1, 30)),
                'status' => $index < 2 ? 'completed' : ($index == 2 ? 'in_progress' : 'pending'),
                'start_time' => $index < 2 ? now()->subDays(rand(1, 7))->setTime(8, 0) : null,
                'end_time' => $index < 2 ? now()->subDays(rand(1, 7))->setTime(12, 0) : null,
                'notes' => "Assignment for {$route->route_name}",
                'assigned_by' => $adminUser->id,
            ]);
            $assignments[] = $assignment;
        }

        // Create QR Collections (collection history - focus on Earl Kian)
        $collectionStatuses = ['successful', 'skipped', 'failed'];
        $wasteTypes = ['biodegradable', 'non-biodegradable', 'recyclable', 'special', 'all'];

        // Create collections for Earl Kian's assignments
        foreach ($assignments as $assignment) {
            if ($assignment->collector_id !== $earlCollector->id) continue;
            
            $routeStops = RouteStop::where('route_id', $assignment->route_id)->get();
            $collectedCount = rand(3, min(8, $routeStops->count()));
            
            foreach ($routeStops->take($collectedCount) as $stop) {
                $status = rand(0, 10) > 1 ? 'successful' : (rand(0, 1) ? 'skipped' : 'failed');
                
                QrCollection::create([
                    'bin_id' => $stop->bin_id,
                    'collector_id' => $earlCollector->id,
                    'assignment_id' => $assignment->id,
                    'qr_code' => $stop->bin->qr_code,
                    'collection_timestamp' => $assignment->start_time 
                        ? $assignment->start_time->copy()->addMinutes(rand(10, 120))
                        : now()->subDays(rand(1, 30)),
                    'latitude' => $stop->latitude ?? 6.9214 + (rand(-100, 100) / 10000),
                    'longitude' => $stop->longitude ?? 122.0769 + (rand(-100, 100) / 10000),
                    'waste_weight' => $status === 'successful' ? rand(500, 5000) / 100 : null,
                    'waste_type' => $wasteTypes[rand(0, 4)],
                    'collection_status' => $status,
                    'skip_reason' => $status === 'skipped' ? 'Bin not accessible' : null,
                    'notes' => $status === 'successful' ? 'Collection completed successfully' : null,
                    'is_verified' => $status === 'successful' && rand(0, 10) > 3,
                    'verified_by' => $status === 'successful' && rand(0, 10) > 5 ? $earlResident->id : null,
                    'verified_at' => $status === 'successful' && rand(0, 10) > 5 ? now()->subDays(rand(1, 20)) : null,
                ]);
            }
        }

        // Create additional collections for other collectors
        foreach ($assignments as $assignment) {
            if ($assignment->collector_id === $earlCollector->id) continue;
            
            $routeStops = RouteStop::where('route_id', $assignment->route_id)->get();
            $collectedCount = rand(2, min(6, $routeStops->count()));
            
            foreach ($routeStops->take($collectedCount) as $stop) {
                $status = rand(0, 10) > 1 ? 'successful' : 'skipped';
                
                QrCollection::create([
                    'bin_id' => $stop->bin_id,
                    'collector_id' => $assignment->collector_id,
                    'assignment_id' => $assignment->id,
                    'qr_code' => $stop->bin->qr_code,
                    'collection_timestamp' => $assignment->start_time 
                        ? $assignment->start_time->copy()->addMinutes(rand(10, 120))
                        : now()->subDays(rand(1, 30)),
                    'latitude' => $stop->latitude ?? 6.9214 + (rand(-100, 100) / 10000),
                    'longitude' => $stop->longitude ?? 122.0769 + (rand(-100, 100) / 10000),
                    'waste_weight' => $status === 'successful' ? rand(500, 5000) / 100 : null,
                    'waste_type' => $wasteTypes[rand(0, 4)],
                    'collection_status' => $status,
                    'skip_reason' => $status === 'skipped' ? 'Bin not accessible' : null,
                    'notes' => $status === 'successful' ? 'Collection completed' : null,
                    'is_verified' => $status === 'successful' && rand(0, 10) > 5,
                    'verified_by' => null,
                    'verified_at' => null,
                ]);
            }
        }

        // Create notifications (focus on Earl Kian)
        $notificationTypes = ['schedule', 'alert', 'announcement', 'request_update', 'route_assignment'];
        $priorities = ['low', 'medium', 'high', 'urgent'];

        // Notifications for Earl Kian resident (using admin user as recipient since recipient_id references users table)
        for ($i = 1; $i <= 10; $i++) {
            Notification::create([
                'recipient_type' => 'resident',
                'recipient_id' => $adminUser->id, // Using admin user as recipient_id since it references users table
                'sender_id' => $adminUser->id,
                'title' => "Notification #{$i} for Earl Kian Resident",
                'message' => "This is notification message #{$i} for resident Earl Kian",
                'notification_type' => $notificationTypes[$i % count($notificationTypes)],
                'priority' => $priorities[$i % 4],
                'is_read' => $i <= 5,
                'read_at' => $i <= 5 ? now()->subDays(rand(1, 10)) : null,
                'action_url' => "/notifications/{$i}",
            ]);
        }

        // Notifications for Earl Kian collector
        for ($i = 1; $i <= 8; $i++) {
            Notification::create([
                'recipient_type' => 'collector',
                'recipient_id' => $adminUser->id, // Using admin user as recipient_id since it references users table
                'sender_id' => $adminUser->id,
                'title' => "Collector Notification #{$i} for Earl Kian",
                'message' => "Route assignment and collection updates #{$i} for collector Earl Kian",
                'notification_type' => $notificationTypes[$i % count($notificationTypes)],
                'priority' => $priorities[$i % 4],
                'is_read' => $i <= 4,
                'read_at' => $i <= 4 ? now()->subDays(rand(1, 7)) : null,
                'action_url' => "/collector/notifications/{$i}",
            ]);
        }

        // Create activity logs (focus on Earl Kian)
        $modules = ['Routes', 'Collections', 'Requests', 'Profile', 'Bins', 'Assignments'];
        $actions = ['created', 'updated', 'deleted', 'assigned', 'completed', 'verified', 'approved'];
        $descriptions = [
            'Created new route',
            'Assigned collector to route',
            'Completed collection',
            'Verified collection',
            'Updated profile',
            'Created collection request',
            'Approved collection request',
            'Updated waste bin status',
            'Cancelled route assignment',
        ];

        for ($i = 1; $i <= 20; $i++) {
            ActivityLogs::create([
                'user_id' => $i <= 12 ? $adminUser->id : ($i <= 16 ? $earlResident->id : $earlCollector->id),
                'module' => $modules[$i % count($modules)],
                'action' => $actions[$i % count($actions)],
                'description' => $descriptions[$i % count($descriptions)] . " - Entry #{$i}",
                'ip_address' => '192.168.1.' . rand(1, 255),
                'created_at' => now()->subDays(rand(1, 30)),
            ]);
        }

        $this->command->info('Comprehensive seeder completed successfully!');
        $this->command->info("Created data focused on earlkian8 accounts:");
        $this->command->info("- Resident: {$earlResident->email} with " . count($earlBins) . " bins and " . count($earlRequests) . " requests");
        $this->command->info("- Collector: {$earlCollector->email} with " . count($routes) . " routes and multiple collection history entries");
        $this->command->info("- Admin User: {$adminUser->email}");
    }
}

