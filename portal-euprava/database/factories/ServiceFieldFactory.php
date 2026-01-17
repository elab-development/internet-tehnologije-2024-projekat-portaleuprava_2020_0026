<?php

namespace Database\Factories;

use App\Models\Service;
use App\Models\ServiceField;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServiceField>
 */
class ServiceFieldFactory extends Factory
{
    protected $model = ServiceField::class;

    public function definition(): array
    {
        $type = $this->faker->randomElement(['STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'FILE']);

        return [
            'service_id' => Service::factory(),
            'key' => $this->faker->unique()->slug(2, '_'),
            'label' => ucfirst($this->faker->words(2, true)),
            'data_type' => $type,
            'is_required' => $this->faker->boolean(60),

            'options' => $type === 'SELECT'
                ? ['A', 'B', 'C']
                : null,

            'validation_rules' => null,
            'sort_order' => $this->faker->numberBetween(1, 20),
        ];
    }
}
