<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Database\Seeder;

class ServiceRequestSeeder extends Seeder
{
    public function run(): void
    {
        $citizens = User::where('role', 'CITIZEN')->get();
        $officers = User::where('role', 'OFFICER')->get();
        $services = Service::with('fields')->get();

        foreach ($citizens as $citizen) {
            // Svaki građanin dobije 2 zahteva, za demonstraciju veza.
            for ($i = 0; $i < 2; $i++) {
                $service = $services->random();

                // Distribucija statusa.
                $statusPool = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED'];
                $status = $statusPool[array_rand($statusPool)];

                $officerId = null;
                $officerNote = null;

                if (in_array($status, ['IN_REVIEW', 'APPROVED', 'REJECTED'], true)) {
                    $officerId = $officers->random()->id;
                    $officerNote = $status === 'REJECTED'
                        ? 'Nedostaju podaci ili dokumentacija.'
                        : 'Zahtev je pregledan i evidentiran.';
                }

                // Form data se gradi iz definisanih polja.
                $formData = [];
                foreach ($service->fields as $field) {
                    $formData[$field->key] = $this->fakeValueForField($field->data_type, $field->options);
                }

                // Attachment logika (ako servis to traži).
                $attachment = null;
                if ((bool) $service->requires_attachment) {
                    $attachment = 'uploads/demo/attachment_' . $citizen->id . '_' . now()->timestamp . '.pdf';
                }

                // Payment logika.
                $paymentStatus = 'NOT_REQUIRED';
                $paymentDate = null;

                if ((float) $service->fee > 0) {
                    if ($status === 'APPROVED') {
                        $paymentStatus = 'PAID';
                        $paymentDate = now()->subDays(rand(0, 10));
                    } else {
                        $paymentStatus = 'NOT_PAID';
                    }
                }

                ServiceRequest::factory()->create([
                    'user_id' => $citizen->id,
                    'service_id' => $service->id,
                    'processed_by' => $officerId,
                    'status' => $status,
                    'citizen_note' => 'Molim obradu zahteva.',
                    'officer_note' => $officerNote,
                    'attachment' => $attachment,
                    'form_data' => $formData,
                    'payment_status' => $paymentStatus,
                    'payment_date' => $paymentDate,
                ]);
            }
        }
    }

    private function fakeValueForField(string $dataType, $options)
    {
        return match ($dataType) {
            'STRING' => fake()->words(3, true),
            'NUMBER' => fake()->numberBetween(1, 5),
            'DATE' => fake()->dateTimeBetween('now', '+20 days')->format('Y-m-d'),
            'BOOLEAN' => fake()->boolean(),
            'SELECT' => is_array($options) && count($options) > 0 ? $options[array_rand($options)] : null,
            'FILE' => 'uploads/demo/file_' . now()->timestamp . '.pdf',
            default => null,
        };
    }
}
