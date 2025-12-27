<?php

namespace Database\Factories;

use App\Models\Service;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServiceRequest>
 */
class ServiceRequestFactory extends Factory
{
    protected $model = ServiceRequest::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->citizen(),
            'service_id' => Service::factory(),

            // Officer is optional.
            'processed_by' => null,

            'status' => 'DRAFT',
            'citizen_note' => $this->faker->sentence(),
            'officer_note' => null,

            'attachment' => null,
            'form_data' => [],

            'payment_status' => 'NOT_REQUIRED',
            'payment_date' => null,
        ];
    }

    public function submitted(): static
    {
        return $this->state(fn () => ['status' => 'SUBMITTED']);
    }

    public function inReview(int $officerId): static
    {
        return $this->state(fn () => [
            'status' => 'IN_REVIEW',
            'processed_by' => $officerId,
        ]);
    }

    public function approved(int $officerId): static
    {
        return $this->state(fn () => [
            'status' => 'APPROVED',
            'processed_by' => $officerId,
        ]);
    }

    public function rejected(int $officerId): static
    {
        return $this->state(fn () => [
            'status' => 'REJECTED',
            'processed_by' => $officerId,
        ]);
    }
}
