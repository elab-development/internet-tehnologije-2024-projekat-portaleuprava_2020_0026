<?php

namespace Database\Factories;

use App\Models\Institution;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition(): array
    {
        return [
            'institution_id' => Institution::factory(),
            'name' => 'Servis ' . $this->faker->unique()->words(3, true),
            'description' => $this->faker->sentence(12),
            'fee' => $this->faker->randomElement([0, 0, 350, 500, 750]),
            'requires_attachment' => $this->faker->boolean(25),
            'status' => 'ACTIVE',
        ];
    }
}
