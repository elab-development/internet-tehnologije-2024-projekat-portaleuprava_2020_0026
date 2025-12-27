<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'remember_token' => Str::random(10),

            // Custom fields from our model.
            'date_of_birth' => $this->faker->dateTimeBetween('-65 years', '-18 years')->format('Y-m-d'),
            'jmbg' => $this->faker->unique()->numerify('#############'), // 13 cifara.
            'role' => 'CITIZEN',
        ];
    }

    public function citizen(): static
    {
        return $this->state(fn () => ['role' => 'CITIZEN']);
    }

    public function officer(): static
    {
        return $this->state(fn () => ['role' => 'OFFICER']);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => 'ADMIN']);
    }
}
