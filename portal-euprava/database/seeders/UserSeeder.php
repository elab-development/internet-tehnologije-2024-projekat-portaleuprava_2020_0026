<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin (jedan, fiksan mail radi lakšeg logovanja).
        User::factory()->admin()->create([
            'name' => 'Admin Portal',
            'email' => 'admin123@euprava.test',
            'password' => 'admin123',
            'jmbg' => '1111111111111',
        ]);

        // Officers (službenici).
        User::factory()->count(3)->officer()->create();

        // Citizens (građani).
        User::factory()->count(10)->citizen()->create();
    }
}
