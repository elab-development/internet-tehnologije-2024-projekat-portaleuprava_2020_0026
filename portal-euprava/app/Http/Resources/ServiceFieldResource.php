<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ServiceField */
class ServiceFieldResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_id' => $this->service_id,

            'key' => $this->key,
            'label' => $this->label,
            'data_type' => $this->data_type,
            'is_required' => (bool) $this->is_required,

            'options' => $this->options,
            'validation_rules' => $this->validation_rules,
            'sort_order' => (int) $this->sort_order,

            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
