<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Service */
class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'institution_id' => $this->institution_id,

            'name' => $this->name,
            'description' => $this->description,
            'fee' => (float) $this->fee,
            'requires_attachment' => (bool) $this->requires_attachment,
            'status' => $this->status,

            'institution' => new InstitutionResource($this->whenLoaded('institution')),
            'fields' => ServiceFieldResource::collection($this->whenLoaded('fields')),

            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
