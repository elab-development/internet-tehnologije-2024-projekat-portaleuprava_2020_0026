<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\ServiceField;
use Illuminate\Database\Seeder;

class ServiceFieldSeeder extends Seeder
{
    public function run(): void
    {
        $birthCert = Service::where('name', 'eIzvod iz matične knjige rođenih')->first();
        $citizenship = Service::where('name', 'eUverenje o državljanstvu')->first();
        $appointment = Service::where('name', 'eZakazivanje termina u opštini')->first();

        // eIzvod.
        ServiceField::factory()->create([
            'service_id' => $birthCert->id,
            'key' => 'delivery_method',
            'label' => 'Način dostave',
            'data_type' => 'SELECT',
            'is_required' => true,
            'options' => ['EMAIL', 'POST', 'PICKUP'],
            'validation_rules' => ['in:EMAIL,POST,PICKUP'],
            'sort_order' => 1,
        ]);

        ServiceField::factory()->create([
            'service_id' => $birthCert->id,
            'key' => 'purpose',
            'label' => 'Svrha izdavanja',
            'data_type' => 'STRING',
            'is_required' => true,
            'options' => null,
            'validation_rules' => ['max:255'],
            'sort_order' => 2,
        ]);

        ServiceField::factory()->create([
            'service_id' => $birthCert->id,
            'key' => 'contact_phone',
            'label' => 'Kontakt telefon',
            'data_type' => 'STRING',
            'is_required' => false,
            'options' => null,
            'validation_rules' => ['max:30'],
            'sort_order' => 3,
        ]);

        // eUverenje o državljanstvu.
        ServiceField::factory()->create([
            'service_id' => $citizenship->id,
            'key' => 'number_of_copies',
            'label' => 'Broj kopija',
            'data_type' => 'NUMBER',
            'is_required' => true,
            'options' => null,
            'validation_rules' => ['min:1', 'max:10'],
            'sort_order' => 1,
        ]);

        ServiceField::factory()->create([
            'service_id' => $citizenship->id,
            'key' => 'delivery_method',
            'label' => 'Način dostave',
            'data_type' => 'SELECT',
            'is_required' => true,
            'options' => ['EMAIL', 'POST', 'PICKUP'],
            'validation_rules' => ['in:EMAIL,POST,PICKUP'],
            'sort_order' => 2,
        ]);

        // Novi servis: zakazivanje termina.
        ServiceField::factory()->create([
            'service_id' => $appointment->id,
            'key' => 'requested_date',
            'label' => 'Željeni datum',
            'data_type' => 'DATE',
            'is_required' => true,
            'options' => null,
            'validation_rules' => ['date'],
            'sort_order' => 1,
        ]);

        ServiceField::factory()->create([
            'service_id' => $appointment->id,
            'key' => 'time_slot',
            'label' => 'Termin',
            'data_type' => 'SELECT',
            'is_required' => true,
            'options' => ['09:00', '10:00', '11:00', '12:00', '13:00'],
            'validation_rules' => ['in:09:00,10:00,11:00,12:00,13:00'],
            'sort_order' => 2,
        ]);

        ServiceField::factory()->create([
            'service_id' => $appointment->id,
            'key' => 'reason',
            'label' => 'Razlog posete',
            'data_type' => 'STRING',
            'is_required' => false,
            'options' => null,
            'validation_rules' => ['max:255'],
            'sort_order' => 3,
        ]);
    }
}
