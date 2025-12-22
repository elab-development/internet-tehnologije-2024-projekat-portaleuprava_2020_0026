<?php

namespace Database\Seeders;

use App\Models\Institution;
use Illuminate\Database\Seeder;

class InstitutionSeeder extends Seeder
{
    public function run(): void
    {
        Institution::factory()->create([
            'name' => 'Opština Stari Grad',
            'city' => 'Beograd',
            'address' => 'Makedonska 42',
            'email' => 'kontakt@starigrad.rs',
        ]);

        Institution::factory()->create([
            'name' => 'Ministarstvo unutrašnjih poslova',
            'city' => 'Beograd',
            'address' => 'Bulevar Mihajla Pupina 2',
            'email' => 'info@mup.gov.rs',
        ]);

        Institution::factory()->create([
            'name' => 'Matična služba Grada Beograda',
            'city' => 'Beograd',
            'address' => 'Kraljice Marije 1',
            'email' => 'maticna@beograd.rs',
        ]);
    }
}
