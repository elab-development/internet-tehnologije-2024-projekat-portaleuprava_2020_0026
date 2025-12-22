<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceField extends Model
{
    // Pretpostavka: service_id, key, label, data_type, is_required, options, validation_rules, sort_order.
    protected $fillable = [
        'service_id',
        'key',
        'label',
        'data_type',
        'is_required',
        'options',
        'validation_rules',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'options' => 'array',
            'validation_rules' => 'array',
            'sort_order' => 'integer',
        ];
    }

    // N ServiceField -> 1 Service.
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_id');
    }
}
