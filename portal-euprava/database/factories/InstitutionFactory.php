<?php

namespace Database\Factories;

use App\Models\Institution;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Institution>
 */
class InstitutionFactory extends Factory
{
    protected $model = Institution::class;

    public function definition(): array
    {
        $cities = ['Beograd', 'Novi Sad', 'Niš', 'Kragujevac', 'Subotica'];

        return [
            'name' => 'Institucija ' . $this->faker->unique()->company(),
            'city' => $this->faker->randomElement($cities),
            'address' => $this->faker->streetAddress(),
            'email' => $this->faker->companyEmail(),
        ];
    }
}
