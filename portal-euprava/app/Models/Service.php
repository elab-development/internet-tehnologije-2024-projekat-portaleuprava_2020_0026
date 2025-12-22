<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    // Pretpostavka: institution_id, name, description, fee, requires_attachment, status.
    protected $fillable = [
        'institution_id',
        'name',
        'description',
        'fee',
        'requires_attachment',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'fee' => 'decimal:2',
            'requires_attachment' => 'boolean',
        ];
    }

    // N Service -> 1 Institution.
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class, 'institution_id');
    }

    // 1 Service -> N ServiceField (definicija polja forme).
    public function fields(): HasMany
    {
        return $this->hasMany(ServiceField::class, 'service_id');
    }

    // 1 Service -> N ServiceRequest (zahtevi za taj servis).
    public function requests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class, 'service_id');
    }
}
