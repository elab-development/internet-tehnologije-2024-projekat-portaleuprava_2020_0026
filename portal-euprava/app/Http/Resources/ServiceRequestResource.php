<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ServiceRequest */
class ServiceRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'user_id' => $this->user_id,
            'service_id' => $this->service_id,
            'processed_by' => $this->processed_by,

            'status' => $this->status,

            'citizen_note' => $this->citizen_note,
            'officer_note' => $this->officer_note,

            'attachment' => $this->attachment,
            'form_data' => $this->form_data,

            'payment_status' => $this->payment_status,
            'payment_date' => optional($this->payment_date)->toISOString(),

            // Relacije se vraćaju kada su učitane.
            'citizen' => new UserResource($this->whenLoaded('citizen')),
            'officer' => new UserResource($this->whenLoaded('officer')),
            'service' => new ServiceResource($this->whenLoaded('service')),

            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
